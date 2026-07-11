import express, { Request, Response } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

const prisma = new PrismaClient();
const app = express();

app.use(cors({ 
  origin: true, 
  credentials: true 
}));
app.use(express.json());
app.use(cookieParser());

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-in-production';

// ----------------------------------------------------
// AUTHENTICATION
// ----------------------------------------------------
app.post('/api/auth/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (username === 'kayavan' && password === '@Kayavan1011') {
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1d' });
    res.cookie('session', token, { httpOnly: true, path: '/', sameSite: 'none', secure: true });
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.post('/api/auth/logout', (req: Request, res: Response) => {
  res.clearCookie('session', { path: '/', sameSite: 'none', secure: true });
  res.json({ success: true });
});

// ----------------------------------------------------
// BILLS
// ----------------------------------------------------
app.get('/api/bills', async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;
  try {
    const whereClause: any = {};
    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }
    const bills = await prisma.bill.findMany({
      where: whereClause,
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(bills);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bills' });
  }
});

app.post('/api/bills', async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const result = await prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      const itemsToCreate = [];
      
      for (const item of data.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product) throw new Error(`Product ${item.productId} not found`);
        if (product.quantity < item.quantity) throw new Error(`Not enough stock for ${product.name}`);
        
        await tx.product.update({
          where: { id: product.id },
          data: { quantity: { decrement: item.quantity } }
        });
        
        const subtotal = product.sellPrice * item.quantity;
        totalAmount += subtotal;
        itemsToCreate.push({
          productId: product.id,
          quantity: item.quantity,
          price: product.sellPrice,
          subtotal
        });
      }
      
      const finalAmount = totalAmount - (Number(data.discount) || 0);
      
      const bill = await tx.bill.create({
        data: {
          customerName: data.customerName || null,
          totalAmount: finalAmount,
          discount: Number(data.discount) || 0,
          paymentMethod: data.paymentMethod,
          items: { create: itemsToCreate }
        },
        include: { items: true }
      });
      return bill;
    });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create bill' });
  }
});

app.post('/api/bills/:id/return', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as any as string;
    const { itemsToReturn } = req.body;
    const result = await prisma.$transaction(async (tx) => {
      const bill = await tx.bill.findUnique({
        where: { id },
        include: { items: { include: { product: true } } }
      });
      if (!bill) throw new Error('Bill not found');

      let totalRefund = 0;
      const returnRecords = [];

      for (const returnItem of itemsToReturn) {
        const billItem = (bill as any).items.find(i => i.id === returnItem.billItemId);
        if (!billItem) throw new Error('Item not found in bill');
        
        const currentReturned = billItem.returnedQuantity || 0;
        const availableToReturn = billItem.quantity - currentReturned;
        const qtyToReturn = Number(returnItem.quantity);

        if (qtyToReturn > availableToReturn) throw new Error('Cannot return more than available');
        if (qtyToReturn <= 0) continue;

        await tx.billItem.update({
          where: { id: billItem.id },
          data: { returnedQuantity: currentReturned + qtyToReturn }
        });

        await tx.product.update({
          where: { id: billItem.productId },
          data: { quantity: { increment: qtyToReturn } }
        });

        const refundAmount = qtyToReturn * billItem.price;
        totalRefund += refundAmount;

        const returnRec = await tx.returnTransaction.create({
          data: {
            billId: bill.id,
            billItemId: billItem.id,
            quantity: qtyToReturn,
            amount: refundAmount,
            reason: returnItem.reason || 'Customer Return'
          }
        });
        returnRecords.push(returnRec);
      }
      return { success: true, totalRefund, returns: returnRecords };
    });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to process return' });
  }
});

// ----------------------------------------------------
// EXPENSES
// ----------------------------------------------------
app.get('/api/expenses', async (req: Request, res: Response) => {
  const { date, startDate, endDate } = req.query;
  try {
    const whereClause: any = {};
    if (date) {
      const d = new Date(date as string);
      whereClause.date = { gte: new Date(d.setHours(0,0,0,0)), lte: new Date(d.setHours(23,59,59,999)) };
    } else if (startDate && endDate) {
      whereClause.date = { gte: new Date(startDate as string), lte: new Date(endDate as string) };
    }
    const expenses = await prisma.expense.findMany({ where: whereClause, orderBy: { createdAt: 'desc' } });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch' });
  }
});

