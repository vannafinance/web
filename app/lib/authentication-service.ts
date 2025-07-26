/**
 * WebSocket Authentication Service for Derive Protocol
 *
 * This service handles authentication with the Derive WebSocket API using wallet signatures.
 * It manages session state, automatic refresh, and provides integration with wallet providers.
 */

import { ethers } from "ethers";
import { ORDER_CONFIG, DERIVE_PROTOCOL_CONSTANTS } from "./order-config";
import {
  authErrorHandler,
  type AuthError,
  type RecoveryAction,
} from "./auth-error-handler";

export interface AuthenticationCredentials {
  wallet_address: string;
  signature: string;
  timestamp: number;
  nonce: string;
}

export interface AuthenticationSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  wallet_address: string;
  session_id: string;
}

export interface AuthenticationState {
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  session: AuthenticationSession | null;
  lastError: AuthError | null;
  retryCount: number;
  recoveryActions: RecoveryAction[];
}

export interface WalletProvider {
  address: string;
  signer: ethers.Signer;
  isConnected: boolean;
}

export class AuthenticationService {
  private state: AuthenticationState = {
    isAuthenticated: false,
    isAuthenticating: false,
    session: null,
    lastError: null,
    retryCount: 0,
    recoveryActions: [],
  };

  private refreshTimer: NodeJS.Timeout | null = null;
  private stateChangeListeners: Array<(state: AuthenticationState) => void> =
    [];
  private sessionStorageKey = "derive_auth_session";

  constructor() {
    // Try to restore session from storage on initialization
    this.restoreSessionFromStorage();
  }

  /**
   * Get current authentication state
   */
  getState(): AuthenticationState {
    return { ...this.state };
  }

  /**
   * Check if user is currently authenticated
   */
  isAuthenticated(): boolean {
    return this.state.isAuthenticated && this.isSessionValid();
  }

  /**
   * Check if authentication is in progress
   */
  isAuthenticating(): boolean {
    return this.state.isAuthenticating;
  }

  /**
   * Get current session if available
   */
  getSession(): AuthenticationSession | null {
    return this.state.session;
  }

  /**
   * Get authentication headers for API requests
   */
  getAuthHeaders(): Record<string, string> {
    if (!this.state.session) {
      return {};
    }

    return {
      Authorization: `Bearer ${this.state.session.access_token}`,
      "X-Session-ID": this.state.session.session_id,
    };
  }

  /**
   * Subscribe to authentication state changes
   */
  onStateChange(listener: (state: AuthenticationState) => void): () => void {
    this.stateChangeListeners.push(listener);

    // Return unsubscribe function
    return () => {
      const index = this.stateChangeListeners.indexOf(listener);
      if (index > -1) {
        this.stateChangeListeners.splice(index, 1);
      }
    };
  }

