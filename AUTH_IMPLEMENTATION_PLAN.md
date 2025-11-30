# Authentication & Login Implementation Plan

## 📋 OVERVIEW

This plan implements:
1. **Login Page** (`/login`)
2. **Password Reset Flow** (`/forgot-password` → `/reset-password`)
3. **Simplified Admin** (single admin email check)
4. **Session Management** (cookie-based auth)
5. **Integration with Signup** (auto-login after signup)

---

## 🎯 AUTH SYSTEM CHOICE

**Option A: NextAuth.js (Recommended)**
- Industry standard for Next.js
- Built-in session management
- Easy to extend later
- Requires: `npm install next-auth @auth/prisma-adapter bcryptjs`

**Option B: Custom Cookie Sessions (Simpler)**
- Lightweight, no extra dependencies
- Full control
- Requires: `npm install bcryptjs jose` (for JWT) or just `bcryptjs` (for session tokens)

**RECOMMENDATION: Option B (Custom)** - Simpler for your use case, easier to understand

---

## 📦 DEPENDENCIES TO INSTALL

```bash
npm install bcryptjs
npm install --save-dev @types/bcryptjs
```

---

## 🗄️ DATABASE CHANGES

### 1. Update User Model
```prisma
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  passwordHash  String
  firstName     String
  lastName      String
  shevet        String
  role          String   // "Maddie" | "Channie"
  emailVerified DateTime?
  
  // Password reset fields
  resetToken        String?
  resetTokenExpires DateTime?

  teams        Team[]
  leaguesOwned League[]       @relation("LeagueOwner")
  memberships  LeagueMember[]
}
```

### 2. Migration
```bash
npx prisma migrate dev --name add_auth_fields
```

---

## 📁 FILE STRUCTURE

```
src/
├── lib/
│   ├── auth.ts          # NEW: Session helpers (getCurrentUser, signIn, signOut)
│   └── admin.ts         # UPDATE: Check single admin email
├── app/
│   ├── login/
│   │   ├── page.tsx     # NEW: Login page
│   │   └── actions.ts   # NEW: Login action
│   ├── forgot-password/
│   │   ├── page.tsx     # NEW: Request reset page
│   │   └── actions.ts   # NEW: Send reset email action
│   ├── reset-password/
│   │   ├── page.tsx     # NEW: Reset password page
│   │   └── actions.ts   # NEW: Reset password action
│   └── signup/
│       └── actions.ts   # UPDATE: Use new signIn helper
```

---

## 🔐 IMPLEMENTATION DETAILS

### 1. Session Management (`src/lib/auth.ts`)

**Cookie-based sessions:**
- Store session token in HTTP-only cookie
- Token = `userId:timestamp:signature`
- Validate on each request
- Expires after 7 days (configurable)

**Functions:**
```ts
// Get current user from session
export async function getCurrentUser(): Promise<User | null>

// Sign in user (set cookie)
export async function signIn(email: string, password: string): Promise<{ ok: boolean; error?: string }>

// Sign out user (clear cookie)
export async function signOut(): Promise<void>

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean>

// Hash password
export async function hashPassword(password: string): Promise<string>
```

### 2. Admin Check (`src/lib/admin.ts`)

**Simplified to single email:**
```ts
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@example.com";

export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.email === ADMIN_EMAIL;
}
```

**Environment variable:**
```env
ADMIN_EMAIL=your-email@example.com
```

### 3. Login Page (`/login`)

**Features:**
- Email + password form
- "Forgot password?" link
- "Sign up" link
- Error messages
- Redirect to `/home` on success
- Redirect to `/login` if already logged in (or show message)

**UI:**
- Simple form with Tailwind styling
- Matches existing design patterns
- Loading state during submission

### 4. Password Reset Flow

**Step 1: Forgot Password (`/forgot-password`)**
- Email input
- Generate reset token (random string)
- Store in DB: `resetToken` + `resetTokenExpires` (24 hours)
- Send email with reset link (or show token for now)
- Link format: `/reset-password?token=abc123`

**Step 2: Reset Password (`/reset-password?token=abc123`)**
- Validate token (exists, not expired)
- New password form (2 fields: password, confirm)
- Update password hash
- Clear reset token
- Auto-login user
- Redirect to `/home`

**Email Sending (Future):**
- For now: Show token on page or console.log
- Later: Integrate with email service (SendGrid, Resend, etc.)

### 5. Signup Integration

**Update signup action:**
- After creating user, call `signIn(email, password)`
- User is automatically logged in
- Redirect to `/home`

---

## 🔄 REQUEST FLOW

### Login Flow:
```
User → /login → Enter email/password → POST /login → 
Validate → Set session cookie → Redirect to /home
```

