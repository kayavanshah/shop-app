const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearData() {
  console.log('Starting data cleanup...');
  
  // We need to delete in the correct order to respect foreign key constraints
  
  console.log('Deleting PurchaseItems...');
  await prisma.purchaseItem.deleteMany();
  
  console.log('Deleting Purchases...');
  await prisma.purchase.deleteMany();
  
  console.log('Deleting BillItems...');
  await prisma.billItem.deleteMany();
  
  console.log('Deleting Bills...');
  await prisma.bill.deleteMany();
  
  console.log('Deleting InventoryLogs...');
  await prisma.inventoryLog.deleteMany();
  
  console.log('Deleting Products...');
  await prisma.product.deleteMany();
  
  console.log('Deleting Suppliers...');
  await prisma.supplier.deleteMany();
  
  console.log('Deleting Expenses...');
  await prisma.expense.deleteMany();
  
  console.log('Deleting Users...');
  await prisma.user.deleteMany();
  
  console.log('All data cleared successfully!');
}

clearData()
  .catch(e => {
    console.error('Error clearing data:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
