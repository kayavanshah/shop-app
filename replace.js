const fs = require('fs');
const path = require('path');
function walk(dir){
  let results=[];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.resolve(dir, file);
    const stat = fs.statSync(file);
    if(stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}
const files = walk('d:/shop/frontend/src/app');
files.push(...walk('d:/shop/frontend/src/components'));

files.forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace(/fetch\('\/api/g, "fetch(process.env.NEXT_PUBLIC_API_URL + '/api");
  c = c.replace(/fetch\(\`\/api/g, "fetch(`${process.env.NEXT_PUBLIC_API_URL}/api");
  fs.writeFileSync(f, c);
});
console.log("Done");
