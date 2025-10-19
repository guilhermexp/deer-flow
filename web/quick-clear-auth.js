// Comando rápido para DevTools - Cole e execute no console do browser
(function() {
    console.clear();
    console.log('%c🧹 DeerFlow Auth Cleaner', 'font-size: 20px; color: #4CAF50; font-weight: bold;');
    console.log('');

    // Limpar localStorage
    localStorage.clear();
    console.log('✅ localStorage cleared');

    // Limpar sessionStorage
    sessionStorage.clear();
    console.log('✅ sessionStorage cleared');

    // Limpar cookies
    document.cookie.split(";").forEach(function(c) {
        const eqPos = c.indexOf("=");
        const name = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim();
        if (name) {
            document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
            document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=localhost";
            document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=." + window.location.hostname;
        }
    });
    console.log('✅ All cookies cleared');

    // Limpar IndexedDB
    if ('indexedDB' in window) {
        indexedDB.databases().then(databases => {
            databases.forEach(db => indexedDB.deleteDatabase(db.name));
            console.log('✅ IndexedDB cleared');
        });
    }

    console.log('');
    console.log('%c🎉 Auth data cleared! Reloading in 3 seconds...', 'color: #4CAF50; font-weight: bold;');

    setTimeout(() => window.location.reload(), 3000);
})();