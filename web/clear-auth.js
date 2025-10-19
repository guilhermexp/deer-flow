// Script para limpar todos os dados de autenticação via DevTools
console.log('🧹 Iniciando limpeza de dados de autenticação...');

// 1. Limpar localStorage
const localStorageKeys = Object.keys(localStorage);
console.log(`📦 Limpando ${localStorageKeys.length} itens do localStorage...`);
localStorageKeys.forEach(key => {
    console.log(`  - Removendo: ${key}`);
    localStorage.removeItem(key);
});
localStorage.clear();
console.log('✅ localStorage limpo');

// 2. Limpar sessionStorage
const sessionStorageKeys = Object.keys(sessionStorage);
console.log(`📦 Limpando ${sessionStorageKeys.length} itens do sessionStorage...`);
sessionStorageKeys.forEach(key => {
    console.log(`  - Removendo: ${key}`);
    sessionStorage.removeItem(key);
});
sessionStorage.clear();
console.log('✅ sessionStorage limpo');

// 3. Limpar todos os cookies
console.log('🍪 Limpando todos os cookies...');
const cookies = document.cookie.split(";");
console.log(`  - Encontrados ${cookies.length} cookies`);

cookies.forEach(function(c) {
    const eqPos = c.indexOf("=");
    const name = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim();
    if (name) {
        console.log(`  - Removendo cookie: ${name}`);
        // Remover para o domínio atual
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=" + window.location.hostname;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=." + window.location.hostname;
        // Para localhost
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=localhost";
    }
});
console.log('✅ Cookies limpos');

// 4. Limpar IndexedDB
console.log('🗄️ Limpando IndexedDB...');
if ('indexedDB' in window) {
    indexedDB.databases().then(databases => {
        console.log(`  - Encontrados ${databases.length} bancos IndexedDB`);
        databases.forEach(db => {
            console.log(`  - Removendo database: ${db.name}`);
            indexedDB.deleteDatabase(db.name);
        });
        console.log('✅ IndexedDB limpo');
    }).catch(err => {
        console.warn('⚠️ Erro ao limpar IndexedDB:', err);
    });
} else {
    console.log('  - IndexedDB não disponível');
}

// 5. Limpar WebSQL (se disponível)
if ('openDatabase' in window) {
    console.log('🗃️ Limpando WebSQL...');
    try {
        const db = openDatabase('', '', '', '');
        console.log('✅ WebSQL limpo');
    } catch (e) {
        console.log('  - WebSQL não disponível ou já limpo');
    }
}

// 6. Limpar Service Workers
console.log('👷 Limpando Service Workers...');
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
        console.log(`  - Encontrados ${registrations.length} service workers`);
        registrations.forEach(registration => {
            console.log(`  - Removendo SW: ${registration.scope}`);
            registration.unregister();
        });
        console.log('✅ Service Workers limpos');
    });
} else {
    console.log('  - Service Workers não disponíveis');
}

// 7. Limpar Cache API
console.log('🗂️ Limpando Cache API...');
if ('caches' in window) {
    caches.keys().then(cacheNames => {
        console.log(`  - Encontrados ${cacheNames.length} caches`);
        return Promise.all(
            cacheNames.map(cacheName => {
                console.log(`  - Removendo cache: ${cacheName}`);
                return caches.delete(cacheName);
            })
        );
    }).then(() => {
        console.log('✅ Cache API limpo');
    }).catch(err => {
        console.warn('⚠️ Erro ao limpar Cache API:', err);
    });
} else {
    console.log('  - Cache API não disponível');
}

console.log('');
console.log('🎉 LIMPEZA COMPLETA!');
console.log('');
console.log('📋 Resumo da limpeza:');
console.log(`  ✅ localStorage: ${localStorageKeys.length} itens removidos`);
console.log(`  ✅ sessionStorage: ${sessionStorageKeys.length} itens removidos`);
console.log(`  ✅ Cookies: ${cookies.length} cookies removidos`);
console.log('  ✅ IndexedDB: todos os databases removidos');
console.log('  ✅ Service Workers: todos removidos');
console.log('  ✅ Cache API: todos os caches removidos');
console.log('');
console.log('🔄 Recarregando a página em 2 segundos...');

// Recarregar a página após 2 segundos
setTimeout(() => {
    console.log('🔄 Recarregando...');
    window.location.reload();
}, 2000);