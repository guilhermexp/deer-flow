import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

// Lista de imports para verificar
const importsToCheck = [
  '@radix-ui/react-alert-dialog',
  '@radix-ui/react-avatar', 
  '@radix-ui/react-progress',
  'chart.js',
  'date-fns',
  'react-chartjs-2',
  'react-day-picker',
  'react-window',
  'uuid',
  'dompurify'
];

// Função para buscar arquivos recursivamente
function findFiles(dir, pattern) /* @type {string[]} */ {
  let results = [];
  const files = readdirSync(dir);
  
  for (const file of files) {
    const filePath = join(dir, file);
    const stat = statSync(filePath);
    
    if (stat.isDirectory() && !file.includes('node_modules') && !file.startsWith('.')) {
      results = results.concat(findFiles(filePath, pattern));
    } else if (stat.isFile() && pattern.test(file)) {
      results.push(filePath);
    }
  }
  
  return results;
}

// Buscar todos os arquivos .tsx e .ts
const srcDir = './src';
const files = findFiles(srcDir, /\.(tsx?|jsx?)$/);

console.log('Verificando imports em', files.length, 'arquivos...\n');

// Verificar cada arquivo
const missingImports = new Set();

for (const file of files) {
  const content = readFileSync(file, 'utf8');
  
  for (const importName of importsToCheck) {
    if (content.includes(`from '${importName}'`) || content.includes(`from "${importName}"`)) {
      console.log(`✓ ${file} usa ${importName}`);
      missingImports.add(importName);
    }
  }
}

console.log('\n📦 Dependências necessárias:');
for (const imp of missingImports) {
  console.log(`- ${imp}`);
}