# Feature-Based Branch Organization Plan

## Current Status
- You're on: `frontend` branch
- Existing remote branches: blockchain, dashboard, login_page, main

## Feature-Based Branch Structure

### 1. **feature/login** - Login Page
**Files to keep:**
- `app/login/page.tsx`
- `app/page.tsx` (home/login page)
- `app/layout.tsx`
- `app/globals.css`
- `components/ui/` (all UI components)
- `components/theme-provider.tsx`
- `components/theme-toggle.tsx`
- `public/`
- `styles/`
- Config files: `next.config.mjs`, `tsconfig.json`, `postcss.config.mjs`, `components.json`, `package.json`

**Files to remove:**
- `app/signup/`
- `app/dashboard/`
- `components/pages/` (all dashboard pages)
- `components/sidebar.tsx`
- `components/navbar.tsx`
- `server.js`, `routes/`, `config/`, `blockchain/`, `contracts/`, `ethereum/`, `scripts/`

---

### 2. **feature/signup** - Signup Page
**Files to keep:**
- `app/signup/page.tsx`
- `app/layout.tsx`
- `app/globals.css`
- `components/ui/` (all UI components)
- `components/theme-provider.tsx`
- `components/theme-toggle.tsx`
- `public/`
- `styles/`
- Config files: `next.config.mjs`, `tsconfig.json`, `postcss.config.mjs`, `components.json`, `package.json`

**Files to remove:**
- `app/login/`
- `app/page.tsx`
- `app/dashboard/`
- `components/pages/` (all dashboard pages)
- `components/sidebar.tsx`
- `components/navbar.tsx`
- `server.js`, `routes/`, `config/`, `blockchain/`, `contracts/`, `ethereum/`, `scripts/`

---

### 3. **feature/dashboard-overview** - Dashboard Main Page
**Files to keep:**
- `app/dashboard/page.tsx`
- `app/layout.tsx`
- `app/globals.css`
- `components/pages/dashboard-overview.tsx`
- `components/sidebar.tsx`
- `components/navbar.tsx`
- `components/stat-card.tsx`
- `components/ui/` (all UI components)
- `components/theme-provider.tsx`
- `components/theme-toggle.tsx`
- `public/`, `styles/`
- Config files

**Files to remove:**
- `app/login/`, `app/signup/`, `app/page.tsx`
- Other dashboard pages: `feed-management.tsx`, `knowledge-graph.tsx`, etc.
- Backend files

---

### 4. **feature/feed-management** - Feed Management Page
**Files to keep:**
- `app/dashboard/page.tsx`
- `components/pages/feed-management.tsx`
- `components/sidebar.tsx`
- `components/navbar.tsx`
- `components/ui/`
- All necessary config and layout files

**Files to remove:**
- Login/signup pages
- Other dashboard pages

---

### 5. **feature/knowledge-graph** - Knowledge Graph Visualization
**Files to keep:**
- `app/dashboard/page.tsx`
- `components/pages/knowledge-graph.tsx`
- `components/sidebar.tsx`
- `components/navbar.tsx`
- `components/ui/`
- All necessary config and layout files

---

### 6. **feature/trust-provenance** - Trust & Provenance Page
**Files to keep:**
- `app/dashboard/page.tsx`
- `components/pages/trust-provenance.tsx`
- `components/sidebar.tsx`
- `components/navbar.tsx`
- `components/ui/`

---

### 7. **feature/blockchain-demo** - Blockchain Demo Page
**Files to keep:**
- `app/dashboard/page.tsx`
- `components/pages/blockchain-demo.tsx`
- `components/sidebar.tsx`
- `components/navbar.tsx`
- `components/ui/`
- `blockchain/` folder (if needed for demo)

---

### 8. **feature/sharing-reports** - Sharing Reports Page
**Files to keep:**
- `app/dashboard/page.tsx`
- `components/pages/sharing-reports.tsx`
- `components/sidebar.tsx`
- `components/navbar.tsx`
- `components/ui/`

