# Prisma Studio Troubleshooting Guide

## 🚨 Common Error: `STUDIO_EMBED_BUILD`

### What is this error?

The `STUDIO_EMBED_BUILD` error occurs when Prisma Studio tries to use a stale, corrupted, or out-of-sync Prisma Client. This typically happens when:

- Prisma Client wasn't regenerated after a schema change
- `node_modules/.prisma` cache is corrupted
- Multiple Prisma operations happened without regeneration
- Prisma Studio was left open during migrations

### Why does it happen?

Prisma Studio loads the Prisma Client into memory when it starts. If the client is:
- Outdated (schema changed but client not regenerated)
- Corrupted (partial build or cache issues)
- Missing (deleted or not generated)

Studio will throw the `STUDIO_EMBED_BUILD` error when trying to save or query data.

---

## ✅ Quick Fix

### Method 1: Use the cleanup script (Recommended)

```bash
npm run prisma:clean
```

This automatically:
1. Deletes Prisma cache directories
2. Reinstalls Prisma packages
3. Regenerates Prisma Client

Then restart Prisma Studio:
```bash
npm run studio
```

### Method 2: Manual cleanup

If the script doesn't work, manually:

```bash
# 1. Close Prisma Studio (if running)

# 2. Delete cache directories
rm -rf node_modules/.prisma
rm -rf node_modules/@prisma/client

# 3. Reinstall and regenerate
npm install @prisma/client prisma
npx prisma generate

# 4. Restart Studio
npm run studio
```

**Windows PowerShell:**
```powershell
Remove-Item -Recurse -Force node_modules\.prisma -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules\@prisma\client -ErrorAction SilentlyContinue
npm install @prisma/client prisma
npx prisma generate
npm run studio
```

---

## 🔄 Best Practices

### After Running Migrations

**Always regenerate Prisma Client after migrations:**

```bash
npx prisma migrate dev
# Prisma automatically runs 'prisma generate' after migrations
# But if Studio was open, close and restart it
```

### When Prisma Studio Breaks

1. **Close Prisma Studio** (important - it locks the client in memory)
2. Run `npm run prisma:clean`
3. Restart Studio with `npm run studio`

### Regular Workflow

```bash
# 1. Make schema changes
# Edit prisma/schema.prisma

# 2. Create migration
npx prisma migrate dev --name your_migration_name

# 3. If Studio is open, close it first
# 4. Then open Studio (auto-cleans and regenerates)
npm run studio
```

---

## 🛠️ Available Commands

### Clean Prisma Cache
```bash
npm run prisma:clean
```
Cleans cache and regenerates Prisma Client.

### Open Prisma Studio (with auto-clean)
```bash
npm run studio
```
Automatically cleans cache before opening Studio.

### Manual Prisma Studio (without auto-clean)
```bash
npx prisma studio
```
Opens Studio without cleaning (use only if you're sure cache is fresh).

---

## 🔍 When to Use Each Command

| Situation | Command |
|-----------|---------|
| Studio showing errors | `npm run prisma:clean` then `npm run studio` |
| After schema changes | `npm run studio` (auto-cleans) |
| After migrations | `npm run studio` (auto-cleans) |
| Studio won't start | `npm run prisma:clean` |
| Multiple save errors | Close Studio, run `npm run prisma:clean`, restart |

---

## ⚠️ Important Notes

1. **Always close Prisma Studio before cleaning cache**
   - Studio locks Prisma Client in memory
   - Cleaning while Studio is open can cause errors

2. **Postinstall hook**
   - `prisma generate` runs automatically after `npm install`
   - This ensures Prisma Client is always in sync

3. **Windows compatibility**
   - All scripts work on Windows
   - Uses Node.js `fs/promises` for cross-platform compatibility

---

## 🐛 Still Having Issues?

If `npm run prisma:clean` doesn't fix it:

1. **Check Prisma versions match:**
   ```bash
   npm list prisma @prisma/client
   ```
   Both should be the same version (e.g., `6.17.0`)

2. **Full clean reinstall:**
   ```bash
   npm run prisma:clean
   rm -rf node_modules
   npm install
   npx prisma generate
   ```

3. **Verify schema is valid:**
   ```bash
   npx prisma validate
   ```

4. **Check for multiple Prisma installations:**
   ```bash
   npm list -g prisma
   ```
   If a global version exists, it might conflict.

---

## 📚 Related Documentation

- [Prisma Studio Documentation](https://www.prisma.io/docs/guides/development-tools/prisma-studio)
- [Prisma Client Generation](https://www.prisma.io/docs/concepts/components/prisma-client/generating-prisma-client)
- [Prisma Troubleshooting](https://www.prisma.io/docs/guides/development-tools/troubleshooting)

---

**Last Updated:** After implementing Prisma cache cleanup automation
