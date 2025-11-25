# 🚀 How to Run ThreadChain

## ✅ Your Backend is Already Running!

If you see this in your terminal:
```
🚀 ThreadChain Backend Server running on port 3001
✅ Database connected successfully
✅ Genesis block created
```

**Keep that terminal open!** Your backend is working perfectly.

---

## 🎯 Now Start the Frontend

### **Option 1: Using the new command (Recommended)**

Open a **NEW PowerShell window** and run:

```powershell
npm run frontend
```

### **Option 2: Using Next.js directly**

Or run:

```powershell
npx next dev
```

---

## 📋 Complete Commands Reference

### **Terminal 1 - Backend (Already Running ✅)**
```powershell
npm run backend
```
**Status:** ✅ Running on port 3001

### **Terminal 2 - Frontend (Run This Now)**
```powershell
npm run frontend
```
**Will run on:** Port 3000

---

## 🌐 Open in Browser

Once the frontend starts, you'll see:
```
- ready started server on 0.0.0.0:3000
- Local:        http://localhost:3000
```

Then open: **http://localhost:3000**

---

## 🔧 All Available Commands

```powershell
# Backend
npm run backend          # Start backend (production)
npm run backend:dev      # Start backend (development with auto-reload)

# Frontend
npm run frontend         # Start frontend (development)
npm run frontend:build   # Build frontend for production
npm run frontend:start   # Start frontend (production)

# Database
npm run init-db          # Initialize database

# Testing
npm run test             # Test API endpoints
```

---

## ⚠️ Important Notes

1. **Backend uses port 3001** - Keep it running in one terminal
2. **Frontend uses port 3000** - Run in a separate terminal
3. **Don't close the terminals** - Both need to stay open
4. **Backend must start first** - Frontend needs backend API

---

## 🐛 If Frontend Won't Start

### Error: "next: command not found"

**Solution:**
```powershell
npm install next react react-dom
npm run frontend
```

### Error: "Port 3000 already in use"

**Solution:**
```powershell
# Kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or use different port
npx next dev -p 3001
```

---

## ✅ Success Checklist

- [ ] Backend running on port 3001
- [ ] Frontend running on port 3000
- [ ] Can access http://localhost:3001/api/health
- [ ] Can access http://localhost:3000
- [ ] Can login to frontend

---

## 🎉 You're Done!

Just run:
1. **Terminal 1:** `npm run backend` (already running ✅)
2. **Terminal 2:** `npm run frontend` (run this now)
3. **Browser:** http://localhost:3000

Enjoy ThreadChain! 🚀