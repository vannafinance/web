/**
 * Authentication Methods for Derive API
 *
 * Handles authentication, session management, and WebSocket authentication.
 */

import {
  authenticationService,
  type AuthenticationSession,
  type WalletProvider,
} from "../authentication-service";
import type { WebSocketManager } from "./websocket-manager";

export class AuthMethods {
  private wsManager: WebSocketManager;
  private isAuthenticated = false;
  private currentSession: AuthenticationSession | null = null;
  private authenticationPromise: Promise<AuthenticationSession> | null = null;

  constructor(wsManager: WebSocketManager) {
    this.wsManager = wsManager;

    // Set up reconnection callback
    this.wsManager.setReconnectCallback(() => this.handleReconnectionAuth());
  }

  /**
   * Login with wallet provider
   */
  async login(walletProvider: WalletProvider): Promise<AuthenticationSession> {
    if (this.authenticationPromise) {
      return this.authenticationPromise;
    }

    this.authenticationPromise = this.performLogin(walletProvider);

    try {
      const session = await this.authenticationPromise;
      this.currentSession = session;
      this.isAuthenticated = true;
      return session;
    } catch (error) {
      this.authenticationPromise = null;
      throw error;
    } finally {
      this.authenticationPromise = null;
    }
  }

  /**
   * Perform the actual login process
   */
  private async performLogin(
    walletProvider: WalletProvider,
  ): Promise<AuthenticationSession> {
    try {
      // Ensure WebSocket connection is established
      await this.wsManager.ensureConnection();

      // Use the authentication service to handle the login
      const session = await authenticationService.authenticate(walletProvider);

      // Send authentication message to WebSocket
      await this.sendAuthenticationMessage(session);

      return session;
    } catch (error) {
      throw new Error(
        `Login failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Send authentication message to WebSocket
   */
  private async sendAuthenticationMessage(
    session: AuthenticationSession,
  ): Promise<void> {
    try {
      const authHeaders = authenticationService.getAuthHeaders();

      // Send authentication request to WebSocket
      const response = await this.wsManager.sendRequest("private/auth", {
        access_token: session.access_token,
        session_id: session.session_id,
      });

      if (response.error) {
        throw new Error(
          `WebSocket authentication failed: ${response.error.message}`,
        );
      }

      console.log("✅ WebSocket authentication successful");
    } catch (error) {
      throw new Error(
        `WebSocket authentication failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Logout and clear session
   */
  async logout(): Promise<void> {
    try {
      // Send logout message to WebSocket if connected
      if (this.isAuthenticated && this.wsManager.isConnected()) {
        try {
          await this.wsManager.sendRequest("private/logout", {
            session_id: this.currentSession?.session_id,
          });
        } catch (error) {
          console.warn("Failed to send logout message to WebSocket:", error);
        }
      }

      // Clear local authentication state
      this.isAuthenticated = false;
      this.currentSession = null;
      this.authenticationPromise = null;

      // Logout from authentication service
      await authenticationService.logout();

      console.log("✅ Logout successful");
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  }

  /**
   * Check if currently authenticated
   */
  isUserAuthenticated(): boolean {
    return this.isAuthenticated && authenticationService.isAuthenticated();
  }

  /**
   * Get current authentication session
   */
  getCurrentSession(): AuthenticationSession | null {
    return this.currentSession;
  }

  /**
   * Get authentication headers for requests
   */
  getAuthHeaders(): Record<string, string> {
    return authenticationService.getAuthHeaders();
  }

  /**
   * Refresh authentication session
   */
  async refreshSession(): Promise<AuthenticationSession> {
    try {
      const session = await authenticationService.refreshSession();
      this.currentSession = session;

      // Update WebSocket authentication
      await this.sendAuthenticationMessage(session);

      return session;
    } catch (error) {
      // If refresh fails, clear authentication state
      this.isAuthenticated = false;
      this.currentSession = null;
      throw error;
    }
  }

  /**
   * Ensure user is authenticated before making private requests
   */
  async ensureAuthenticated(): Promise<void> {
    if (!this.isAuthenticated) {
      throw new Error("Authentication required. Please login first.");
    }

    // Check if session is still valid
    const isValid = await authenticationService.validateSession();
    if (!isValid) {
      this.isAuthenticated = false;
      this.currentSession = null;
      throw new Error("Session expired. Please login again.");
    }
  }

  /**
   * Send authenticated request (wrapper for private endpoints)
   */
  async sendAuthenticatedRequest(method: string, params: any): Promise<any> {
    await this.ensureAuthenticated();

    // Add authentication headers to the request
    const authHeaders = this.getAuthHeaders();
    const authenticatedParams = {
      ...params,
      ...authHeaders,
    };

    return this.wsManager.sendRequest(method, authenticatedParams);
  }

  /**
   * Handle WebSocket authentication on reconnection
   */
  private async handleReconnectionAuth(): Promise<void> {
    if (this.isAuthenticated && this.currentSession) {
      try {
        // Re-authenticate on reconnection
        await this.sendAuthenticationMessage(this.currentSession);
      } catch (error) {
        console.warn("Failed to re-authenticate on reconnection:", error);
        // Clear authentication state if re-auth fails
        this.isAuthenticated = false;
        this.currentSession = null;
      }
    }
  }
}
