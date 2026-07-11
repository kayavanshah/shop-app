const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.product.deleteMany({});
    console.log('All inventory products have been successfully deleted.');
  } catch (error) {
    console.error('Error deleting inventory:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
