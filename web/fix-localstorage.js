// Script para corrigir valores corrompidos no localStorage
// Execute isso no console do navegador se necessário

function fixLocalStorage() {
  const keys = [
    'kanban-lastActiveProject-v2',
    'kanban-lastActiveTab-v2'
  ];

  keys.forEach(key => {
    const value = localStorage.getItem(key);
    if (value && !value.startsWith('{') && !value.startsWith('[') && !value.startsWith('"')) {
      // Se não é JSON válido, converte para JSON
      console.log(`Fixing ${key}: ${value} -> "${value}"`);
      localStorage.setItem(key, JSON.stringify(value));
    }
  });

  console.log('LocalStorage fixed!');
}

// Para executar:
// fixLocalStorage();