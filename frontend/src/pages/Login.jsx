import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { tokens as T } from '../design/tokens';
import Icon from '../components/Icon';
import toast from 'react-hot-toast';

const API_URL = `http://${window.location.hostname}:5000`;

export default function Login() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Please fill in all fields');

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        toast.success('Login Successful!');
        navigate('/');
      } else {
        toast.error(data.error || 'Login failed');
      }
    } catch (err) {
      toast.error('Network error. Is the backend running?');
    }
    setLoading(false);
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: T.colors.brand,
      padding: 20
    }}>
      <style>{`
        .login-card {
          width: 100%;
          max-width: 400px;
          background: ${T.colors.bgCard};
          border-radius: ${T.radius.xl};
          padding: 40px;
          box-shadow: ${T.shadows.xl};
          animation: fadeIn 0.5s ease;
        }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div className="login-card">
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ 
            width: 54, height: 54, 
            background: T.colors.accent, 
            borderRadius: T.radius.lg, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            margin: '0 auto 16px',
            boxShadow: `0 8px 24px ${T.colors.accent}40`
          }}>
            <span style={{ fontSize: 28, fontWeight: 900, color: T.colors.brand }}>O</span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: T.colors.brand, letterSpacing: '-0.03em' }}>OrbX ERP</h1>
          <p style={{ fontSize: 13, color: T.colors.textMuted, fontWeight: 500, marginTop: 4 }}>Premium Retail ERP Suite</p>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: T.colors.textMid, marginBottom: 8, display: 'block', textTransform: 'uppercase' }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>
                <Icon name="user" size={16} color={T.colors.textMuted} />
              </div>
              <input 
                className="orbx-input" 
                style={{ paddingLeft: 40 }}
                type="email" 
                placeholder="admin@orbxerp.com" 
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: T.colors.textMid, marginBottom: 8, display: 'block', textTransform: 'uppercase' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>
                <Icon name="settings" size={16} color={T.colors.textMuted} />
              </div>
              <input 
                className="orbx-input" 
                style={{ paddingLeft: 40 }}
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="orbx-btn orbx-btn-primary" 
            style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: 15 }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In to Portal'}
          </button>
        </form>

        <div style={{ marginTop: 32, textAlign: 'center', borderTop: `1px solid ${T.colors.border}`, paddingTop: 24 }}>
          <p style={{ fontSize: 12, color: T.colors.textMuted }}>
            Don't have an account? <span style={{ color: T.colors.accent, fontWeight: 700, cursor: 'pointer' }}>Contact Admin</span>
          </p>
        </div>
      </div>
    </div>
  );
}