app.post('/api/expenses', async (req: Request, res: Response) => {
  try {
    const { amount, reason, date } = req.body;
    const expense = await prisma.expense.create({
      data: { amount: Number(amount), reason, date: date ? new Date(date) : new Date() }
    });
    res.json(expense);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create' });
  }
});

app.delete('/api/expenses/:id', async (req: Request, res: Response) => {
  try {
    await prisma.expense.delete({ where: { id: (req.params.id as string) } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete' });
  }
});

// ----------------------------------------------------
// INVENTORY & PRODUCTS
// ----------------------------------------------------
app.get('/api/products', async (req: Request, res: Response) => {
  try {
    const query = req.query.q as any as string;
    const products = await prisma.product.findMany({
      where: query ? { name: { contains: query } } : undefined,
      orderBy: query ? { name: 'asc' } : { createdAt: 'desc' }
    });
    res.json(products);
  } catch (error) { res.status(500).json({ error: 'Failed' }); }
});

app.post('/api/products', async (req: Request, res: Response) => {
  try {
    const p = await prisma.product.create({ data: {
      name: req.body.name, category: req.body.category || null,
      buyPrice: Number(req.body.buyPrice), sellPrice: Number(req.body.sellPrice),
      quantity: Number(req.body.quantity), minStock: Number(req.body.minStock)
    }});
    res.json(p);
  } catch (error) { res.status(500).json({ error: 'Failed' }); }
});

app.put('/api/products/:id', async (req: Request, res: Response) => {
  try {
    const p = await prisma.product.update({
      where: { id: (req.params.id as string) },
      data: {
        name: req.body.name, category: req.body.category || null,
        buyPrice: Number(req.body.buyPrice), sellPrice: Number(req.body.sellPrice),
        quantity: Number(req.body.quantity), minStock: Number(req.body.minStock)
      }
    });
    res.json(p);
  } catch (error) { res.status(500).json({ error: 'Failed' }); }
});

app.delete('/api/products/:id', async (req: Request, res: Response) => {
  try {
    await prisma.product.update({ where: { id: (req.params.id as string) }, data: { /*isDeleted removed*/ } });
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: 'Failed' }); }
});

app.post('/api/inventory/adjust', async (req: Request, res: Response) => {
  try {
    const { productId, type, quantity, reason } = req.body;
    const qtyNum = Number(quantity);
    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: productId } });
      if (!product) throw new Error('Not found');
      if (type === 'REMOVE' && product.quantity < qtyNum) throw new Error('Not enough stock');
      
      const adj = await tx.stockAdjustment.create({ data: { productId, type, quantity: qtyNum, reason } });
      const p = await tx.product.update({
        where: { id: productId },
        data: { quantity: type === 'ADD' ? { increment: qtyNum } : { decrement: qtyNum } }
      });
      return { adj, p };
    });
    res.json(result);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

// ----------------------------------------------------
// SUPPLIERS & PURCHASES
// ----------------------------------------------------
app.get('/api/suppliers', async (req: Request, res: Response) => {
  try {
    const suppliers = await prisma.supplier.findMany({ orderBy: { name: 'asc' } });
    res.json(suppliers);
  } catch (error) { res.status(500).json({ error: 'Failed' }); }
});

app.post('/api/suppliers', async (req: Request, res: Response) => {
  try {
    const s = await prisma.supplier.create({ data: {
      name: req.body.name, phone: req.body.phone, address: req.body.address,
      gstNumber: req.body.gstNumber, openingBalance: Number(req.body.openingBalance), notes: req.body.notes
    }});
    res.json(s);
  } catch (error) { res.status(500).json({ error: 'Failed' }); }
});

