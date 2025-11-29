# ThreatChain Setup Instructions

## Prerequisites

- Node.js (v18 or higher)
- MySQL Server
- npm or pnpm

## Step-by-Step Setup

### 1. Install MySQL (if not installed)

```bash
sudo apt update
sudo apt install mysql-server
```

### 2. Start MySQL Service

```bash
sudo systemctl start mysql
sudo systemctl enable mysql
```

### 3. Run Database Setup Script

```bash
chmod +x setup-database.sh
./setup-database.sh
```

This will:
- Create `threadchain_db` database
- Create `threadchain_user` with password `threadchain_password`
- Create `.env` file with database credentials

### 4. Install Node Dependencies

```bash
npm install
```

### 5. Start the Application

**Option A: Automatic (opens 2 terminals)**
```bash
chmod +x *.sh
./start-all.sh
```

**Option B: Manual (2 separate terminals)**

Terminal 1 - Backend:
```bash
./start-backend.sh
```

Terminal 2 - Frontend:
```bash
./start-frontend.sh
```

### 6. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Health Check: http://localhost:3001/api/health

---

## Troubleshooting

### MySQL Connection Error

If you see `ECONNREFUSED 127.0.0.1:3306`:

1. Check if MySQL is running:
```bash
sudo systemctl status mysql
```

2. Start MySQL if not running:
```bash
sudo systemctl start mysql
```

3. Verify database exists:
```bash
mysql -u threadchain_user -p
# Password: threadchain_password
SHOW DATABASES;
```

### Port Already in Use

If port 3000 or 3001 is busy:

```bash
# Find process using port
sudo lsof -i :3000
sudo lsof -i :3001

# Kill process
sudo kill -9 <PID>
```

### Permission Denied on Scripts

```bash
chmod +x *.sh
```

---

## Database Configuration

Edit `.env` file to change database settings:

```env
DB_HOST=127.0.0.1
DB_USER=threadchain_user
DB_PASSWORD=threadchain_password
DB_NAME=threadchain_db
DB_PORT=3306
```

---

## Manual Database Setup

If the script doesn't work, run manually:

```bash
sudo mysql -u root -p
```

Then in MySQL:
```sql
CREATE DATABASE threadchain_db;
CREATE USER 'threadchain_user'@'localhost' IDENTIFIED BY 'threadchain_password';
GRANT ALL PRIVILEGES ON threadchain_db.* TO 'threadchain_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

---

## Quick Start (All-in-One)

```bash
# Install MySQL
sudo apt install mysql-server

# Setup database
chmod +x setup-database.sh
./setup-database.sh

# Install dependencies and run
chmod +x install-and-run.sh
./install-and-run.sh
```

Done! Open http://localhost:3000
