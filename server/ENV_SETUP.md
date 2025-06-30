# 🔧 Socket.IO Server Environment Setup Guide

## 📋 **Environment Variables Explained**

Your `server/.env` file needs these variables:

### **1. Server Configuration** ✅ (Already Set)
```bash
PORT=3001                    # Socket.IO server port
NODE_ENV=development         # Environment mode
LOG_LEVEL=info              # Logging level
```
**✅ These are fine as default values**

### **2. Supabase Configuration** ⚠️ (Needs Your Values)
```bash
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### **3. CORS Configuration** ✅ (Default OK)
```bash
ALLOWED_ORIGINS=http://localhost:3000
```

---

## 🔑 **How to Get Supabase Credentials**

### **Step 1: Get Supabase URL**
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your CollabCode project
3. Go to **Settings → API**
4. Copy the **Project URL**
   - Example: `https://abcdefghijklmnop.supabase.co`

### **Step 2: Get Service Role Key**
1. In the same **Settings → API** page
2. Find the **service_role** key (NOT the anon key)
3. Click the eye icon to reveal it
4. Copy the **service_role** key
   - Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

⚠️ **Important**: Use the **service_role** key for the server (has admin access)

---

## ⚙️ **Quick Setup Commands**

### **Option 1: Manual Edit**
Open `server/.env` in VS Code and replace the values:

```bash
# Replace these lines in server/.env:
SUPABASE_URL=https://YOUR_ACTUAL_PROJECT_URL.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_ACTUAL_SERVICE_ROLE_KEY
```

### **Option 2: Use PowerShell** (if you have the values)
```powershell
# Navigate to server directory
cd e:\Collabcode\server

# Replace with your actual values
(Get-Content .env) -replace 'https://your-project-ref.supabase.co', 'https://YOUR_PROJECT_URL.supabase.co' | Set-Content .env
(Get-Content .env) -replace 'your_service_role_key_here', 'YOUR_ACTUAL_SERVICE_ROLE_KEY' | Set-Content .env
```

---

## ✅ **Final `.env` File Should Look Like:**

```bash
# Socket.IO Server Environment Variables
PORT=3001
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=https://abcdefghijklmnop.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSI...

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000

# Logging
LOG_LEVEL=info
```

---

## 🧪 **Test Your Setup**

After updating the `.env` file:

1. **Install dependencies:**
   ```bash
   cd e:\Collabcode\server
   npm install
   ```

2. **Test the server:**
   ```bash
   npm run dev
   ```

3. **Look for success messages:**
   ```
   🚀 CollabCode Socket.IO Server running on port 3001
   📡 Accepting connections from: http://localhost:3000
   ```

---

## 🚨 **Common Issues**

### ❌ "Invalid Supabase URL"
- **Fix**: Make sure URL starts with `https://` and ends with `.supabase.co`

### ❌ "Authentication failed"
- **Fix**: Double-check you're using the **service_role** key (not anon key)

### ❌ "CORS errors"
- **Fix**: Ensure `ALLOWED_ORIGINS` includes your client URL

---

## 🔐 **Security Notes**

- ✅ **Never commit** `.env` files to git
- ✅ **Use service_role key** only on the server (never in client)
- ✅ **Keep credentials secure** and don't share them

Once you have your Supabase credentials, just update the `.env` file and you're ready to go! 🚀