  /**
   * Authenticate with wallet provider
   */
  async authenticate(
    walletProvider: WalletProvider,
  ): Promise<AuthenticationSession> {
    if (this.state.isAuthenticating) {
      throw new Error("Authentication already in progress");
    }

    if (!walletProvider.isConnected) {
      throw new Error(ORDER_CONFIG.ERRORS.AUTH_WALLET_NOT_CONNECTED);
    }

    this.updateState({
      isAuthenticating: true,
      lastError: null,
    });

    try {
      // Step 1: Try to authenticate with EOA address first
      console.log(
        "🔐 Attempting authentication with EOA address:",
        walletProvider.address,
      );

      const credentials = await this.generateAuthCredentials(walletProvider);

      try {
        // Try authentication with EOA
        const session = await this.performAuthentication(credentials);

        // If successful, update state and return
        this.updateState({
          isAuthenticated: true,
          isAuthenticating: false,
          session,
          lastError: null,
          retryCount: 0,
        });

        this.saveSessionToStorage(session);
        this.setupSessionRefresh(session);

        return session;
      } catch (authError: any) {
        // Check if it's an "account not found" error (code 14000)
        if (
          authError.code === 14000 ||
          (authError.message &&
            authError.message.includes("ACCOUNT_NOT_FOUND_CREATE_NEEDED")) ||
          (authError.message && authError.message.includes("Account not found"))
        ) {
          console.log(
            "🚨 Account not found (Error 14000), checking for existing subaccounts...",
          );

          try {
            // Step 2: Check for existing subaccounts first
            const subaccountSession =
              await this.handleAccountNotFound(walletProvider);

            // Update state and return
            this.updateState({
              isAuthenticated: true,
              isAuthenticating: false,
              session: subaccountSession,
              lastError: null,
              retryCount: 0,
            });

            this.saveSessionToStorage(subaccountSession);
            this.setupSessionRefresh(subaccountSession);

            return subaccountSession;
          } catch (subaccountError: any) {
            console.error(
              "❌ Failed to handle account not found:",
              subaccountError,
            );

            // If we failed to handle the account not found error, wrap it with more context
            const enhancedError = new Error(
              `Failed to create or find subaccount: ${subaccountError.message || "Unknown error"}`,
            ) as any;

            if (subaccountError.code) {
              enhancedError.code = subaccountError.code;
            }

            enhancedError.originalError = subaccountError;
            throw enhancedError;
          }
        } else {
          // Re-throw other authentication errors
          throw authError;
        }
      }
    } catch (error) {
      // Parse and classify the error
      const authError = authErrorHandler.parseError(error, "authentication");

      // Generate recovery actions
      const recoveryActions = authErrorHandler.getRecoveryActions(authError, {
        onRetry: async () => {
          await this.authenticate(walletProvider);
        },
        onReconnectWallet: () => this.handleWalletReconnection(),
        onManualRefresh: async () => {
          await this.authenticate(walletProvider);
        },
      });

      this.updateState({
        isAuthenticated: false,
        isAuthenticating: false,
        session: null,
        lastError: authError,
        retryCount: this.state.retryCount + 1,
        recoveryActions,
      });

      // Reset retry attempts on successful error handling
      authErrorHandler.resetRetryAttempts("authentication");

      throw authError;
    }
  }

