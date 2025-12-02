# Testing Database Connection Without Dashboard

Since you don't have Prisma dashboard access, let's test different connection string formats to find what works.

## Your Current Connection String

```
postgresql://92d126e17ca68a7d8bc258c20a72b4e39df548e546adad7be9355920e0366dfa:sk_gzs2R21TS6wYa9lRnJdox@db.prisma.io:6543/postgres?sslmode=require
```

## Let's Test Different Formats

We'll try these variations:

1. **Port 5432 (Direct connection)** - Try this first
2. **Port 6543 (Connection pooler)** - Current (might need different format)
3. **With schema parameter**
4. **With connection pooler flag**