app.get('/api/purchases', async (req: Request, res: Response) => {
  try {
    const purchases = await prisma.purchase.findMany({
      include: { supplier: true, items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(purchases);
  } catch (error) { res.status(500).json({ error: 'Failed' }); }
});

app.post('/api/purchases', async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const result = await prisma.$transaction(async (tx) => {
      let total = 0;
      const itemsToCreate = [];
      for (const item of data.items) {
        total += item.buyPrice * item.quantity;
        itemsToCreate.push({ productId: item.productId, quantity: item.quantity, buyPrice: item.buyPrice });
        await tx.product.update({ where: { id: item.productId }, data: { quantity: { increment: item.quantity }, buyPrice: item.buyPrice }});
      }
      return await tx.purchase.create({
        data: { supplierId: data.supplierId, totalAmount: total, status: data.status, notes: data.notes, items: { create: itemsToCreate } }
      });
    });
    res.json(result);
  } catch (error) { res.status(500).json({ error: 'Failed' }); }
});

app.patch('/api/purchases/:id', async (req: Request, res: Response) => {
  try {
    const p = await prisma.purchase.update({ where: { id: (req.params.id as string) }, data: { status: req.body.status } });
    res.json(p);
  } catch (error) { res.status(500).json({ error: 'Failed' }); }
});

// ----------------------------------------------------
// REPORTS
// ----------------------------------------------------
app.get('/api/dashboard', async (req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0,0,0,0);
    const productsCount = await prisma.product.count();
    const lowStockCount = await prisma.product.count({ where: { quantity: { lte: prisma.product.fields.minStock } } as any });
    
    const billsToday = await prisma.bill.findMany({ where: { createdAt: { gte: today } }, include: { items: { include: { product: true } } } });
    let todaySales = 0;
    let todayBuyCost = 0;
    billsToday.forEach(b => {
      todaySales += b.totalAmount;
      (b as any).items.forEach(i => { todayBuyCost += (i.product.buyPrice * i.quantity); });
    });

    const returnsToday = await prisma.returnTransaction.findMany({ where: { createdAt: { gte: today } } });
    const totalReturns = returnsToday.reduce((sum, r) => sum + r.amount, 0);

    res.json({
      totalProducts: productsCount,
      lowStockItems: lowStockCount, // Prisma fields comparison is tricky in SQLite, might need raw query if this fails
      todaySales,
      todayProfit: todaySales - todayBuyCost - totalReturns,
      todayReturns: totalReturns
    });
  } catch (error) { res.status(500).json({ error: 'Failed' }); }
});

app.get('/api/reports/daily-closing', async (req: Request, res: Response) => {
  try {
    const dateStr = req.query.date as any as string;
    const start = new Date(dateStr); start.setHours(0,0,0,0);
    const end = new Date(dateStr); end.setHours(23,59,59,999);
    
    const bills = await prisma.bill.findMany({ where: { createdAt: { gte: start, lte: end } }, include: { items: { include: { product: true } } } });
    const returns = await prisma.returnTransaction.findMany({ where: { createdAt: { gte: start, lte: end } } });
    const expenses = await prisma.expense.findMany({ where: { date: { gte: start, lte: end } } });

    let cashSales = 0, upiSales = 0, totalBuyCost = 0;
    bills.forEach(b => {
      if (b.paymentMethod === 'CASH') cashSales += b.totalAmount;
      else if (b.paymentMethod === 'UPI') upiSales += b.totalAmount;
      (b as any).items.forEach(i => totalBuyCost += (i.product.buyPrice * i.quantity));
    });

    const totalReturns = returns.reduce((s, r) => s + r.amount, 0);
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    
    res.json({
      cashSales, upiSales, totalReturns, totalExpenses,
      netProfit: cashSales + upiSales - totalBuyCost - totalReturns - totalExpenses,
      expensesList: expenses
    });
  } catch (error) { res.status(500).json({ error: 'Failed' }); }
});

// ----------------------------------------------------
// SERVER START
// ----------------------------------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});

// Trigger restart