### Password Reset Flow:
```
User → /forgot-password → Enter email → Generate token → 
Show token (or email) → User clicks link → /reset-password?token=xyz → 
Enter new password → Update DB → Auto-login → Redirect to /home
```

### Protected Routes:
```
Any page → getCurrentUser() → If null → Redirect to /login
```

---

## 🛡️ SECURITY CONSIDERATIONS

1. **Password Hashing:** Use bcryptjs with salt rounds (10)
2. **Session Tokens:** Use secure, HTTP-only cookies
3. **Reset Tokens:** 
   - Random, unguessable strings
   - Expire after 24 hours
   - Single-use (clear after use)
4. **Rate Limiting:** (Future) Limit login attempts
5. **CSRF Protection:** Next.js handles this automatically

---

## 📝 UPDATES TO EXISTING CODE

### Files to Update:

1. **`src/app/pick-team/page.tsx`**
   - Replace `prisma.user.findFirstOrThrow()` with `getCurrentUser()`
   - Redirect to `/login` if not authenticated

2. **`src/app/transfers/page.tsx`**
   - Replace `prisma.user.findFirstOrThrow()` with `getCurrentUser()`
   - Redirect to `/login` if not authenticated

3. **`src/app/admin/**`**
   - Use `isAdmin()` helper
   - Redirect to `/login` if not admin

4. **`src/lib/admin.ts`**
   - Simplify to single email check

---

## 🎨 UI COMPONENTS

### Login Page:
- Email input
- Password input
- "Sign In" button
- "Forgot password?" link
- "Don't have an account? Sign up" link
- Error message display

### Forgot Password Page:
- Email input
- "Send Reset Link" button
- Success message (with token for now)
- "Back to login" link

### Reset Password Page:
- New password input
- Confirm password input
- "Reset Password" button
- Error message display
- Token validation message

---

## ✅ IMPLEMENTATION CHECKLIST

### Phase 1: Core Auth
- [ ] Install dependencies (bcryptjs)
- [ ] Update Prisma schema (add resetToken fields)
- [ ] Run migration
- [ ] Create `src/lib/auth.ts` with session helpers
- [ ] Update `src/lib/admin.ts` for single admin
- [ ] Create `.env.local` with `ADMIN_EMAIL`

### Phase 2: Login
- [ ] Create `/login` page
- [ ] Create login action
- [ ] Add "Sign In" link to nav (if not logged in)
- [ ] Add "Sign Out" link to nav (if logged in)
- [ ] Test login flow

### Phase 3: Password Reset
- [ ] Create `/forgot-password` page
- [ ] Create forgot password action
- [ ] Create `/reset-password` page
- [ ] Create reset password action
- [ ] Test reset flow

### Phase 4: Integration
- [ ] Update existing pages to use `getCurrentUser()`
- [ ] Add redirects for unauthenticated users
- [ ] Update signup to auto-login
- [ ] Test all protected routes

### Phase 5: Polish
- [ ] Add loading states
- [ ] Improve error messages
- [ ] Add "Remember me" option (optional)
- [ ] Style consistency check

---

## 🚀 ENVIRONMENT VARIABLES

Add to `.env.local`:
```env
ADMIN_EMAIL=your-email@example.com
SESSION_SECRET=your-random-secret-key-here  # For signing session tokens
```

Generate SESSION_SECRET:
```bash
# On Linux/Mac:
openssl rand -base64 32

# Or use any random string generator
```

---

## 📊 TESTING SCENARIOS

1. **Login:**
   - Valid credentials → Success
   - Invalid email → Error
   - Invalid password → Error
   - Already logged in → Redirect or message

2. **Password Reset:**
   - Valid email → Token generated
   - Invalid email → Error (don't reveal if email exists)
   - Valid token → Reset allowed
   - Expired token → Error
   - Invalid token → Error

3. **Protected Routes:**
   - Not logged in → Redirect to `/login`
   - Logged in → Access granted
   - Admin route → Check admin status

---

## 🔮 FUTURE ENHANCEMENTS (Not in this plan)

- Email sending for password reset
- "Remember me" checkbox
- Rate limiting
- Two-factor authentication
- Social login (Google, etc.)
- Password strength meter
- Account deletion

---

## ❓ QUESTIONS TO CONSIDER

1. **Session Duration:** How long should sessions last? (Default: 7 days)
2. **Reset Token Display:** Show token on page, or require email setup?
3. **Nav Updates:** Show user email/name when logged in?
4. **Redirect After Login:** Always go to `/home`, or remember intended destination?

---

## 📌 NOTES

- Password reset tokens will be shown on the page for now (no email service yet)
- Admin email is set via environment variable (single admin only)
- All password operations use bcryptjs for security
- Sessions are stored in HTTP-only cookies (secure by default in production)

