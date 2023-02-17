import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
// DB is in latin1, so we need to set the charset
await prisma.$executeRawUnsafe('SET NAMES latin1');
export default prisma;