---

### 9. **feature/policy-validation** - Policy Validation Page
**Files to keep:**
- `app/dashboard/page.tsx`
- `components/pages/policy-validation.tsx`
- `components/sidebar.tsx`
- `components/navbar.tsx`
- `components/ui/`

---

### 10. **feature/clients** - Clients Management Page
**Files to keep:**
- `app/dashboard/page.tsx`
- `components/pages/clients.tsx`
- `components/sidebar.tsx`
- `components/navbar.tsx`
- `components/ui/`

---

### 11. **feature/backend-api** - Backend API
**Files to keep:**
- `server.js`
- `routes/`
- `config/`
- `scripts/`
- `test-api.js`
- `test-backend-connection.js`
- `generate_test_csv.py`
- `sample-*.json`
- `package.json`

**Files to remove:**
- All frontend files (`app/`, `components/`, `public/`, `styles/`)
- Next.js config files

---

### 12. **feature/blockchain** - Blockchain Integration
**Files to keep:**
- `blockchain/`
- `contracts/`
- `ethereum/`
- Ethereum setup scripts
- `ETHEREUM-SETUP-GUIDE.md`
- `PRIVATE-ETHEREUM-SETUP.md`

---

### 13. **main** - Full Integration
**Keep everything** - This is the complete working project

---

## Step-by-Step Commands

### Currently on: `frontend` branch

Let's create each feature branch from main:

