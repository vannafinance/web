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
   * Generate session key authentication credentials
   * Signs with EOA but authenticates as the smart contract wallet
   */
  private async generateSessionKeyCredentials(
    walletProvider: WalletProvider,
    smartContractWalletAddress: string,
  ): Promise<AuthenticationCredentials> {
    try {
      // Use milliseconds timestamp as per Derive documentation
      const timestamp = Date.now();
      const nonce = this.generateNonce();

      console.log(
        "Generating session key credentials with timestamp:",
        timestamp,
      );
      console.log("Smart contract wallet address:", smartContractWalletAddress);
      console.log("Session key (EOA) address:", walletProvider.address);

      // Sign the timestamp with the EOA (session key)
      const signature = await walletProvider.signer.signMessage(
        timestamp.toString(),
      );

      console.log(
        "Session key signature generated successfully, length:",
        signature.length,
      );

      return {
        wallet_address: smartContractWalletAddress, // Use smart contract wallet address
        signature, // Signature from EOA (session key)
        timestamp,
        nonce,
      };
    } catch (error) {
      console.error("Failed to generate session key credentials:", error);
      throw new Error(
        `Failed to generate session key credentials: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Handle account not found error by checking for existing subaccounts
   * and setting up session key authentication
   */
  private async handleAccountNotFound(
    walletProvider: WalletProvider,
  ): Promise<AuthenticationSession> {
    try {
      console.log(
        "🔍 Checking for existing Derive smart contract wallet for EOA:",
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

      // Step 1: Get the Derive smart contract wallet address for this EOA
      console.log(
        "📋 Getting Derive smart contract wallet address for EOA:",
        walletProvider.address,
      );

      let smartContractWallet;
      try {
        // First try to get existing subaccounts to find the smart contract wallet
        const subaccountsResponse = await deriveAPI.sendRequest(
          "private/get_subaccounts",
          {
            wallet: walletProvider.address,
          },
        );

        console.log("📨 Subaccounts response:", subaccountsResponse);

        if (
          subaccountsResponse?.result &&
          Array.isArray(subaccountsResponse.result) &&
          subaccountsResponse.result.length > 0
        ) {
          // Found existing subaccounts - use the smart contract wallet address
          smartContractWallet = subaccountsResponse.result[0];
          console.log(
            "✅ Found existing smart contract wallet:",
            smartContractWallet,
          );
        }
      } catch (subaccountError: any) {
        console.warn("⚠️ get_subaccounts request failed:", subaccountError);

        // If get_subaccounts fails, throw the error
        if (subaccountError.code === 10001 || subaccountError.code === 14000) {
          console.log(
            "🔑 Account creation not supported - user must create account manually",
          );
          throw new Error(
            `Account not found. Please create an account at https://app.derive.xyz/ first, then try authenticating again.`,
          );
        }

        throw subaccountError;
      }

      if (!smartContractWallet) {
        console.log(
          "❌ No smart contract wallet found, user must create account manually",
        );
        throw new Error(
          `No Derive account found. Please:\n\n` +
            `1. Go to https://app.derive.xyz/\n` +
            `2. Connect your wallet (${walletProvider.address})\n` +
            `3. Create a new account\n` +
            `4. Return here and try authenticating again`,
        );
      }

      // Step 2: Check if EOA is already a session key for the smart contract wallet
      const smartContractAddress =
        smartContractWallet.wallet || smartContractWallet.address;
      console.log(
        "🔑 Checking session keys for smart contract wallet:",
        smartContractAddress,
      );

      try {
        // Try to authenticate with the smart contract wallet address using EOA signature
        console.log("🔐 Attempting session key authentication...");
        const sessionKeyCredentials = await this.generateSessionKeyCredentials(
          walletProvider,
          smartContractAddress,
        );

        return await this.performAuthentication(sessionKeyCredentials);
      } catch (sessionError: any) {
        console.warn("⚠️ Session key authentication failed:", sessionError);

        // If session key auth fails, we need to add the EOA as a session key
        if (
          sessionError.code === 10001 ||
          sessionError.message?.includes("Unauthorized")
        ) {
          console.log(
            "🔧 EOA not registered as session key, need to add it via UI",
          );

          throw new Error(
            `Session key not found. Please:\n\n` +
              `1. Go to https://app.derive.xyz/\n` +
              `2. Connect your wallet (${walletProvider.address})\n` +
              `3. Navigate to Account Settings\n` +
              `4. Add your EOA (${walletProvider.address}) as a session key\n` +
              `5. Try authenticating again\n\n` +
              `Your Derive smart contract wallet: ${smartContractAddress}`,
          );
        }

        throw sessionError;
      }
    } catch (error: any) {
      console.error("Failed to handle account not found:", error);

      // If it's our custom session key error, re-throw it
      if (error.message?.includes("Session key not found")) {
        throw error;
      }

      // If any other error occurs during the process, provide user instructions
      console.log(
        "⚠️ Error during smart contract wallet check, user must create account manually",
      );

      throw new Error(
        `Authentication failed. Please:\n\n` +
          `1. Go to https://app.derive.xyz/\n` +
          `2. Connect your wallet (${walletProvider.address})\n` +
          `3. Create a new account if you don't have one\n` +
          `4. Set up session keys if needed\n` +
          `5. Return here and try authenticating again\n\n` +
          `Original error: ${error.message}`,
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
        signature: credentials.signature,
      });

      // Send login request to Derive API
      const loginResponse = await deriveAPI.sendRequest("public/login", {
        wallet: "0x969D29f5C6A7D6848580AB6b531d898C57B2B33E",
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

  /**
   * Check if EOA is set up as a session key for the smart contract wallet
   */
  async checkSessionKeyStatus(walletProvider: WalletProvider): Promise<{
    hasSmartContractWallet: boolean;
    smartContractAddress?: string;
    isSessionKeySetup: boolean;
    error?: string;
  }> {
    try {
      const { deriveAPI } = await import("./derive-api");

      // Ensure connection
      await deriveAPI.waitForConnection(30000);

      // Get smart contract wallet
      const subaccountsResponse = await deriveAPI.sendRequest(
        "private/get_subaccounts",
        {
          wallet: walletProvider.address,
        },
      );

      if (
        !subaccountsResponse?.result ||
        !Array.isArray(subaccountsResponse.result) ||
        subaccountsResponse.result.length === 0
      ) {
        return {
          hasSmartContractWallet: false,
          isSessionKeySetup: false,
        };
      }

      const smartContractWallet = subaccountsResponse.result[0];
      const smartContractAddress =
        smartContractWallet.wallet || smartContractWallet.address;

      // Try session key authentication to check if it's set up
      try {
        const sessionKeyCredentials = await this.generateSessionKeyCredentials(
          walletProvider,
          smartContractAddress,
        );

        await this.performAuthentication(sessionKeyCredentials);

        return {
          hasSmartContractWallet: true,
          smartContractAddress,
          isSessionKeySetup: true,
        };
      } catch (authError: any) {
        return {
          hasSmartContractWallet: true,
          smartContractAddress,
          isSessionKeySetup: false,
          error: authError.message,
        };
      }
    } catch (error: unknown) {
      return {
        hasSmartContractWallet: false,
        isSessionKeySetup: false,
        error: error.message,
      };
    }
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

  /**
   * Get instructions for setting up session key
   */
  getSessionKeyInstructions(
    walletAddress: string,
    smartContractAddress?: string,
  ): string {
    return (
      `To authenticate with Derive, you need to add your EOA as a session key:\n\n` +
      `1. Go to https://app.derive.xyz/\n` +
      `2. Connect your wallet (${walletAddress})\n` +
      `3. Navigate to Account Settings or Profile\n` +
      `4. Look for "Session Keys" or "API Keys" section\n` +
      `5. Add your EOA address (${walletAddress}) as a session key\n` +
      `6. Save the changes\n` +
      `7. Return here and try authenticating again\n\n` +
      (smartContractAddress
        ? `Your Derive smart contract wallet: ${smartContractAddress}\n\n`
        : "") +
      `Note: Your "account" in Derive is a smart contract wallet, but you sign transactions with your EOA as a session key.`
    );
  }
}

// Export singleton instance
export const authenticationService = new AuthenticationService();
