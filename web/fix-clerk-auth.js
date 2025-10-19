// Script definitivo para resolver o erro de Clerk JWT kid mismatch
// Execute este script no console do DevTools (F12)

console.clear();
console.log('%c🔧 CLERK AUTH FIXER', 'font-size: 24px; color: #FF6B6B; font-weight: bold;');
console.log('%cResolvendo erro de JWT kid mismatch...', 'font-size: 16px; color: #4ECDC4;');
console.log('');

// Função para limpar dados específicos do Clerk
function clearClerkData() {
    let clearedItems = 0;

    // 1. Limpar todos os cookies relacionados ao Clerk
    console.log('🍪 Limpando cookies do Clerk...');
    const clerkCookies = [
        '__session',
        '__clerk_handshake',
        '__clerk_uat',
        '__clerk_db_jwt',
        '__client_uat',
        '__refresh_nIVKOCK0',
        '__session_nIVKOCK0',
        '__clerk_db_jwt_nIVKOCK0',
        '__client_uat_nIVKOCK0'
    ];

    // Limpar cookies específicos do Clerk
    clerkCookies.forEach(cookieName => {
        // Para diferentes domínios e paths
        const domains = ['localhost', '.localhost', window.location.hostname, '.' + window.location.hostname];
        const paths = ['/', '/chat', '/api'];

        domains.forEach(domain => {
            paths.forEach(path => {
                document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}; domain=${domain}`;
                document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}`;
            });
        });
        console.log(`  ✅ Cookie ${cookieName} removido`);
        clearedItems++;
    });

    // Limpar TODOS os cookies como fallback
    document.cookie.split(";").forEach(function(c) {
        const eqPos = c.indexOf("=");
        const name = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim();
        if (name) {
            document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
            document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=localhost";
            document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=." + window.location.hostname;
        }
    });

    // 2. Limpar localStorage relacionado ao Clerk
    console.log('📦 Limpando localStorage do Clerk...');
    const localStorageKeys = Object.keys(localStorage);
    localStorageKeys.forEach(key => {
        if (key.includes('clerk') || key.includes('__clerk') || key.includes('auth')) {
            localStorage.removeItem(key);
            console.log(`  ✅ localStorage ${key} removido`);
            clearedItems++;
        }
    });
    localStorage.clear(); // Limpar tudo como fallback

    // 3. Limpar sessionStorage
    console.log('🗂️ Limpando sessionStorage...');
    const sessionStorageKeys = Object.keys(sessionStorage);
    sessionStorageKeys.forEach(key => {
        if (key.includes('clerk') || key.includes('__clerk') || key.includes('auth')) {
            sessionStorage.removeItem(key);
            console.log(`  ✅ sessionStorage ${key} removido`);
            clearedItems++;
        }
    });
    sessionStorage.clear(); // Limpar tudo como fallback

    // 4. Limpar IndexedDB relacionado ao Clerk
    console.log('🗄️ Limpando IndexedDB...');
    if ('indexedDB' in window) {
        indexedDB.databases().then(databases => {
            databases.forEach(db => {
                if (db.name && (db.name.includes('clerk') || db.name.includes('auth'))) {
                    indexedDB.deleteDatabase(db.name);
                    console.log(`  ✅ IndexedDB ${db.name} removido`);
                    clearedItems++;
                }
            });
        });
    }

    return clearedItems;
}

// Função para verificar se ainda há dados do Clerk
function checkRemainingClerkData() {
    console.log('🔍 Verificando dados restantes do Clerk...');

    const cookies = document.cookie;
    const hasClerkCookies = cookies.includes('__session') || cookies.includes('__clerk');

    const localStorage_has_clerk = Object.keys(localStorage).some(key =>
        key.includes('clerk') || key.includes('__clerk')
    );

    const sessionStorage_has_clerk = Object.keys(sessionStorage).some(key =>
        key.includes('clerk') || key.includes('__clerk')
    );

    if (hasClerkCookies || localStorage_has_clerk || sessionStorage_has_clerk) {
        console.log('⚠️ Ainda há dados do Clerk presentes');
        return false;
    } else {
        console.log('✅ Nenhum dado do Clerk encontrado');
        return true;
    }
}

// Executar limpeza
try {
    const clearedCount = clearClerkData();
    console.log('');
    console.log(`🧹 Limpeza concluída: ${clearedCount} itens removidos`);

    // Verificar se a limpeza foi bem-sucedida
    setTimeout(() => {
        const isClean = checkRemainingClerkData();
        console.log('');

        if (isClean) {
            console.log('%c🎉 SUCESSO! Dados do Clerk foram limpos!', 'font-size: 18px; color: #2ECC71; font-weight: bold;');
            console.log('%c📝 Próximos passos:', 'font-size: 14px; color: #3498DB; font-weight: bold;');
            console.log('1. A página será recarregada em 3 segundos');
            console.log('2. Faça login novamente no Clerk');
            console.log('3. O erro de JWT kid mismatch deve estar resolvido');
        } else {
            console.log('%c⚠️ Ainda há dados do Clerk. Tentando limpeza adicional...', 'font-size: 14px; color: #F39C12;');
            // Limpeza adicional mais agressiva
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(registrations => {
                    registrations.forEach(registration => registration.unregister());
                });
            }
            if ('caches' in window) {
                caches.keys().then(cacheNames => {
                    cacheNames.forEach(cacheName => caches.delete(cacheName));
                });
            }
        }

        console.log('');
        console.log('%c🔄 Recarregando página...', 'font-size: 16px; color: #9B59B6; font-weight: bold;');

        setTimeout(() => {
            window.location.reload();
        }, 3000);

    }, 1000);

} catch (error) {
    console.error('❌ Erro durante a limpeza:', error);
    console.log('🔄 Tentando reload simples...');
    setTimeout(() => window.location.reload(), 2000);
}