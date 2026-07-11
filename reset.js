const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // 1. Delete all bill items and bills (resets all metrics and sales)
    await prisma.billItem.deleteMany({});
    console.log('Deleted all bill items.');
    
    await prisma.bill.deleteMany({});
    console.log('Deleted all bills.');

    // 2. Set all product sale prices to 0 (just in case 'SAE PRICE' meant sale price)
    await prisma.product.updateMany({
      data: {
        sellPrice: 0
      }
    });
    console.log('Set all product sale prices to 0.');

    console.log('\nSuccess! All metrics, sales, and sale prices have been reset to zero.');
  } catch (error) {
    console.error('Error resetting data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
