const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('d:\\shop\\frontend\\src\\app');
let modifiedFiles = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;
  
  // Replace `process.env.NEXT_PUBLIC_API_URL + '/api` -> `'/api`
  content = content.replace(/process\.env\.NEXT_PUBLIC_API_URL \+ '\/api/g, "'/api");
  
  // Replace `${process.env.NEXT_PUBLIC_API_URL}/api` -> `/api`
  content = content.replace(/\$\{process\.env\.NEXT_PUBLIC_API_URL\}\/api/g, "/api");
  
  if (content !== original) {
    fs.writeFileSync(file, content);
    modifiedFiles++;
    console.log('Modified', file);
  }
});

console.log('Total files modified:', modifiedFiles);
