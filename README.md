This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### Prerequisites

- **Node.js** (v18 or higher recommended)
- **PostgreSQL database** (local or remote)
- **npm** or **yarn** or **pnpm**

### Setup Steps

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd web
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env` file in the root directory with:
   ```env
   DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require&schema=public"
   ADMIN_EMAILS="jakeshapiro007@gmail.com,jboner2111@gmail.com"
   ```
   - **IMPORTANT**: Use a **standard Postgres URL** (starts with `postgresql://` or `postgres://`)
   - **DO NOT** use accelerated Prisma URLs (`prisma+postgres://`) in `.env` - they won't work with Prisma Studio
   - Get the standard URL from your Prisma Postgres dashboard
   - `ADMIN_EMAILS` is optional (has defaults)
   - See `DATABASE_URL_SETUP.md` for detailed configuration guide

4. **Set up the database:**
   ```bash
   # Generate Prisma Client
   npx prisma generate
   
   # Run migrations to create tables
   npx prisma migrate dev
   
   # Seed the database with initial data
   npm run db:seed
   ```

5. **Run the development server:**
   ```bash
   npm run dev
   ```

6. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Database Management

**View/Edit Database (Prisma Studio):**
```bash
npm run studio
```
This opens a visual database browser at `http://localhost:5555` where you can view and edit all database records.

**Run migrations:**
```bash
npm run migrate
```

**Seed database:**
```bash
npm run db:seed
```

### Common Issues

**"Can't connect to database":**
- Check your `.env` file has the correct `DATABASE_URL` (must be standard Postgres URL, not accelerated)
- Ensure PostgreSQL is running
- Verify database credentials
- **Prisma Studio errors**: Ensure `DATABASE_URL` is a standard Postgres URL (`postgresql://...`), NOT an accelerated URL (`prisma+postgres://`)

**"Prisma Client not generated":**
- Run `npx prisma generate`

**"Module not found":**
- Run `npm install` to install dependencies

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
