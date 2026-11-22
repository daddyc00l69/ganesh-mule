const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    await prisma.$connect();
    const userCount = await prisma.user.count();
    const orderCount = await prisma.order.count();
    console.log(`Database Connected! Users: ${userCount}, Orders: ${orderCount}`);
  } catch (err) {
    console.log('Database Offline or Unreachable:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

check();
