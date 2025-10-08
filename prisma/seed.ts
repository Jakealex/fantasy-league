import { PrismaClient } from '@prisma/client'


const prisma = new PrismaClient()

async function main() {
  await prisma.player.create({
    data: {
      teamName: "Soccer team FC",
      position: "FWD",
      price: 10,
      status: "A"
    }
  })
}

main()
  .then(() => {
    console.log("Seed data created ✅")
  })
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
