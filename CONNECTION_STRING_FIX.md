# Fixing Database Connection Issues

## Current Problem

You're getting: `Can't reach database server at db.prisma.io:5432`

## Solution: Get the Correct Connection String

### Step 1: Get Connection String from Prisma Dashboard

1. Go to your **Prisma Postgres dashboard**: https://console.prisma.io/
2. Select your database project
3. Go to **Settings** → **Connection** or **Database** tab
4. Look for **"Connection string"** or **"Connection URL"**

### Step 2: Choose the Right Connection String

Prisma Postgres provides **two types** of connection strings:

#### Option A: Direct Connection (Port 5432)
```
postgresql://USER:PASSWORD@db.prisma.io:5432/postgres?sslmode=require
```
- Used for: Direct database access
- May require IP allowlisting

#### Option B: Connection Pooler (Port 6543) ⭐ RECOMMENDED
```
postgresql://USER:PASSWORD@db.prisma.io:6543/postgres?sslmode=require
```
- Used for: Connection pooling (better for apps)
- Usually works without IP allowlisting
- **This is what we just tried**

### Step 3: Update Your `.env` File

Replace the `DATABASE_URL` in your `.env` file with the connection string from your Prisma dashboard.

**Current format in `.env`:**
```env
DATABASE_URL="postgresql://92d126e17ca68a7d8bc258c20a72b4e39df548e546adad7be9355920e0366dfa:sk_gzs2R21TS6wYa9lRnJdox@db.prisma.io:6543/postgres?sslmode=require"
```

### Step 4: Test the Connection

```bash
# Test connection
npx prisma db pull

# If that works, try Prisma Studio
npm run studio
```

---

## Alternative: Check Connection String Format

If the connection still fails, your Prisma dashboard might show a connection string in a different format. Common formats:

1. **With schema parameter:**
   ```
   postgresql://USER:PASSWORD@db.prisma.io:6543/postgres?sslmode=require&schema=public
   ```

2. **With connection pooler prefix:**
   ```
   postgresql://USER:PASSWORD@db.prisma.io:6543/postgres?pgbouncer=true&sslmode=require
   ```

3. **Different hostname:**
   - Some Prisma Postgres instances use different hostnames
   - Check your dashboard for the exact hostname

---

## If Still Not Working

1. **Check IP Allowlisting:**
   - In Prisma dashboard, check if IP allowlisting is enabled
   - If yes, add your current IP address

2. **Try Direct Connection:**
   - Use port 5432 instead of 6543
   - May require IP allowlisting

3. **Check Network/Firewall:**
   - Ensure your network allows outbound connections to `db.prisma.io`
   - Check if corporate firewall is blocking the connection

4. **Verify Credentials:**
   - Double-check the username and password in the connection string
   - Make sure there are no extra spaces or special characters

---

## Quick Test Commands

```bash
# Test if connection string is valid
npx prisma db pull

# Test Prisma Studio
npm run studio

# Check Prisma version
npx prisma --version
```

---

**Next Steps:**
1. Get the connection string from your Prisma dashboard
2. Update `.env` file with the exact string from dashboard
3. Test with `npx prisma db pull`
4. If successful, run `npm run studio`

