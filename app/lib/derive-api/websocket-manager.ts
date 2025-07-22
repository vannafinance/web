/**
 * WebSocket Connection Manager for Derive API
 *
 * Handles WebSocket connection, reconnection, message handling, and request management.
 */

import { DERIVE_WS_MAINNET } from "../constants";

const WS_URL = DERIVE_WS_MAINNET;

export interface PendingRequest {
  resolve: (value: any) => void;
  reject: (error: any) => void;
  timeout: NodeJS.Timeout;
}

export interface JSONRPCRequest {
  method: string;
  params: any;
  id: string;
}

export interface JSONRPCResponse {
  id: string;
  result?: any;
  error?: any;
}

export interface DeriveSubscription {
  channel: string;
  callback: (data: any) => void;
  instrumentName: string;
  type: string;
}

export type DeriveSubscriptionCallback = (data: any) => void;

export class WebSocketManager {
  private ws: WebSocket | null = null;
  private pendingRequests: Map<string, PendingRequest> = new Map();
  private connectionPromise: Promise<void> | null = null;
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private isReady = false;

  // Subscription management
  private subscriptions: Map<string, DeriveSubscription> = new Map();

  // Callback for handling reconnection authentication
  private onReconnectCallback?: () => Promise<void>;

  constructor() {
    console.log("🏗️ WebSocketManager constructor called");
    console.log("📡 Target WebSocket URL:", WS_URL);
    console.log(
      "🌐 WebSocket API available:",
      typeof WebSocket !== "undefined",
    );
    // Auto-connect is handled in ensureConnection
  }

  /**
   * Set callback for handling reconnection authentication
   */
  setReconnectCallback(callback: () => Promise<void>): void {
    this.onReconnectCallback = callback;
  }

