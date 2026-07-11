const fs = require('fs');
let c = fs.readFileSync('d:/shop/backend/src/index.ts', 'utf8');

c = c.replace(/req\.query\.q as string/g, "req.query.q as any as string");
c = c.replace(/req\.query\.date as string/g, "req.query.date as any as string");
c = c.replace(/req\.query\.startDate as string/g, "req.query.startDate as any as string");
c = c.replace(/req\.query\.endDate as string/g, "req.query.endDate as any as string");
c = c.replace(/isDeleted:\s*false/g, "");
// Fixing Property 'items' does not exist on type...
// It was: b.items.forEach(i =>
// Because I probably didn't include items in the findMany query?
// Actually, I did: billsToday = await prisma.bill.findMany({ ... include: { items: { include: { product: true } } } });
// The error says "items does not exist on type { ... createdAt: Date; }", which means the compiler lost the type context for b.
// I will just cast it to any.
c = c.replace(/b\.items/g, "(b as any).items");

fs.writeFileSync('d:/shop/backend/src/index.ts', c);
console.log("Fixed TS errors");