  /**
   * Generate authentication credentials using wallet signature
   */
  private async generateAuthCredentials(
    walletProvider: WalletProvider,
    walletAddress?: string,
  ): Promise<AuthenticationCredentials> {
    try {
      // Use milliseconds timestamp as per Derive documentation
      const timestamp = Date.now();
      const nonce = this.generateNonce();

      console.log("Generating auth credentials with timestamp:", timestamp);

      // For authentication, we use the EOA wallet address directly
      console.log(
        "Using EOA address for authentication:",
        walletProvider.address,
      );

      // Sign the timestamp directly as per Derive protocol
      const signature = await walletProvider.signer.signMessage(
        timestamp.toString(),
      );

      console.log(
        "Signature generated successfully, length:",
        signature.length,
      );

      return {
        wallet_address: walletAddress || walletProvider.address, // Use provided address or EOA
        signature,
        timestamp,
        nonce,
      };
    } catch (error) {
      console.error("Failed to generate auth credentials:", error);
      throw new Error(
        `Failed to generate authentication credentials: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Handle account not found error by checking for existing subaccounts
   * and creating a new one if necessary
   */
  private async handleAccountNotFound(
    walletProvider: WalletProvider,
  ): Promise<AuthenticationSession> {
    try {
      console.log(
        "🔍 Checking for existing subaccounts for EOA:",
        walletProvider.address,
      );

      const { deriveAPI } = await import("./derive-api");

      // Ensure WebSocket connection with extended timeout
      try {
        console.log("⏳ Waiting for WebSocket connection (60s timeout)...");
        await deriveAPI.waitForConnection(60000);
        console.log("✅ WebSocket connection established for subaccount check");
      } catch (wsError: any) {
        console.error("❌ WebSocket connection failed:", wsError);
        throw new Error(
          `WebSocket connection failed: ${wsError.message || wsError}`,
        );
      }

      // Step 1: Check for existing subaccounts using the EOA address
      console.log(
        "📋 Calling private/get_subaccounts with wallet:",
        walletProvider.address,
      );

      let subaccountsResponse;
      try {
        subaccountsResponse = await deriveAPI.sendRequest(
          "private/get_subaccounts",
          {
            wallet: walletProvider.address,
          },
        );
      } catch (subaccountError: any) {
        // If get_subaccounts fails with authentication error, we need to create a subaccount
        console.warn("⚠️ get_subaccounts request failed:", subaccountError);

        if (subaccountError.code === 10001) {
          // Authentication required
          console.log(
            "🔑 Authentication required for get_subaccounts, proceeding to create account",
          );
          return await this.createAccountAndAuthenticate(walletProvider);
        }

        throw subaccountError;
      }

      console.log("📨 Subaccounts response:", subaccountsResponse);

      // Check if we have existing subaccounts
      if (
        subaccountsResponse?.result &&
        Array.isArray(subaccountsResponse.result) &&
        subaccountsResponse.result.length > 0
      ) {
        console.log(
          "✅ Found existing subaccounts:",
          subaccountsResponse.result.length,
        );

        // Use the first subaccount for authentication
        const subaccount = subaccountsResponse.result[0];
        const subaccountAddress =
          subaccount.wallet || subaccount.address || walletProvider.address;

        console.log(
          "🔐 Attempting authentication with existing subaccount:",
          subaccountAddress,
        );

        // Generate credentials for the subaccount
        const subaccountCredentials = await this.generateAuthCredentials(
          walletProvider,
          subaccountAddress,
        );

        // Try authentication with the subaccount
        return await this.performAuthentication(subaccountCredentials);
      } else {
        console.log(
          "❌ No existing subaccounts found, creating new account...",
        );

        return await this.createAccountAndAuthenticate(walletProvider);
      }
    } catch (error: any) {
      console.error("Failed to handle account not found:", error);

      // If any error occurs during the process, fall back to direct account creation
      if (!error.message?.includes("create_account")) {
        console.log(
          "⚠️ Error during subaccount check, falling back to account creation...",
        );

        try {
          return await this.createAccountAndAuthenticate(walletProvider);
        } catch (createError: any) {
          console.error(
            "❌ Fallback account creation also failed:",
            createError,
          );
          throw createError;
        }
      }

      throw error;
    }
  }

  /**
   * Helper method to create an account and authenticate with it
   */
  private async createAccountAndAuthenticate(
    walletProvider: WalletProvider,
  ): Promise<AuthenticationSession> {
    // Create a new account using public/create_account
    await this.createDeriveAccount(walletProvider);
    console.log("✅ Account created successfully");

    // Wait a moment for the account to be fully registered in the system
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Now get the subaccounts for this wallet
    const { deriveAPI } = await import("./derive-api");

    try {
      console.log("📋 Getting subaccounts after account creation...");
      const subaccountsResponse = await deriveAPI.sendRequest(
        "private/get_subaccounts",
        {
          wallet: walletProvider.address,
        },
      );

      console.log(
        "📨 Subaccounts response after creation:",
        subaccountsResponse,
      );

      if (
        subaccountsResponse?.result &&
        Array.isArray(subaccountsResponse.result) &&
        subaccountsResponse.result.length > 0
      ) {
        // Use the first subaccount for authentication
        const subaccount = subaccountsResponse.result[0];
        const subaccountAddress =
          subaccount.wallet || subaccount.address || walletProvider.address;

        console.log(
          "🔐 Attempting authentication with new subaccount:",
          subaccountAddress,
        );

        // Generate credentials for the subaccount
        const subaccountCredentials = await this.generateAuthCredentials(
          walletProvider,
          subaccountAddress,
        );

        // Try authentication with the subaccount
        return await this.performAuthentication(subaccountCredentials);
      } else {
        // If no subaccounts found, try with the original EOA
        console.log("🔄 No subaccounts found, trying with EOA...");
        const credentials = await this.generateAuthCredentials(walletProvider);
        return await this.performAuthentication(credentials);
      }
    } catch (subaccountError: any) {
      console.warn(
        "⚠️ Failed to get subaccounts after account creation:",
        subaccountError,
      );

      // Fallback to trying authentication with the original EOA
      console.log("🔄 Falling back to EOA authentication...");
      const credentials = await this.generateAuthCredentials(walletProvider);
      return await this.performAuthentication(credentials);
    }
  }

  /**
   * Create a Derive account for the connected wallet using public/create_account
   *
   * Based on the Derive API documentation, we first create an account using public/create_account
   */
  private async createDeriveAccount(
    walletProvider: WalletProvider,
  ): Promise<void> {
    try {
      console.log("Creating Derive account for EOA:", walletProvider.address);

      // Use Next.js API proxy to avoid CORS issues
      const proxyUrl = "/api/derive/create-account";

      // Call the proxy endpoint
      console.log("🚀 Calling create_account proxy endpoint...");
      console.log("� Relquest parameters:", {
        wallet: walletProvider.address,
      });

      let createResponse;
      try {
        const response = await fetch(proxyUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            wallet: walletProvider.address,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        createResponse = await response.json();
      } catch (requestError: any) {
        console.error(
          "🚨 Network/Request error calling create_account proxy:",
          requestError,
        );
        throw new Error(
          `Failed to call create_account endpoint: ${requestError.message || requestError}`,
        );
      }

      console.log("📨 Account creation response:", createResponse);

      // Handle response
      if (createResponse?.error) {
        const errorCode = createResponse.error.code;
        const errorMessage = createResponse.error.message;

        console.error("❌ Account creation failed with error:", {
          code: errorCode,
          message: errorMessage,
          fullError: createResponse.error,
        });

        // Handle specific error cases
        switch (errorCode) {
          case 14001:
            throw new Error(
              "Invalid signature (Error 14001). Please ensure your wallet is properly connected and try again.",
            );
          case 14002:
            throw new Error(
              "Insufficient balance (Error 14002). Please ensure you have enough funds in your wallet.",
            );
          case 10002:
            throw new Error(
              "Invalid parameters (Error 10002). One or more parameters are incorrect or missing.",
            );
          case 10003:
            throw new Error("Request expired (Error 10003). Please try again.");
          default:
            throw new Error(
              `Failed to create account (Error ${errorCode}): ${errorMessage || "Unknown error"}. ` +
                "If the issue persists, you may need to create an account manually at https://app.derive.xyz/ first.",
            );
        }
      }

      // Check for successful response
      if (createResponse?.result || createResponse?.success) {
        console.log(
          "✅ Account created successfully:",
          createResponse.result || createResponse,
        );
      } else {
        // Some APIs might return success without explicit result field
        console.log("✅ Account creation request completed:", createResponse);
      }
    } catch (error) {
      console.error("Failed to create Derive account:", error);

      // Provide user-friendly error messages
      if (error instanceof Error) {
        // If it's already a user-friendly error, re-throw it
        if (
          error.message.includes("Invalid signature") ||
          error.message.includes("Insufficient balance") ||
          error.message.includes("Invalid parameters") ||
          error.message.includes("HTTP error")
        ) {
          throw error;
        }
      }

      // Handle API errors
      if (error && typeof error === "object" && "code" in error) {
        const apiError = error as any;
        switch (apiError.code) {
          case 14001:
            throw new Error(
              "Invalid signature. Please try reconnecting your wallet and try again.",
            );
          case 14002:
            throw new Error(
              "Insufficient balance. Please ensure you have enough funds in your wallet.",
            );
          default:
            throw new Error(
              `Failed to create Derive account: ${apiError.message || JSON.stringify(error)}`,
            );
        }
      }

      // Generic error fallback with clear instructions
      throw new Error(
        `Failed to create Derive account: ${error instanceof Error ? error.message : "Unknown error"}. ` +
          "\n\nPlease try the following:\n" +
          "1. Ensure your wallet is properly connected\n" +
          "2. Check that you have sufficient funds\n" +
          "3. Visit https://app.derive.xyz/ to create an account manually if the issue persists",
      );
    }
  }

  /**
   * Perform authentication with Derive API
   */
  private async performAuthentication(
    credentials: AuthenticationCredentials,
  ): Promise<AuthenticationSession> {
    try {
      // Import deriveAPI here to avoid circular dependency
      console.log("🔄 Importing derive API...");
      const { deriveAPI } = await import("./derive-api");
      console.log("✅ Derive API imported successfully");

      console.log("🔌 Establishing WebSocket connection...");
      console.log("📊 Current connection state:", {
        isConnected: deriveAPI.isConnected(),
        timestamp: new Date().toISOString(),
      });

      // Ensure WebSocket connection with increased timeout
      try {
        console.log("⏳ Waiting for WebSocket connection (60s timeout)...");
        await deriveAPI.waitForConnection(60000); // Increase timeout to 60 seconds
        console.log("✅ WebSocket connection established successfully");
      } catch (wsError: any) {
        console.error("❌ WebSocket connection failed:", wsError);
        console.error("📊 Connection state after failure:", {
          isConnected: deriveAPI.isConnected(),
          error: wsError.message || wsError,
          timestamp: new Date().toISOString(),
        });
        throw new Error(
          `WebSocket connection failed: ${wsError.message || wsError}`,
        );
      }

      console.log("Sending login request with credentials:", {
        wallet: credentials.wallet_address,
        timestamp: credentials.timestamp.toString(),
        signature: credentials.signature.substring(0, 10) + "...", // Only show first 10 chars for security
      });

      // Send login request to Derive API
      const loginResponse = await deriveAPI.sendRequest("public/login", {
        wallet: credentials.wallet_address,
        timestamp: credentials.timestamp.toString(),
        signature: credentials.signature,
      });

      console.log("Login response received:", loginResponse);

      if (!loginResponse) {
        throw new Error("No response received from login request");
      }

      if (loginResponse.error) {
        console.error("Login error:", loginResponse.error);

        // If we get "Account not found" error, throw it with the code
        if (loginResponse.error.code === 14000) {
          console.log("🚨 Account not found during login (Error 14000)");

          // Create an error object with the code property
          const accountNotFoundError = new Error(
            `Account not found: ${loginResponse.error.message || "No account exists for this wallet"}`,
          ) as any;
          accountNotFoundError.code = 14000;
          accountNotFoundError.originalError = loginResponse.error;
          throw accountNotFoundError;
        }

        // For other errors, also preserve the error code
        const apiError = new Error(
          loginResponse.error.message ||
            `Login error: ${JSON.stringify(loginResponse.error)}`,
        ) as unknown;

        // Preserve the error code for proper handling
        if (loginResponse.error.code) {
          apiError.code = loginResponse.error.code;
        }

        apiError.originalError = loginResponse.error;
        throw apiError;
      }

      if (!loginResponse.result) {
        console.warn(
          "Login successful but no result data, creating session...",
        );
      }

      // Create session from successful login
      const currentTime = Math.floor(Date.now() / 1000);
      const expiresIn = ORDER_CONFIG.TIMEOUTS.DEFAULT_SIGNATURE_EXPIRY;

      const session: AuthenticationSession = {
        access_token:
          loginResponse.result?.access_token || this.generateAccessToken(),
        refresh_token:
          loginResponse.result?.refresh_token || this.generateRefreshToken(),
        expires_at: currentTime + expiresIn,
        wallet_address: credentials.wallet_address,
        session_id:
          loginResponse.result?.session_id || this.generateSessionId(),
      };

      console.log("Authentication session created successfully");
      return session;
    } catch (error: unknown) {
      console.error("Authentication error details:", error);

      // Preserve error code if it exists
      if (error.code) {
        throw error; // Rethrow the original error to preserve the code
      }

      throw new Error(
        `Authentication failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  // Additional methods for session management, storage, etc.
  private async refreshSession(): Promise<AuthenticationSession> {
    if (!this.state.session) {
      throw new Error("No active session to refresh");
    }

    try {
      const currentTime = Math.floor(Date.now() / 1000);
      const expiresIn = ORDER_CONFIG.TIMEOUTS.DEFAULT_SIGNATURE_EXPIRY;

      const refreshedSession: AuthenticationSession = {
        ...this.state.session,
        access_token: this.generateAccessToken(),
        expires_at: currentTime + expiresIn,
      };

      return refreshedSession;
    } catch (error) {
      throw new Error(
        `Session refresh failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async logout(): Promise<void> {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }

    this.updateState({
      isAuthenticated: false,
      isAuthenticating: false,
      session: null,
      lastError: null,
      retryCount: 0,
    });

    this.clearSessionFromStorage();
  }

  private setupSessionRefresh(session: AuthenticationSession): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    const currentTime = Math.floor(Date.now() / 1000);
    const refreshTime = session.expires_at - 300; // 5 minutes before expiry
    const delay = Math.max((refreshTime - currentTime) * 1000, 60000); // At least 1 minute

    this.refreshTimer = setTimeout(async () => {
      try {
        await this.refreshSession();
      } catch (error) {
        console.error("Automatic session refresh failed:", error);
      }
    }, delay);
  }

  private isSessionValid(): boolean {
    if (!this.state.session) {
      return false;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    return currentTime < this.state.session.expires_at;
  }

  private updateState(updates: Partial<AuthenticationState>): void {
    this.state = { ...this.state, ...updates };

    this.stateChangeListeners.forEach((listener) => {
      try {
        listener(this.getState());
      } catch (error) {
        console.error("Error in authentication state listener:", error);
      }
    });
  }

  private saveSessionToStorage(session: AuthenticationSession): void {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem(this.sessionStorageKey, JSON.stringify(session));
      }
    } catch (error) {
      console.warn("Failed to save session to storage:", error);
    }
  }

  private restoreSessionFromStorage(): void {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const storedSession = localStorage.getItem(this.sessionStorageKey);
        if (storedSession) {
          const session: AuthenticationSession = JSON.parse(storedSession);

          if (this.isSessionValidForSession(session)) {
            this.updateState({
              isAuthenticated: true,
              session,
            });

            this.setupSessionRefresh(session);
          } else {
            this.clearSessionFromStorage();
          }
        }
      }
    } catch (error) {
      console.warn("Failed to restore session from storage:", error);
      this.clearSessionFromStorage();
    }
  }

  private clearSessionFromStorage(): void {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.removeItem(this.sessionStorageKey);
      }
    } catch (error) {
      console.warn("Failed to clear session from storage:", error);
    }
  }

  private isSessionValidForSession(session: AuthenticationSession): boolean {
    const currentTime = Math.floor(Date.now() / 1000);
    return currentTime < session.expires_at;
  }

  private generateNonce(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 18)}`;
  }

  private generateAccessToken(): string {
    return `access_${Date.now()}_${Math.random().toString(36).substring(2, 34)}`;
  }

  private generateRefreshToken(): string {
    return `refresh_${Date.now()}_${Math.random().toString(36).substring(2, 34)}`;
  }

  private async handleWalletReconnection(): Promise<void> {
    console.log("Wallet reconnection requested");
  }

  getUserFriendlyError(): string | null {
    if (!this.state.lastError) {
      return null;
    }

    return authErrorHandler.getUserFriendlyMessage(this.state.lastError);
  }

  shouldAutoRetry(): boolean {
    if (!this.state.lastError) {
      return false;
    }

    return authErrorHandler.shouldAutoRetry(
      this.state.lastError,
      "authentication",
    );
  }

  getRetryDelay(): number {
    return authErrorHandler.getRetryDelay("authentication");
  }

  resetErrorState(): void {
    authErrorHandler.resetRetryAttempts("authentication");
    this.updateState({
      lastError: null,
      retryCount: 0,
      recoveryActions: [],
    });
  }

  async retryAuthentication(
    walletProvider: WalletProvider,
  ): Promise<AuthenticationSession> {
    const maxRetries = ORDER_CONFIG.TIMEOUTS.MAX_RETRY_ATTEMPTS;

    if (this.state.retryCount >= maxRetries) {
      throw new Error(`Maximum retry attempts (${maxRetries}) exceeded`);
    }

    const delay = Math.min(
      ORDER_CONFIG.TIMEOUTS.RETRY_DELAY_BASE *
        Math.pow(2, this.state.retryCount),
      ORDER_CONFIG.TIMEOUTS.RETRY_DELAY_MAX,
    );

    await new Promise((resolve) => setTimeout(resolve, delay));

    return this.authenticate(walletProvider);
  }

  async performAutoRetry(
    walletProvider: WalletProvider,
  ): Promise<AuthenticationSession | null> {
    if (!this.shouldAutoRetry()) {
      return null;
    }

    const delay = this.getRetryDelay();

    await new Promise((resolve) => setTimeout(resolve, delay));

    try {
      return await this.authenticate(walletProvider);
    } catch (error) {
      return null;
    }
  }

  async handleSessionExpiry(walletProvider?: WalletProvider): Promise<void> {
    await this.logout();

    if (walletProvider && walletProvider.isConnected) {
      try {
        await this.authenticate(walletProvider);
      } catch (error) {
        console.warn("Failed to re-authenticate after session expiry:", error);
      }
    }
  }

  async validateSession(walletProvider?: WalletProvider): Promise<boolean> {
    if (!this.state.session) {
      return false;
    }

    if (this.isSessionValid()) {
      return true;
    }

    await this.handleSessionExpiry(walletProvider);
    return false;
  }

  getRecoveryActions(): RecoveryAction[] {
    return this.state.recoveryActions;
  }

  async executeRecoveryAction(actionType: string): Promise<void> {
    const action = this.state.recoveryActions.find(
      (a) => a.type === actionType,
    );
    if (action) {
      await action.action();
    }
  }
}

// Export singleton instance
export const authenticationService = new AuthenticationService();
