// Debug utilities for authentication issues

export function clearSupabaseSession() {
  if (typeof window !== 'undefined') {
    // Clear all Supabase-related localStorage items
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.includes('supabase') || key.includes('sb-')) {
        localStorage.removeItem(key);
        console.log('🧹 Cleared localStorage key:', key);
      }
    });

    // Clear all Supabase-related cookies
    const cookies = document.cookie.split(';');
    cookies.forEach(cookie => {
      const [name] = cookie.split('=');
      const cleanName = name.trim();
      if (cleanName.includes('supabase') || cleanName.includes('sb-')) {
        document.cookie = `${cleanName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        console.log('🧹 Cleared cookie:', cleanName);
      }
    });

    console.log('✅ Supabase session cleared. Please reload the page.');
  }
}

// Add to window for easy access in browser console
if (typeof window !== 'undefined') {
  (window as any).clearSupabaseSession = clearSupabaseSession;
}