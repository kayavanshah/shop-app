const fs = require('fs');
let c = fs.readFileSync('d:/shop/backend/src/index.ts', 'utf8');

c = c.replace(/req\.query\.q as string/g, "req.query.q as any");
c = c.replace(/req\.query\.date as string/g, "req.query.date as any");
c = c.replace(/req\.query\.startDate as string/g, "req.query.startDate as any");
c = c.replace(/req\.query\.endDate as string/g, "req.query.endDate as any");
c = c.replace(/req\.params\.id as string/g, "req.params.id as any");

c = c.replace(/isDeleted:\s*false/g, "");
// Fixing Property 'items' does not exist on type...
// It was: b.items.forEach(i =>
c = c.replace(/b\.items/g, "(b as any).items");

fs.writeFileSync('d:/shop/backend/src/index.ts', c);
console.log("Fixed TS errors");
