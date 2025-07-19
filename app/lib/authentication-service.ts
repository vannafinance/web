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
      // Generate authentication credentials
      const credentials = await this.generateAuthCredentials(walletProvider);

      // Perform authentication with Derive API
      const session = await this.performAuthentication(credentials);

      // Update state and setup session management
      this.updateState({
        isAuthenticated: true,
        isAuthenticating: false,
        session,
        lastError: null,
        retryCount: 0,
      });

      // Save session to storage
      this.saveSessionToStorage(session);

      // Setup automatic refresh
      this.setupSessionRefresh(session);

      return session;
    } catch (error) {
      // Parse and classify the error
      const authError = authErrorHandler.parseError(error, "authentication");

      // Generate recovery actions
      const recoveryActions = authErrorHandler.getRecoveryActions(authError, {
        onRetry: () => this.authenticate(walletProvider),
        onReconnectWallet: () => this.handleWalletReconnection(),
        onManualRefresh: () => this.authenticate(walletProvider),
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
   * Refresh authentication session
   */
  async refreshSession(): Promise<AuthenticationSession> {
    if (!this.state.session) {
      throw new Error("No active session to refresh");
    }

    try {
      const refreshedSession = await this.performSessionRefresh(
        this.state.session,
      );

      this.updateState({
        session: refreshedSession,
        lastError: null,
      });

      // Save updated session to storage
      this.saveSessionToStorage(refreshedSession);

      // Setup next refresh
      this.setupSessionRefresh(refreshedSession);

      return refreshedSession;
    } catch (error) {
      // If refresh fails, clear session and require re-authentication
      this.logout();
      throw new Error(ORDER_CONFIG.ERRORS.AUTH_SESSION_EXPIRED);
    }
  }

  /**
   * Logout and clear session
   */
  async logout(): Promise<void> {
    // Clear refresh timer
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }

    // Perform logout with API if session exists
    if (this.state.session) {
      try {
        await this.performLogout(this.state.session);
      } catch (error) {
        // Log error but don't throw - we want to clear local state regardless
        console.warn("Failed to logout from server:", error);
      }
    }

    // Clear local state
    this.updateState({
      isAuthenticated: false,
      isAuthenticating: false,
      session: null,
      lastError: null,
      retryCount: 0,
    });

    // Clear stored session
    this.clearSessionFromStorage();
  }

  /**
   * Retry authentication with exponential backoff
   */
  async retryAuthentication(
    walletProvider: WalletProvider,
  ): Promise<AuthenticationSession> {
    const maxRetries = ORDER_CONFIG.TIMEOUTS.MAX_RETRY_ATTEMPTS;

    if (this.state.retryCount >= maxRetries) {
      throw new Error(`Maximum retry attempts (${maxRetries}) exceeded`);
    }

    // Calculate delay with exponential backoff
    const delay = Math.min(
      ORDER_CONFIG.TIMEOUTS.RETRY_DELAY_BASE *
        Math.pow(2, this.state.retryCount),
      ORDER_CONFIG.TIMEOUTS.RETRY_DELAY_MAX,
    );

    // Wait before retrying
    await new Promise((resolve) => setTimeout(resolve, delay));

    return this.authenticate(walletProvider);
  }

  /**
   * Generate authentication credentials using wallet signature
   */
  private async generateAuthCredentials(
    walletProvider: WalletProvider,
  ): Promise<AuthenticationCredentials> {
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const nonce = this.generateNonce();

      // Create authentication message according to Derive protocol
      const authMessage = this.createAuthMessage(
        walletProvider.address,
        timestamp,
        nonce,
      );

      // Sign the message with wallet
      const signature = await walletProvider.signer.signMessage(authMessage);

      return {
        wallet_address: walletProvider.address,
        signature,
        timestamp,
        nonce,
      };
    } catch (error) {
      throw new Error(
        `Failed to generate authentication credentials: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Create authentication message for signing
   */
  private createAuthMessage(
    walletAddress: string,
    timestamp: number,
    nonce: string,
  ): string {
    // Create message according to Derive protocol specifications
    const message = [
      "Derive Protocol Authentication",
      `Wallet: ${walletAddress}`,
      `Timestamp: ${timestamp}`,
      `Nonce: ${nonce}`,
      `Domain: ${DERIVE_PROTOCOL_CONSTANTS.DOMAIN_NAME}`,
      `Chain ID: ${DERIVE_PROTOCOL_CONSTANTS.DOMAIN_CHAIN_ID}`,
    ].join("\n");

    return message;
  }

  /**
   * Perform authentication with Derive API
   */
  private async performAuthentication(
    credentials: AuthenticationCredentials,
  ): Promise<AuthenticationSession> {
    // This would typically make a WebSocket request to the authentication endpoint
    // For now, we'll simulate the authentication process

    try {
      // In a real implementation, this would send a WebSocket message like:
      // {
      //   "method": "public/auth",
      //   "params": {
      //     "wallet_address": credentials.wallet_address,
      //     "signature": credentials.signature,
      //     "timestamp": credentials.timestamp,
      //     "nonce": credentials.nonce
      //   }
      // }

      // Simulate API response
      const sessionId = this.generateSessionId();
      const currentTime = Math.floor(Date.now() / 1000);
      const expiresIn = ORDER_CONFIG.TIMEOUTS.DEFAULT_SIGNATURE_EXPIRY;

      const session: AuthenticationSession = {
        access_token: this.generateAccessToken(),
        refresh_token: this.generateRefreshToken(),
        expires_at: currentTime + expiresIn,
        wallet_address: credentials.wallet_address,
        session_id: sessionId,
      };

      return session;
    } catch (error) {
      throw new Error(
        `Authentication failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Perform session refresh
   */
  private async performSessionRefresh(
    session: AuthenticationSession,
  ): Promise<AuthenticationSession> {
    try {
      // In a real implementation, this would send a WebSocket message like:
      // {
      //   "method": "private/refresh_token",
      //   "params": {
      //     "refresh_token": session.refresh_token
      //   }
      // }

      // Simulate refreshed session
      const currentTime = Math.floor(Date.now() / 1000);
      const expiresIn = ORDER_CONFIG.TIMEOUTS.DEFAULT_SIGNATURE_EXPIRY;

      const refreshedSession: AuthenticationSession = {
        ...session,
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

  /**
   * Perform logout with API
   */
  private async performLogout(session: AuthenticationSession): Promise<void> {
    try {
      // In a real implementation, this would send a WebSocket message like:
      // {
      //   "method": "private/logout",
      //   "params": {
      //     "session_id": session.session_id
      //   }
      // }

      // For now, just simulate successful logout
      console.log("Logged out from session:", session.session_id);
    } catch (error) {
      throw new Error(
        `Logout failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Setup automatic session refresh
   */
  private setupSessionRefresh(session: AuthenticationSession): void {
    // Clear existing timer
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    // Calculate when to refresh (5 minutes before expiry)
    const currentTime = Math.floor(Date.now() / 1000);
    const refreshTime = session.expires_at - 300; // 5 minutes before expiry
    const delay = Math.max((refreshTime - currentTime) * 1000, 60000); // At least 1 minute

    this.refreshTimer = setTimeout(async () => {
      try {
        await this.refreshSession();
      } catch (error) {
        console.error("Automatic session refresh failed:", error);
        // Session will be cleared by refreshSession on failure
      }
    }, delay);
  }

  /**
   * Check if current session is valid
   */
  private isSessionValid(): boolean {
    if (!this.state.session) {
      return false;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    return currentTime < this.state.session.expires_at;
  }

  /**
   * Update authentication state and notify listeners
   */
  private updateState(updates: Partial<AuthenticationState>): void {
    this.state = { ...this.state, ...updates };

    // Notify all listeners
    this.stateChangeListeners.forEach((listener) => {
      try {
        listener(this.getState());
      } catch (error) {
        console.error("Error in authentication state listener:", error);
      }
    });
  }

  /**
   * Save session to local storage
   */
  private saveSessionToStorage(session: AuthenticationSession): void {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem(this.sessionStorageKey, JSON.stringify(session));
      }
    } catch (error) {
      console.warn("Failed to save session to storage:", error);
    }
  }

  /**
   * Restore session from local storage
   */
  private restoreSessionFromStorage(): void {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const storedSession = localStorage.getItem(this.sessionStorageKey);
        if (storedSession) {
          const session: AuthenticationSession = JSON.parse(storedSession);

          // Check if session is still valid
          if (this.isSessionValidForSession(session)) {
            this.updateState({
              isAuthenticated: true,
              session,
            });

            // Setup refresh for restored session
            this.setupSessionRefresh(session);
          } else {
            // Clear invalid session
            this.clearSessionFromStorage();
          }
        }
      }
    } catch (error) {
      console.warn("Failed to restore session from storage:", error);
      this.clearSessionFromStorage();
    }
  }

  /**
   * Clear session from local storage
   */
  private clearSessionFromStorage(): void {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.removeItem(this.sessionStorageKey);
      }
    } catch (error) {
      console.warn("Failed to clear session from storage:", error);
    }
  }

  /**
   * Check if a specific session is valid
   */
  private isSessionValidForSession(session: AuthenticationSession): boolean {
    const currentTime = Math.floor(Date.now() / 1000);
    return currentTime < session.expires_at;
  }

  /**
   * Generate a unique nonce
   */
  private generateNonce(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
  }

  /**
   * Generate access token (in real implementation, this would come from server)
   */
  private generateAccessToken(): string {
    return `access_${Date.now()}_${Math.random().toString(36).substr(2, 32)}`;
  }

  /**
   * Generate refresh token (in real implementation, this would come from server)
   */
  private generateRefreshToken(): string {
    return `refresh_${Date.now()}_${Math.random().toString(36).substr(2, 32)}`;
  }

  /**
   * Handle wallet reconnection
   */
  private async handleWalletReconnection(): Promise<void> {
    // This would typically trigger wallet connection UI
    // For now, just log the action
    console.log("Wallet reconnection requested");

    // In a real implementation, this would:
    // 1. Check if wallet is available
    // 2. Request connection
    // 3. Update wallet provider state
    // 4. Retry authentication if successful
  }

  /**
   * Get user-friendly error message
   */
  getUserFriendlyError(): string | null {
    if (!this.state.lastError) {
      return null;
    }

    return authErrorHandler.getUserFriendlyMessage(this.state.lastError);
  }

  /**
   * Check if automatic retry should be attempted
   */
  shouldAutoRetry(): boolean {
    if (!this.state.lastError) {
      return false;
    }

    return authErrorHandler.shouldAutoRetry(
      this.state.lastError,
      "authentication",
    );
  }

  /**
   * Get retry delay for next attempt
   */
  getRetryDelay(): number {
    return authErrorHandler.getRetryDelay("authentication");
  }

  /**
   * Reset error state and retry attempts
   */
  resetErrorState(): void {
    authErrorHandler.resetRetryAttempts("authentication");
    this.updateState({
      lastError: null,
      retryCount: 0,
      recoveryActions: [],
    });
  }

  /**
   * Perform automatic retry if conditions are met
   */
  async performAutoRetry(
    walletProvider: WalletProvider,
  ): Promise<AuthenticationSession | null> {
    if (!this.shouldAutoRetry()) {
      return null;
    }

    const delay = this.getRetryDelay();

    // Wait for the calculated delay
    await new Promise((resolve) => setTimeout(resolve, delay));

    try {
      return await this.authenticate(walletProvider);
    } catch (error) {
      // Error will be handled by authenticate method
      return null;
    }
  }

  /**
   * Handle session expiry with automatic recovery
   */
  async handleSessionExpiry(walletProvider?: WalletProvider): Promise<void> {
    // Clear current session
    await this.logout();

    // If wallet provider is available, attempt re-authentication
    if (walletProvider && walletProvider.isConnected) {
      try {
        await this.authenticate(walletProvider);
      } catch (error) {
        // Error will be handled by authenticate method
        console.warn("Failed to re-authenticate after session expiry:", error);
      }
    }
  }

  /**
   * Check and handle session validity
   */
  async validateSession(walletProvider?: WalletProvider): Promise<boolean> {
    if (!this.state.session) {
      return false;
    }

    // Check if session is still valid
    if (this.isSessionValid()) {
      return true;
    }

    // Session is expired, handle expiry
    await this.handleSessionExpiry(walletProvider);
    return false;
  }

  /**
   * Get recovery actions for current error state
   */
  getRecoveryActions(): RecoveryAction[] {
    return this.state.recoveryActions;
  }

  /**
   * Execute a specific recovery action
   */
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
