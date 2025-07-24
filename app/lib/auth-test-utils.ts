/**
 * Authentication Test Utilities
 *
 * Utilities for testing authentication functionality in the browser console.
 * This helps verify that wallet connection and authentication are working properly.
 */

import { ethers } from "ethers";
import {
  authenticationService,
  type WalletProvider,
} from "./authentication-service";

declare global {
  interface Window {
    ethereum?: any;
    testAuth?: any;
  }
}

/**
 * Create a wallet provider from MetaMask or other injected wallet
 */
async function createWalletProvider(): Promise<WalletProvider | null> {
  try {
    // Check if MetaMask or other wallet is available
    if (!window.ethereum) {
      console.error(
        "❌ No wallet detected. Please install MetaMask or another Web3 wallet.",
      );
      return null;
    }

    // Request account access
    console.log("🔗 Requesting wallet connection...");
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    if (!accounts || accounts.length === 0) {
      console.error("❌ No accounts found. Please connect your wallet.");
      return null;
    }

    const address = accounts[0];
    console.log("✅ Wallet connected:", address);

    // Create ethers provider and signer
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();

    // Verify the signer address matches
    const signerAddress = await signer.getAddress();
    console.log("✅ Signer address:", signerAddress);

    return {
      address: signerAddress,
      signer,
      isConnected: true,
    };
  } catch (error) {
    console.error("❌ Failed to create wallet provider:", error);
    return null;
  }
}

/**
 * Test authentication flow
 */
async function testAuthentication(): Promise<void> {
  try {
    console.log("🚀 Starting authentication test...");

    // Create wallet provider
    const walletProvider = await createWalletProvider();
    if (!walletProvider) {
      return;
    }

    // Get initial authentication state
    console.log("📊 Initial auth state:", authenticationService.getState());

    // Subscribe to state changes
    const unsubscribe = authenticationService.onStateChange((state) => {
      console.log("🔄 Auth state changed:", {
        isAuthenticated: state.isAuthenticated,
        isAuthenticating: state.isAuthenticating,
        hasSession: !!state.session,
        lastError: state.lastError?.message || null,
        retryCount: state.retryCount,
      });
    });

    // Attempt authentication
    console.log("🔐 Attempting authentication...");
    try {
      const session = await authenticationService.authenticate(walletProvider);
      console.log("✅ Authentication successful!");
      console.log("📋 Session details:", {
        wallet_address: session.wallet_address,
        session_id: session.session_id,
        expires_at: new Date(session.expires_at * 1000).toISOString(),
        access_token: session.access_token.substring(0, 20) + "...",
      });

      // Test session validation
      console.log("🔍 Testing session validation...");
      const isValid =
        await authenticationService.validateSession(walletProvider);
      console.log("✅ Session validation result:", isValid);

      // Test auth headers
      console.log("📝 Auth headers:", authenticationService.getAuthHeaders());
    } catch (error) {
      console.error("❌ Authentication failed:", error);

      // Show user-friendly error if available
      const friendlyError = authenticationService.getUserFriendlyError();
      if (friendlyError) {
        console.log("💬 User-friendly error:", friendlyError);
      }

      // Show recovery actions
      const recoveryActions = authenticationService.getRecoveryActions();
      if (recoveryActions.length > 0) {
        console.log("🔧 Available recovery actions:");
        recoveryActions.forEach((action, index) => {
          console.log(`  ${index + 1}. ${action.label}: ${action.description}`);
        });
      }
    }

    // Clean up subscription after 30 seconds
    setTimeout(() => {
      unsubscribe();
      console.log("🧹 Cleaned up auth state subscription");
    }, 30000);
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

/**
 * Test logout functionality
 */
async function testLogout(): Promise<void> {
  try {
    console.log("🚪 Testing logout...");
    await authenticationService.logout();
    console.log("✅ Logout successful");
    console.log("📊 Final auth state:", authenticationService.getState());
  } catch (error) {
    console.error("❌ Logout failed:", error);
  }
}

/**
 * Test session refresh
 */
async function testSessionRefresh(): Promise<void> {
  try {
    console.log("🔄 Testing session refresh...");
    const session = await authenticationService.refreshSession();
    console.log("✅ Session refresh successful");
    console.log("📋 New session details:", {
      expires_at: new Date(session.expires_at * 1000).toISOString(),
      access_token: session.access_token.substring(0, 20) + "...",
    });
  } catch (error) {
    console.error("❌ Session refresh failed:", error);
  }
}

/**
 * Get current authentication status
 */
function getAuthStatus(): void {
  const state = authenticationService.getState();
  console.log("📊 Current Authentication Status:");
  console.log("  🔐 Authenticated:", state.isAuthenticated);
  console.log("  ⏳ Authenticating:", state.isAuthenticating);
  console.log("  👤 Wallet:", state.session?.wallet_address || "None");
  console.log("  🆔 Session ID:", state.session?.session_id || "None");
  console.log(
    "  ⏰ Expires:",
    state.session
      ? new Date(state.session.expires_at * 1000).toISOString()
      : "None",
  );
  console.log("  ❌ Last Error:", state.lastError?.message || "None");
  console.log("  🔄 Retry Count:", state.retryCount);

  if (state.recoveryActions.length > 0) {
    console.log("  🔧 Recovery Actions:");
    state.recoveryActions.forEach((action, index) => {
      console.log(`    ${index + 1}. ${action.label}: ${action.description}`);
    });
  }
}

/**
 * Test wallet connection without authentication
 */
async function testWalletConnection(): Promise<void> {
  try {
    console.log("🔗 Testing wallet connection...");
    const walletProvider = await createWalletProvider();

    if (walletProvider) {
      console.log("✅ Wallet connection test successful");
      console.log("📋 Wallet details:", {
        address: walletProvider.address,
        isConnected: walletProvider.isConnected,
      });

      // Test signing a simple message
      console.log("✍️ Testing message signing...");
      const message = "Test message for Derive Protocol";
      const signature = await walletProvider.signer.signMessage(message);
      console.log("✅ Message signed successfully");
      console.log("📝 Signature:", signature.substring(0, 20) + "...");
    }
  } catch (error) {
    console.error("❌ Wallet connection test failed:", error);
  }
}

// Export test utilities to window object for console access
if (typeof window !== "undefined") {
  window.testAuth = {
    // Main test functions
    testAuthentication,
    testLogout,
    testSessionRefresh,
    testWalletConnection,
    getAuthStatus,

    // Direct access to service
    authService: authenticationService,

    // Helper functions
    createWalletProvider,
  };

  console.log("🧪 Authentication test utilities loaded!");
  console.log("📖 Available commands:");
  console.log("  • testAuth.testWalletConnection() - Test wallet connection");
  console.log(
    "  • testAuth.testAuthentication() - Test full authentication flow",
  );
  console.log("  • testAuth.getAuthStatus() - Check current auth status");
  console.log("  • testAuth.testLogout() - Test logout");
  console.log("  • testAuth.testSessionRefresh() - Test session refresh");
  console.log("  • testAuth.authService - Direct access to auth service");
}

export {
  testAuthentication,
  testLogout,
  testSessionRefresh,
  testWalletConnection,
  getAuthStatus,
  createWalletProvider,
};
