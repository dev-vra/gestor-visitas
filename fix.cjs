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

  // Queries
  content = content.replace(/\.from\("cidades"\)/g, '.from("City")');
  content = content.replace(/\.from\("bairros"\)/g, '.from("Neighborhood")');
  content = content.replace(/select\("id, nome"\)/g, 'select("id, name")');
  content = content.replace(/select\("id, nome, cidade_id"\)/g, 'select("id, name, city_id")');
  content = content.replace(/select\("id, nome, cidade_id, cidades\(nome\)"\)/g, 'select("id, name, city_id, City(name)")');
  content = content.replace(/select\("nome"\)/g, 'select("name")');

  // Object keys and variables
  content = content.replace(/\.nome/g, '.name');
  content = content.replace(/nome:/g, 'name:');
  content = content.replace(/cidade_id/g, 'city_id');
  content = content.replace(/cidades\?/g, 'City?');

  fs.writeFileSync(p, content, 'utf8');
  console.log('Fixed', file);
}
