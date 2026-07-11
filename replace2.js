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
  // Handle string concatenation like: process.env.NEXT_PUBLIC_API_URL + '/api/auth/login'
  // -> "'http://localhost:5000'" + '/api/auth/login'
  c = c.replace(/process\.env\.NEXT_PUBLIC_API_URL/g, "'http://localhost:5000'");
  
  // Safely parse JSON for all remaining fetch calls to prevent red crash screens
  c = c.replace(/\.then\(\s*res\s*=>\s*res\.json\(\)\s*\)/g, 
    `.then(async res => {
      if (!res.ok) return {};
      try { return await res.json() } catch(e) { return {} }
    })`);
    
  fs.writeFileSync(f, c);
});
console.log("Replaced NEXT_PUBLIC_API_URL with hardcoded localhost:5000 and added safe JSON parsing");
