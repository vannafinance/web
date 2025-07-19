/**
 * Authentication Test Loader Component
 *
 * Loads authentication test utilities in development mode for browser console testing.
 */

"use client";

import { useEffect } from "react";

export default function AuthTestLoader() {
  useEffect(() => {
    // Only load test utilities in development mode
    if (process.env.NODE_ENV === "development") {
      // Dynamically import the test utilities to avoid bundling in production
      import("../lib/auth-test-utils")
        .then(() => {
          console.log("🧪 Authentication test utilities are ready!");
          console.log("💡 Try these commands in the console:");
          console.log("   testAuth.testWalletConnection()");
          console.log("   testAuth.testAuthentication()");
          console.log("   testAuth.getAuthStatus()");
        })
        .catch((error) => {
          console.warn("Failed to load auth test utilities:", error);
        });
    }
  }, []);

  // This component doesn't render anything
  return null;
}
