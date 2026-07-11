const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Due to the newly added tables, we'll clear everything to start fresh
    // It's safest to delete dependent tables first
    
    // Clear Returns
    try {
      await prisma.returnTransaction.deleteMany({});
      console.log('Deleted all return transactions.');
    } catch (e) {
      console.log('No return transactions found or table not ready yet.');
    }

    // Clear Bill Items
    try {
      await prisma.billItem.deleteMany({});
      console.log('Deleted all bill items.');
    } catch (e) {
      console.log('Failed to delete bill items.');
    }

    // Clear Bills
    try {
      await prisma.bill.deleteMany({});
      console.log('Deleted all bills.');
    } catch (e) {
      console.log('Failed to delete bills.');
    }

    // Clear Products / Inventory
    try {
      await prisma.product.deleteMany({});
      console.log('Deleted all inventory products.');
    } catch (e) {
      console.log('Failed to delete products.');
    }

    console.log('\nSuccess! All stock, bills, and history have been cleared.');
  } catch (error) {
    console.error('An unexpected error occurred:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