```bash
# Go back to main
git checkout main

# 1. Create login branch
git checkout -b feature/login
# Keep only login-related files
rm -rf app/signup app/dashboard
rm -rf components/pages components/sidebar.tsx components/navbar.tsx components/stat-card.tsx
rm -rf server.js routes/ config/ blockchain/ contracts/ ethereum/ scripts/ docs/
rm -rf sample-*.json *.bat test-*.js generate_test_csv.py
git add .
git commit -m "Feature: Login page only"
git push origin feature/login

# 2. Create signup branch
git checkout main
git checkout -b feature/signup
rm -rf app/login app/dashboard app/page.tsx
rm -rf components/pages components/sidebar.tsx components/navbar.tsx components/stat-card.tsx
rm -rf server.js routes/ config/ blockchain/ contracts/ ethereum/ scripts/ docs/
rm -rf sample-*.json *.bat test-*.js generate_test_csv.py
git add .
git commit -m "Feature: Signup page only"
git push origin feature/signup

# 3. Create dashboard-overview branch
git checkout main
git checkout -b feature/dashboard-overview
rm -rf app/login app/signup app/page.tsx
find components/pages -type f ! -name 'dashboard-overview.tsx' -delete
rm -rf server.js routes/ config/ blockchain/ contracts/ ethereum/ scripts/ docs/
rm -rf sample-*.json *.bat test-*.js generate_test_csv.py
git add .
git commit -m "Feature: Dashboard overview page"
git push origin feature/dashboard-overview

# 4. Create feed-management branch
git checkout main
git checkout -b feature/feed-management
rm -rf app/login app/signup app/page.tsx
find components/pages -type f ! -name 'feed-management.tsx' -delete
rm -rf server.js routes/ config/ blockchain/ contracts/ ethereum/ scripts/ docs/
rm -rf sample-*.json *.bat test-*.js generate_test_csv.py
git add .
git commit -m "Feature: Feed management page"
git push origin feature/feed-management

# 5. Create knowledge-graph branch
git checkout main
git checkout -b feature/knowledge-graph
rm -rf app/login app/signup app/page.tsx
find components/pages -type f ! -name 'knowledge-graph.tsx' -delete
rm -rf server.js routes/ config/ blockchain/ contracts/ ethereum/ scripts/ docs/
rm -rf sample-*.json *.bat test-*.js generate_test_csv.py
git add .
git commit -m "Feature: Knowledge graph visualization"
git push origin feature/knowledge-graph

# 6. Create trust-provenance branch
git checkout main
git checkout -b feature/trust-provenance
rm -rf app/login app/signup app/page.tsx
find components/pages -type f ! -name 'trust-provenance.tsx' -delete
rm -rf server.js routes/ config/ blockchain/ contracts/ ethereum/ scripts/ docs/
rm -rf sample-*.json *.bat test-*.js generate_test_csv.py
git add .
git commit -m "Feature: Trust and provenance page"
git push origin feature/trust-provenance

# 7. Create blockchain-demo branch
git checkout main
git checkout -b feature/blockchain-demo
rm -rf app/login app/signup app/page.tsx
find components/pages -type f ! -name 'blockchain-demo.tsx' -delete
rm -rf server.js routes/ config/ scripts/ docs/
rm -rf sample-*.json *.bat test-*.js generate_test_csv.py
git add .
git commit -m "Feature: Blockchain demo page"
git push origin feature/blockchain-demo

# 8. Create sharing-reports branch
git checkout main
git checkout -b feature/sharing-reports
rm -rf app/login app/signup app/page.tsx
find components/pages -type f ! -name 'sharing-reports.tsx' -delete
rm -rf server.js routes/ config/ blockchain/ contracts/ ethereum/ scripts/ docs/
rm -rf sample-*.json *.bat test-*.js generate_test_csv.py
git add .
git commit -m "Feature: Sharing reports page"
git push origin feature/sharing-reports

# 9. Create policy-validation branch
git checkout main
git checkout -b feature/policy-validation
rm -rf app/login app/signup app/page.tsx
find components/pages -type f ! -name 'policy-validation.tsx' -delete
rm -rf server.js routes/ config/ blockchain/ contracts/ ethereum/ scripts/ docs/
rm -rf sample-*.json *.bat test-*.js generate_test_csv.py
git add .
git commit -m "Feature: Policy validation page"
git push origin feature/policy-validation

# 10. Create clients branch
git checkout main
git checkout -b feature/clients
rm -rf app/login app/signup app/page.tsx
find components/pages -type f ! -name 'clients.tsx' -delete
rm -rf server.js routes/ config/ blockchain/ contracts/ ethereum/ scripts/ docs/
rm -rf sample-*.json *.bat test-*.js generate_test_csv.py
git add .
git commit -m "Feature: Clients management page"
git push origin feature/clients

# 11. Create backend-api branch
git checkout main
git checkout -b feature/backend-api
rm -rf app/ components/ public/ styles/ hooks/
rm next.config.mjs tsconfig.json postcss.config.mjs components.json next-env.d.ts
rm -rf blockchain/ contracts/ ethereum/ docs/
rm *.bat
git add .
git commit -m "Feature: Backend API only"
git push origin feature/backend-api

# 12. Update blockchain branch (if needed)
git checkout main
git checkout -b feature/blockchain
rm -rf app/ components/ public/ styles/ hooks/
rm -rf server.js routes/ config/ scripts/ docs/
rm next.config.mjs tsconfig.json postcss.config.mjs components.json next-env.d.ts
rm -rf sample-*.json test-*.js generate_test_csv.py
git add .
git commit -m "Feature: Blockchain integration only"
git push origin feature/blockchain
```

---

## Summary

After running these commands, you'll have **13 feature branches**:

✅ **feature/login** - Login page  
✅ **feature/signup** - Signup page  
✅ **feature/dashboard-overview** - Dashboard main  
✅ **feature/feed-management** - Feed management  
✅ **feature/knowledge-graph** - Knowledge graph  
✅ **feature/trust-provenance** - Trust & provenance  
✅ **feature/blockchain-demo** - Blockchain demo  
✅ **feature/sharing-reports** - Sharing reports  
✅ **feature/policy-validation** - Policy validation  
✅ **feature/clients** - Clients management  
✅ **feature/backend-api** - Backend API  
✅ **feature/blockchain** - Blockchain integration  
✅ **main** - Full integrated project

Each branch contains only the files relevant to that specific feature!
