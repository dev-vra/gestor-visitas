const fs = require('fs');
const path = require('path');

const files = [
  'src/pages/Bairros.jsx',
  'src/components/VisitModal.jsx',
  'src/components/VistoriaModal.jsx',
  'src/pages/Visits.jsx',
  'src/pages/Vistorias.jsx',
  'src/pages/Dashboard.jsx'
];

for (const file of files) {
  const p = path.join(__dirname, file);
  if (!fs.existsSync(p)) continue;
  
  let content = fs.readFileSync(p, 'utf8');

  // Fix ordering
  content = content.replace(/\.order\("nome"\)/g, '.order("name")');

  fs.writeFileSync(p, content, 'utf8');
  console.log('Fixed ordering', file);
}
