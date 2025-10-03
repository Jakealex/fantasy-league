// src/lib/prisma.ts
import 'server-only'

// If your tsconfig has "@/": "src/*" alias:
import { PrismaClient } from '@/generated/prisma'

// If that import errors, use this instead:
// import { PrismaClient } from '../generated/prisma'

const g = global as unknown as { prisma?: PrismaClient }

export const prisma =
  g.prisma ?? new PrismaClient({ log: ['error'] })

if (process.env.NODE_ENV !== 'production') g.prisma = prisma
