const fs = require('fs');
const files = [
  'd:/shop/frontend/src/app/expenses/page.tsx',
  'd:/shop/frontend/src/app/purchase-history/page.tsx',
  'd:/shop/frontend/src/app/reports/page.tsx'
];

files.forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace(/let url = '\/api/g, "let url = 'http://localhost:5000/api");
  c = c.replace(/fetch\(url\)/g, "fetch(url, { credentials: 'include' })");
  
  // Safe JSON parsing for await fetch(url)
  // Usually it is: const res = await fetch(url); const data = await res.json();
  // We need to make sure we don't crash if res.json() is HTML.
  // Actually, replacing await res.json() with our safe block:
  c = c.replace(/await res\.json\(\)/g, "(res.ok ? await res.json().catch(()=>({})) : {})");
  
  fs.writeFileSync(f, c);
});
console.log("Fixed indirect url fetch calls");
