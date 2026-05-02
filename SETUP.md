# 🚀 Orbx Retail ERP - Detailed Setup Guide

This guide will walk you through setting up the Orbx Retail ERP from scratch. Follow every step carefully.

---

## 🛠 Step 1: Verify Prerequisites
Before starting, ensure you have the necessary tools installed. Open your terminal (PowerShell or CMD) and run:

1. **Check Node.js**: 
   ```bash
   node -v
   ```
   *Expected: v18.x.x or higher. If not found, download from [nodejs.org](https://nodejs.org/).*

2. **Check PostgreSQL**: 
   ```bash
   psql --version
   ```
   *Expected: psql (PostgreSQL) 14.x or higher. If not found, download from [postgresql.org](https://www.postgresql.org/download/windows/).*

---

## 🗄 Step 2: Database Initialization
We need to create the database and the tables.

1. **Log into PostgreSQL**:
   Open "SQL Shell (psql)" from your Start Menu or run:
   ```bash
   psql -U postgres
   ```
   *(Enter your password when prompted)*

2. **Create the Database**:
   Copy and paste this into the psql terminal:
   ```sql
   CREATE DATABASE orbx_erp;
   ```

3. **Connect to the Database**:
   ```sql
   \c orbx_erp
   ```

4. **Run the Schema Script**:
   Find the `database.sql` file in `orbx_erp/backend/database.sql` and run it:
   ```bash
   \i 'D:/Projects/OrbX Retail Suite/orbx_erp/backend/database.sql'
   ```
   *(Ensure the path matches your actual folder location)*

---

## ⚙️ Step 3: Backend Configuration
The backend connects the frontend to the database.

1. **Navigate to Backend**:
   ```bash
   cd "D:\Projects\OrbX Retail Suite\orbx_erp\backend"
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Create .env File**:
   Run this command to create the file directly:
   ```powershell
   echo "PORT=5000
   DATABASE_URL=postgres://postgres:YOUR_PASSWORD@localhost:5432/orbx_erp
   JWT_SECRET=orbx_secret_key_2026" > .env
   ```
   *⚠️ Replace `YOUR_PASSWORD` with your actual PostgreSQL password.*

4. **Start the Server**:
   ```bash
   npm run dev
   ```
   *Expected Output: `Server running on port 5000`*

---

## 💻 Step 4: Frontend Configuration
The frontend is the user interface you will interact with.

1. **Open a NEW Terminal tab** (Keep the backend running).

2. **Navigate to Frontend**:
   ```bash
   cd "D:\Projects\OrbX Retail Suite\orbx_erp\frontend"
   ```

3. **Install Dependencies**:
   ```bash
   npm install
   ```

4. **Start Development Server**:
   ```bash
   npm run dev
   ```
   *Expected Output: `Vite dev server running at http://localhost:5173`*

   > [!TIP]
   > If you are accessing the server from a different computer (e.g., via IP), use:
   > `npm run dev -- --host`
   > And ensure your firewall allows port 5173: `sudo ufw allow 5173/tcp`

---

## 🚦 Step 5: Testing the System
1. Open your browser and go to `http://localhost:5173`.
2. **Dashboard**: You should see the modern dashboard with placeholder stats.
3. **POS Module**: 
   - Click "POS / Billing" in the sidebar.
   - Try searching for a product (Note: You must add products via the DB or the "Products" module first).
   - Complete a mock sale.
4. **Offline Test**: 
   - Shut down the Backend terminal.
   - Perform a sale in the POS. It will save locally to IndexedDB.
   - Restart the Backend terminal. 
   - Watch the console or network tab; the sale will sync automatically within 30 seconds.

---

## 🧩 Step 6: Next Phase (Studio & Users)
The `Studio` and `User Management` modules are currently blueprints. To activate them:
1. Copy your existing logic from the `OrbX Retail Suite` root.
2. Update the API endpoints in `frontend/src/utils/api.js` to point to the new Node.js backend.
3. Ensure the SQL tables in `database.sql` match the fields required by your Studio configurations.

---

## 🔄 Step 7: Keep the App Always Running
To ensure the app stays online even after you close the terminal, use **PM2**:

1. **Install PM2**:
   ```bash
   sudo npm install -g pm2
   ```

2. **Start Backend**:
   ```bash
   cd backend
   pm2 start npm --name "orbx-backend" -- run dev
   ```

3. **Start Frontend**:
   ```bash
   cd frontend
   pm2 start npm --name "orbx-frontend" -- run dev -- --host
   ```

4. **Save the Process List**:
   ```bash
   pm2 save
   pm2 startup
   ```

---

## ❓ Troubleshooting
- **Error: EADDRINUSE**: Another process is using port 5000 or 5173. Restart your computer or kill the process.
- **Connection Refused**: Your PostgreSQL service is not running. Open "Services" in Windows and start `postgresql-x64-16`.
