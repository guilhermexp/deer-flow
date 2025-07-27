// Simple test script to check if authentication is working
// Open http://localhost:4000 in browser and check console for these messages:

console.log("Testing authentication flow...");

// Check for infinite loop by monitoring auth check messages
let authCheckCount = 0;
const originalLog = console.log;

console.log = function(...args) {
  if (args[0] && args[0].includes('🔍 Checking authentication')) {
    authCheckCount++;
    if (authCheckCount > 3) {
      console.error("❌ INFINITE LOOP DETECTED: Auth check called more than 3 times!");
      console.error("This indicates the auth context is still in an infinite loop.");
    } else {
      originalLog(`✅ Auth check #${authCheckCount}:`, ...args);
    }
  } else {
    originalLog(...args);
  }
};

// Monitor for auth state changes
window.addEventListener('load', () => {
  setTimeout(() => {
    if (authCheckCount <= 2) {
      console.log("✅ SUCCESS: Auth context appears to be working correctly!");
      console.log(`Total auth checks: ${authCheckCount} (should be 1-2)`);
    }
  }, 5000);
});