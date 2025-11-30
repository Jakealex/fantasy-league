# Testing Guide - Authentication System

## 🚀 Quick Start

### 1. Update Seed File (Create Test User)

First, let's update the seed to create a test user with a real password hash:

```bash
# We'll create a script to hash a password
```

### 2. Test User Credentials

**Test User:**
- Email: `admin@example.com`
- Password: `password123` (or whatever you set)

**Admin Users (already configured):**
- `jakeshapiro007@gmail.com`
- `jboner2111@gmail.com`

---

## 📋 Testing Steps

### Step 1: Create Test User

Run the seed to create a test user:

```bash
npm run db:seed
```

**OR** manually create a user via Prisma Studio:

```bash
npx prisma studio
```

Then create a user with:
- Email: `test@example.com`
- Password Hash: (use the script below to generate)

### Step 2: Generate Password Hash

Create a quick script to hash passwords:

```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('password123', 10).then(h => console.log(h))"
```

Copy the hash and use it in Prisma Studio or seed file.

### Step 3: Start Dev Server

```bash
npm run dev
```

Server should start at `http://localhost:3000`

---

## 🧪 Test Scenarios

### ✅ Test 1: Access Protected Route (Not Logged In)

1. Open browser in **incognito/private mode**
2. Navigate to: `http://localhost:3000/pick-team`
3. **Expected:** Redirected to `/login`

### ✅ Test 2: Login with Valid Credentials

1. Go to: `http://localhost:3000/login`
2. Enter:
   - Email: `admin@example.com` (or your test user)
   - Password: `password123`
3. Click "Sign In"
4. **Expected:** Redirected to home page (`/`)
5. **Expected:** "Sign Out" button appears in nav

### ✅ Test 3: Login with Invalid Credentials

1. Go to: `http://localhost:3000/login`
2. Enter wrong email/password
3. Click "Sign In"
4. **Expected:** Error message: "Invalid email or password"

### ✅ Test 4: Access Protected Routes (Logged In)

1. After logging in, navigate to:
   - `/pick-team` ✅ Should work
   - `/transfers` ✅ Should work
   - `/admin/gameweeks` ✅ Should work (if admin)
   - `/admin/transfers` ✅ Should work (if admin)

### ✅ Test 5: Sign Out

1. Click "Sign Out" button in nav
2. **Expected:** Redirected to `/login`
3. Try accessing `/pick-team` again
4. **Expected:** Redirected back to `/login`

### ✅ Test 6: Password Reset Flow

#### 6a. Request Reset Token

1. Go to: `http://localhost:3000/forgot-password`
2. Enter a valid email (e.g., `admin@example.com`)
3. Click "Send Reset Link"
4. **Expected:** Token displayed on page (since no email service yet)
5. Copy the token

#### 6b. Reset Password

1. Click the reset link or go to: `http://localhost:3000/reset-password?token=YOUR_TOKEN`
2. Enter new password (min 6 chars)
3. Confirm password
4. Click "Reset Password"
5. **Expected:** Auto-logged in and redirected to home

#### 6c. Login with New Password

1. Sign out
2. Try logging in with old password
3. **Expected:** Should fail
4. Try logging in with new password
5. **Expected:** Should succeed

### ✅ Test 7: Admin Access

1. Create a user with email: `jakeshapiro007@gmail.com` (or `jboner2111@gmail.com`)
2. Login with that email
3. Navigate to: `/admin/gameweeks`
4. **Expected:** Should have access (admin page loads)
5. Create a user with different email (not admin)
6. Login with that email
7. Navigate to: `/admin/gameweeks`
8. **Expected:** Redirected to `/` (not admin)

### ✅ Test 8: Session Persistence

1. Login successfully
2. Close browser tab (but keep browser open)
3. Open new tab, go to: `http://localhost:3000/pick-team`
4. **Expected:** Should still be logged in (session persists)

### ✅ Test 9: Expired Reset Token

1. Request password reset
2. Wait 24+ hours (or manually expire token in DB)
3. Try to use the reset token
4. **Expected:** Error: "Invalid or expired reset token"

---

## 🛠️ Helper Scripts

### Create Password Hash Script

Create `scripts/hash-password.js`:

```js
const bcrypt = require('bcryptjs');
const password = process.argv[2] || 'password123';

bcrypt.hash(password, 10).then(hash => {
  console.log('Password:', password);
  console.log('Hash:', hash);
});
```

Run: `node scripts/hash-password.js yourpassword`

### Update Seed File

Update `prisma/seed.ts` to use real password hash:

```ts
import { hash } from 'bcryptjs';

// In main():
const passwordHash = await hash('password123', 10);
const user = await prisma.user.upsert({
  where: { email: 'admin@example.com' },
  update: {},
  create: {
    email: 'admin@example.com',
    passwordHash: passwordHash, // Real hash
  }
});
```

---

## 🐛 Troubleshooting

### Issue: "Invalid email or password" even with correct credentials

**Solution:** Check that password hash in DB matches. Regenerate hash and update user.

### Issue: Redirect loop on login

**Solution:** Check that `getCurrentUser()` is working. Check browser console for errors.

### Issue: "Sign Out" button not appearing

**Solution:** Check that session cookie is being set. Check browser DevTools > Application > Cookies.

### Issue: Admin access not working

**Solution:** 
1. Verify email matches exactly (case-insensitive)
2. Check `src/lib/admin.ts` has correct emails
3. Check environment variable `ADMIN_EMAILS` if set

---

## 📝 Notes

- **Session Duration:** 7 days
- **Reset Token Expiry:** 24 hours
- **Password Min Length:** 6 characters
- **Admin Emails:** Hardcoded in `src/lib/admin.ts` (can override with env var)

---

## ✅ Checklist

- [ ] Test user created with proper password hash
- [ ] Login page works
- [ ] Protected routes redirect to login
- [ ] Sign out works
- [ ] Password reset flow works
- [ ] Admin access works for admin emails
- [ ] Non-admin users can't access admin pages
- [ ] Session persists across tabs
