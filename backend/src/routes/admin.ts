import { Router } from 'express'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const router = Router()

router.post('/clear-test-data', async (req, res) => {
  try {
    await prisma.purchaseItem.deleteMany();
    await prisma.purchase.deleteMany();
    await prisma.billItem.deleteMany();
    await prisma.bill.deleteMany();
    await prisma.inventoryLog.deleteMany();
    await prisma.product.deleteMany();
    await prisma.supplier.deleteMany();
    await prisma.expense.deleteMany();
    
    // Also delete any user that starts with 'test'
    await prisma.user.deleteMany({
      where: {
        username: { startsWith: 'test' }
      }
    });

    res.json({ message: 'Test data cleared successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
