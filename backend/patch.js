const fs = require('fs');
const path = require('path');

const filepath = 'd:\\shop\\backend\\src\\index.ts';
let code = fs.readFileSync(filepath, 'utf8');

// 1. Bills Get
code = code.replace(
  'const whereClause: any = {};',
  'const whereClause: any = { userId: req.userId };'
);

// 2. Bills Post
code = code.replace(
  'await tx.product.findUnique({ where: { id: item.productId } });',
  'await tx.product.findFirst({ where: { id: item.productId, userId: req.userId } });'
);
code = code.replace(
  'const bill = await tx.bill.create({\n        data: {\n          customerName',
  'const bill = await tx.bill.create({\n        data: {\n          userId: req.userId,\n          customerName'
);

// 3. Bills Return
code = code.replace(
  'const bill = await tx.bill.findUnique({\n        where: { id },',
  'const bill = await tx.bill.findFirst({\n        where: { id, userId: req.userId },'
);
code = code.replace(
  'const returnRec = await tx.returnTransaction.create({\n          data: {\n            billId',
  'const returnRec = await tx.returnTransaction.create({\n          data: {\n            userId: req.userId,\n            billId'
);

// 4. Expenses Get
code = code.replace(
  'const expenses = await prisma.expense.findMany({ where: whereClause, orderBy: { createdAt: \'desc\' } });',
  'const expenses = await prisma.expense.findMany({ where: { ...whereClause, userId: req.userId }, orderBy: { createdAt: \'desc\' } });'
);

// 5. Expenses Post
code = code.replace(
  'const expense = await prisma.expense.create({\n      data: { amount: Number(amount), reason, date: date ? new Date(date) : new Date() }',
  'const expense = await prisma.expense.create({\n      data: { userId: req.userId, amount: Number(amount), reason, date: date ? new Date(date) : new Date() }'
);

// 6. Expenses Delete
code = code.replace(
  'await prisma.expense.delete({ where: { id: (req.params.id as string) } });',
  'await prisma.expense.deleteMany({ where: { id: (req.params.id as string), userId: req.userId } });'
);

// 7. Products Get
code = code.replace(
  'where: query ? { name: { contains: query } } : undefined,',
  'where: query ? { userId: req.userId, name: { contains: query } } : { userId: req.userId },'
);

// 8. Products Post
code = code.replace(
  'const p = await prisma.product.create({ data: {\n      name: req.body.name, category: req.body.category || null,',
  'const p = await prisma.product.create({ data: {\n      userId: req.userId, name: req.body.name, category: req.body.category || null,'
);

// 9. Products Put
code = code.replace(
  'const p = await prisma.product.update({\n      where: { id: (req.params.id as string) },',
  'const p = await prisma.product.updateMany({\n      where: { id: (req.params.id as string), userId: req.userId },'
);

// 10. Products Delete
code = code.replace(
  'await prisma.product.update({ where: { id: (req.params.id as string) }, data: { /*isDeleted removed*/ } });',
  'await prisma.product.deleteMany({ where: { id: (req.params.id as string), userId: req.userId } });'
);

// 11. Inventory Adjust
code = code.replace(
  'const product = await tx.product.findUnique({ where: { id: productId } });',
  'const product = await tx.product.findFirst({ where: { id: productId, userId: req.userId } });'
);
code = code.replace(
  'const adj = await tx.stockAdjustment.create({ data: { productId, type, quantity: qtyNum, reason } });',
  'const adj = await tx.stockAdjustment.create({ data: { userId: req.userId, productId, type, quantity: qtyNum, reason } });'
);

// 12. Suppliers Get
code = code.replace(
  'const suppliers = await prisma.supplier.findMany({ orderBy: { name: \'asc\' } });',
  'const suppliers = await prisma.supplier.findMany({ where: { userId: req.userId }, orderBy: { name: \'asc\' } });'
);

// 13. Suppliers Post
code = code.replace(
  'const s = await prisma.supplier.create({ data: {\n      name: req.body.name, phone: req.body.phone, address: req.body.address,',
  'const s = await prisma.supplier.create({ data: {\n      userId: req.userId, name: req.body.name, phone: req.body.phone, address: req.body.address,'
);

// 14. Purchases Get
code = code.replace(
  'const purchases = await prisma.purchase.findMany({\n      include: { supplier: true, items: { include: { product: true } } },\n      orderBy: { createdAt: \'desc\' }\n    });',
  'const purchases = await prisma.purchase.findMany({\n      where: { userId: req.userId },\n      include: { supplier: true, items: { include: { product: true } } },\n      orderBy: { createdAt: \'desc\' }\n    });'
);

// 15. Purchases Post
code = code.replace(
  'return await tx.purchase.create({\n        data: { supplierId: data.supplierId, totalAmount: total, status: data.status, notes: data.notes, items: { create: itemsToCreate } }',
  'return await tx.purchase.create({\n        data: { userId: req.userId, supplierId: data.supplierId, totalAmount: total, status: data.status, notes: data.notes, items: { create: itemsToCreate } }'
);

// 16. Purchases Patch
code = code.replace(
  'const p = await prisma.purchase.update({ where: { id: (req.params.id as string) }, data: { status: req.body.status } });',
  'const p = await prisma.purchase.updateMany({ where: { id: (req.params.id as string), userId: req.userId }, data: { status: req.body.status } });'
);

// 17. Dashboard Get
code = code.replace(
  'const productsCount = await prisma.product.count();',
  'const productsCount = await prisma.product.count({ where: { userId: req.userId } });'
);
code = code.replace(
  'const lowStockCount = await prisma.product.count({ where: { quantity: { lte: prisma.product.fields.minStock } } as any });',
  'const lowStockCount = await prisma.product.count({ where: { userId: req.userId, quantity: { lte: prisma.product.fields.minStock } } as any });'
);
code = code.replace(
  'const billsToday = await prisma.bill.findMany({ where: { createdAt: { gte: today } }, include: { items: { include: { product: true } } } });',
  'const billsToday = await prisma.bill.findMany({ where: { userId: req.userId, createdAt: { gte: today } }, include: { items: { include: { product: true } } } });'
);
code = code.replace(
  'const returnsToday = await prisma.returnTransaction.findMany({ where: { createdAt: { gte: today } } });',
  'const returnsToday = await prisma.returnTransaction.findMany({ where: { userId: req.userId, createdAt: { gte: today } } });'
);

// 18. Reports Get
code = code.replace(
  'const bills = await prisma.bill.findMany({ where: { createdAt: { gte: start, lte: end } }, include: { items: { include: { product: true } } } });',
  'const bills = await prisma.bill.findMany({ where: { userId: req.userId, createdAt: { gte: start, lte: end } }, include: { items: { include: { product: true } } } });'
);
code = code.replace(
  'const returns = await prisma.returnTransaction.findMany({ where: { createdAt: { gte: start, lte: end } } });',
  'const returns = await prisma.returnTransaction.findMany({ where: { userId: req.userId, createdAt: { gte: start, lte: end } } });'
);
code = code.replace(
  'const expenses = await prisma.expense.findMany({ where: { date: { gte: start, lte: end } } });',
  'const expenses = await prisma.expense.findMany({ where: { userId: req.userId, date: { gte: start, lte: end } } });'
);

// 19. Also fix the return of products PUT/PATCH updateMany returns a count, we should return success instead of `p`
code = code.replace(
  'res.json(p);',
  'res.json({ success: true, count: (p as any).count });'
); // Note this might affect Products PUT, Purchases PATCH.

fs.writeFileSync(filepath, code, 'utf8');
console.log('Patch complete.');
