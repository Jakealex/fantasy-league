# Fixing Prisma Studio `STUDIO_EMBED_BUILD` Error

## ✅ **Current Status**

Your Prisma installation is **correctly configured**:
- `prisma`: `6.17.0` ✅
- `@prisma/client`: `6.17.0` ✅
- Versions match perfectly ✅
- Prisma Client regenerated ✅

## 🔧 **Complete Fix for STUDIO_EMBED_BUILD Error**

The `STUDIO_EMBED_BUILD` error typically occurs when Prisma Studio's embedded build doesn't match your Prisma Client version. Here's the complete fix:

### **Step 1: Clear Prisma Cache**

```powershell
# Remove generated Prisma Client
Remove-Item -Recurse -Force node_modules\.prisma -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules\@prisma\client -ErrorAction SilentlyContinue

# Clear npm cache for Prisma
npm cache clean --force
```

### **Step 2: Regenerate Prisma Client**

```powershell
npx prisma generate
```

### **Step 3: Verify Installation**

```powershell
# Check versions match
npm list prisma @prisma/client

# Should show both at 6.17.0
```

### **Step 4: Start Prisma Studio Fresh**

```powershell
# Close any existing Prisma Studio instances first
# Then start fresh:
npm run studio
```

**Or:**
```powershell
npx prisma studio
```

---

## 🚨 **If Error Persists: Full Clean Reinstall**

If the error still occurs after the above steps, do a complete clean reinstall:

### **Complete Clean Reinstall**

```powershell
# 1. Stop any running Prisma Studio or dev servers

# 2. Remove all Prisma-related files
Remove-Item -Recurse -Force node_modules\.prisma -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules\@prisma -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules\prisma -ErrorAction SilentlyContinue

# 3. Remove node_modules and lock file
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json

# 4. Clear npm cache
npm cache clean --force

# 5. Reinstall everything
npm install

# 6. Regenerate Prisma Client
npx prisma generate

# 7. Verify versions
npm list prisma @prisma/client

# 8. Start Prisma Studio
npm run studio
```

---

## ✅ **Verification Checklist**

After fixing, verify:

- [ ] `npm list prisma @prisma/client` shows both at `6.17.0`
- [ ] `npx prisma generate` runs without errors
- [ ] `npm run studio` opens without prompts
- [ ] Prisma Studio opens at `http://localhost:5555`
- [ ] You can view tables without errors
- [ ] You can edit a record and save without `STUDIO_EMBED_BUILD` error

---

## 🎯 **What We've Already Done**

✅ Fixed version mismatch (both at 6.17.0)
✅ Regenerated Prisma Client
✅ Verified installation

---

## 💡 **Prevention Tips**

1. **Always use exact versions** (no `^` in package.json for Prisma)
2. **Regenerate after schema changes**: `npx prisma generate`
3. **Close Prisma Studio** before running migrations
4. **Keep versions in sync**: If you update `prisma`, update `@prisma/client` to match

---

## 🔍 **Alternative: Use Prisma Studio via npm script**

Instead of `npx prisma studio`, always use:
```powershell
npm run studio
```

This ensures it uses the locally installed version from `node_modules`.

---

## 📝 **If Still Having Issues**

If the error persists after all steps:

1. **Check Prisma version compatibility:**
   ```powershell
   npx prisma --version
   ```
   Should show both `prisma` and `@prisma/client` at `6.17.0`

2. **Check for multiple Prisma installations:**
   ```powershell
   npm list -g prisma
   ```
   If a global version exists, it might conflict. Uninstall it:
   ```powershell
   npm uninstall -g prisma
   ```

3. **Try a different port:**
   ```powershell
   npx prisma studio --port 5556
   ```

4. **Check Windows permissions:**
   - Ensure you have write permissions to `node_modules`
   - Try running PowerShell as Administrator

---

**Last Updated:** After fixing Prisma installation issues

