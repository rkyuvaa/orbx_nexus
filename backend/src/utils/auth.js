const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const pool = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'orbx-erp-secret-key-123';

const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
};

const verifyPassword = async (password, hash) => {
    return await bcrypt.compare(password, hash);
};

const generateToken = (payload) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
};

const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
};

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

    try {
        const verified = jwt.verify(token, JWT_SECRET);
        req.user = verified;
        next();
    } catch (err) {
        res.status(403).json({ error: 'Invalid token.' });
    }
};

const requireAdmin = (req, res, next) => {
    if (!req.user.is_superadmin) {
        return res.status(403).json({ error: 'Superadmin access required.' });
    }
    next();
};

const requireWarehouse = (req, res, next) => {
    if (!req.user.is_superadmin && !req.user.is_warehouse) {
        return res.status(403).json({ error: 'Warehouse/Head Office access required for this operation.' });
    }
    next();
};

/**
 * Granular Permission Middleware
 * @param {string} group - e.g. 'products'
 * @param {string} action - e.g. 'create'
 */
const hasPermission = (group, action) => {
    return async (req, res, next) => {
        if (req.user.is_superadmin) return next();

        try {
            // Fetch user's role and permissions
            const result = await pool.query(`
                SELECT r.role_type, r.permissions 
                FROM users u 
                JOIN roles r ON u.role_id = r.id 
                WHERE u.id = $1
            `, [req.user.id]);

            if (result.rows.length === 0) return res.status(403).json({ error: 'Role not found' });

            const { role_type, permissions } = result.rows[0];

            // Primary Operational Safeguard: Branch roles can NEVER do warehouse actions
            const warehouseActions = ['products:create', 'products:edit', 'purchases:create', 'purchases:edit', 'purchases:receive', 'inventory:adjust', 'inventory:transfer', 'transfers:dispatch', 'reports:view_all'];
            if (role_type === 'Branch' && warehouseActions.includes(`${group}:${action}`)) {
                return res.status(403).json({ error: 'Operation prohibited: This is a Warehouse-only operation.' });
            }

            // Check granular permission
            const groupPerms = permissions[group] || [];
            if (!groupPerms.includes(action)) {
                return res.status(403).json({ error: `Permission denied: Required [${group}:${action}]` });
            }

            next();
        } catch (err) {
            res.status(500).json({ error: 'Permission check failed' });
        }
    };
};

module.exports = {
    hashPassword,
    verifyPassword,
    generateToken,
    verifyToken,
    authenticateToken,
    requireAdmin,
    requireWarehouse,
    hasPermission
};