  /**
   * Check if WebSocket is connected and ready
   */
  isConnected(): boolean {
    return this.isReady && this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Generate unique request ID
   */
  generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Ensure WebSocket connection is established
   */
  async ensureConnection(): Promise<void> {
    // If already connected, resolve immediately
    if (this.isConnected()) {
      console.log("WebSocket already connected, using existing connection");
      return Promise.resolve();
    }

    // If connection is in progress, wait for it
    if (this.connectionPromise) {
      console.log("WebSocket connection in progress, waiting...");
      return this.connectionPromise;
    }

    console.log("Initiating new WebSocket connection to:", WS_URL);

    // Try to connect with retry logic
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        this.connectionPromise = this.connect();
        await this.connectionPromise;
        console.log("WebSocket connection established successfully");
        return;
      } catch (error) {
        retryCount++;
        console.error(
          `WebSocket connection attempt ${retryCount} failed:`,
          error,
        );

        if (retryCount >= maxRetries) {
          console.error("Maximum WebSocket connection retries reached");
          this.connectionPromise = null;
          throw error;
        }

        // Wait before retrying
        const delay = 1000 * Math.pow(2, retryCount - 1); // Exponential backoff
        console.log(`Retrying connection in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    return this.connectionPromise;
  }

  /**
   * Establish WebSocket connection
   */
  private async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnecting) {
        console.log("Connection already in progress, skipping...");
        return;
      }

      this.isConnecting = true;

      console.log("🔌 Attempting WebSocket connection to:", WS_URL);
      console.log("🌐 Environment checks:", {
        hasWebSocket: typeof WebSocket !== "undefined",
        isBrowser: typeof window !== "undefined",
        isSecureContext:
          typeof window !== "undefined" ? window.isSecureContext : "unknown",
        userAgent:
          typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
      });

      if (typeof WebSocket === "undefined") {
        console.error("❌ WebSocket is not available in this environment");
        this.isConnecting = false;
        reject(new Error("WebSocket is not available in this environment"));
        return;
      }

      try {
        console.log("🚀 Creating WebSocket instance...");
        this.ws = new WebSocket(WS_URL);
        console.log("✅ WebSocket instance created successfully");
        console.log("📊 Initial WebSocket state:", this.ws.readyState);
      } catch (error) {
        console.error("❌ Failed to create WebSocket instance:", error);
        this.isConnecting = false;
        reject(error);
        return;
      }

      const connectionTimeout = setTimeout(() => {
        console.error("❌ WebSocket connection timeout after 30 seconds");
        if (this.ws) {
          this.ws.close();
        }
        this.isConnecting = false;
        this.isReady = false;
        reject(new Error("WebSocket connection timeout"));
      }, 30000); // 30 second timeout

      this.ws.onopen = async () => {
        console.log(
          "✅ WebSocket connection established successfully to:",
          WS_URL,
        );
        clearTimeout(connectionTimeout);
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.connectionPromise = null;

        // Wait for the connection to stabilize
        await new Promise((resolve) => setTimeout(resolve, 1000));
        this.isReady = true;

        // Handle re-authentication on reconnection
        if (this.onReconnectCallback) {
          this.onReconnectCallback().catch((error) => {
            console.warn("Failed to re-authenticate on connection:", error);
          });
        }

        resolve();
      };

      this.ws.onmessage = (event: MessageEvent) => {
        try {
          const message = JSON.parse(event.data);

          // Handle subscription notifications (they have method and params)
          if (message.method && message.params) {
            this.handleSubscriptionMessage(message);
          } else {
            // Handle regular JSON-RPC responses (they have id and result/error)
            this.handleResponse(message as JSONRPCResponse);
          }
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error);
        }
      };

      this.ws.onclose = (event: CloseEvent) => {
        clearTimeout(connectionTimeout);
        this.isConnecting = false;
        this.connectionPromise = null;
        this.isReady = false;

        // Reject all pending requests
        this.pendingRequests.forEach(({ reject, timeout }) => {
          clearTimeout(timeout);
          reject(new Error("WebSocket connection closed"));
        });
        this.pendingRequests.clear();

        // Clear subscriptions on disconnect
        this.subscriptions.clear();

        // Attempt to reconnect if not a clean disconnect
        if (
          event.code !== 1000 &&
          this.reconnectAttempts < this.maxReconnectAttempts
        ) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (event: Event) => {
        clearTimeout(connectionTimeout);
        this.isConnecting = false;
        this.isReady = false;
        console.error("❌ WebSocket connection error:", {
          event,
          url: WS_URL,
          readyState: this.ws?.readyState,
          timestamp: new Date().toISOString(),
        });
        reject(
          new Error(`WebSocket connection failed to ${WS_URL}: ${event.type}`),
        );
      };
    });
  }

  /**
   * Wait for connection to be established
   */
  async waitForConnection(timeoutMs: number = 10000): Promise<void> {
    console.log(
      `Waiting for WebSocket connection (timeout: ${timeoutMs}ms)...`,
    );

    // First try to ensure connection with retry logic
    try {
      await this.ensureConnection();
      console.log("Connection established via ensureConnection");
      return;
    } catch (error) {
      console.warn("ensureConnection failed, falling back to polling:", error);
    }

    // Fall back to polling if ensureConnection fails
    const startTime = Date.now();
    const pollInterval = 200; // Poll every 200ms

    while (!this.isConnected() && Date.now() - startTime < timeoutMs) {
      console.log(
        `Waiting for connection... (${Math.round((Date.now() - startTime) / 1000)}s elapsed)`,
      );
      await new Promise((resolve) => setTimeout(resolve, pollInterval));

      // Try to reconnect if not connecting
      if (
        !this.isConnecting &&
        !this.isConnected() &&
        !this.connectionPromise
      ) {
        console.log("Connection not in progress, attempting to connect...");
        try {
          this.connectionPromise = this.connect();
          await this.connectionPromise;
        } catch (error) {
          console.warn("Connection attempt failed:", error);
        }
      }
    }

    if (!this.isConnected()) {
      console.error(`WebSocket connection timeout after ${timeoutMs}ms`);
      throw new Error("Timeout waiting for WebSocket connection");
    }

    console.log("WebSocket connection confirmed");
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      10000, // Cap at 10 seconds
    ); // Exponential backoff with cap

    setTimeout(() => {
      if (this.reconnectAttempts <= this.maxReconnectAttempts) {
        this.connect().catch((error) => {
          console.error(
            `Reconnection attempt ${this.reconnectAttempts} failed:`,
            error,
          );
        });
      }
    }, delay);
  }

  /**
   * Handle subscription messages
   */
  private handleSubscriptionMessage(message: unknown): void {
    const { method, params } = message;

    if (method === "subscription" && params) {
      const { channel, data } = params;
      const subscription = this.subscriptions.get(channel);

      if (subscription) {
        subscription.callback(data);
      }
    }
  }

  /**
   * Handle JSON-RPC responses
   */
  private handleResponse(response: JSONRPCResponse): void {
    console.log(`Received WebSocket response:`, response);

    const pendingRequest = this.pendingRequests.get(response.id);
    if (!pendingRequest) {
      console.warn(`No pending request found for response ID: ${response.id}`);
      return;
    }

    clearTimeout(pendingRequest.timeout);
    this.pendingRequests.delete(response.id);

    if (response.error) {
      console.error(`WebSocket request error:`, response.error);
      pendingRequest.reject(response.error);
    } else {
      console.log(`WebSocket request successful:`, response.result);
      pendingRequest.resolve(response); // Return the full response
    }
  }

  /**
   * Send request via WebSocket
   */
  async sendRequest(method: string, params: unknown): Promise<unknown> {
    await this.ensureConnection();

    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket not connected");
    }

    return new Promise((resolve, reject) => {
      const id = this.generateId();
      const request: JSONRPCRequest = {
        method,
        params,
        id,
      };

      // Set up timeout
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`Request timeout for method: ${method}`));
      }, 30000); // 30 second timeout

      // Store pending request
      this.pendingRequests.set(id, { resolve, reject, timeout });

      // Send request
      const requestString = JSON.stringify(request);
      console.log(`Sending WebSocket request:`, request);
      this.ws!.send(requestString);
    });
  }

  /**
   * Add subscription
   */
  addSubscription(
    subscriptionId: string,
    subscription: DeriveSubscription,
  ): void {
    this.subscriptions.set(subscriptionId, subscription);
  }

  /**
   * Remove subscription
   */
  removeSubscription(subscriptionId: string): void {
    this.subscriptions.delete(subscriptionId);
  }

  /**
   * Get subscription
   */
  getSubscription(subscriptionId: string): DeriveSubscription | undefined {
    return this.subscriptions.get(subscriptionId);
  }

  /**
   * Check if subscription exists
   */
  hasSubscription(subscriptionId: string): boolean {
    return this.subscriptions.has(subscriptionId);
  }

  /**
   * Get all subscriptions
   */
  getAllSubscriptions(): Map<string, DeriveSubscription> {
    return new Map(this.subscriptions);
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close(1000, "Client disconnect");
      this.ws = null;
    }

    // Clear all pending requests
    this.pendingRequests.forEach(({ reject, timeout }) => {
      clearTimeout(timeout);
      reject(new Error("WebSocket disconnected"));
    });
    this.pendingRequests.clear();

    // Clear subscriptions
    this.subscriptions.clear();
  }
}
