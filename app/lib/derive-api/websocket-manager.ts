/**
 * WebSocket Connection Manager for Derive API
 *
 * Handles WebSocket connection, reconnection, message handling, and request management.
 */

import { DERIVE_WS_TESTNET } from "../constants";

const WS_URL = DERIVE_WS_TESTNET;

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
    if (this.isConnected()) {
      return Promise.resolve();
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = this.connect();
    return this.connectionPromise;
  }

  /**
   * Establish WebSocket connection
   */
  private async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnecting) {
        return;
      }

      this.isConnecting = true;
      this.ws = new WebSocket(WS_URL);

      const connectionTimeout = setTimeout(() => {
        if (this.ws) {
          this.ws.close();
        }
        this.isConnecting = false;
        this.isReady = false;
        reject(new Error("WebSocket connection timeout"));
      }, 30000); // 30 second timeout

      this.ws.onopen = async () => {
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
        console.error("Derive WebSocket error:", event);
        reject(new Error("WebSocket connection failed"));
      };
    });
  }

  /**
   * Wait for connection to be established
   */
  async waitForConnection(timeoutMs: number = 10000): Promise<void> {
    const startTime = Date.now();
    while (!this.isConnected() && Date.now() - startTime < timeoutMs) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    if (!this.isConnected()) {
      throw new Error("Timeout waiting for WebSocket connection");
    }
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
  private handleSubscriptionMessage(message: any): void {
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
    const pendingRequest = this.pendingRequests.get(response.id);
    if (!pendingRequest) {
      return;
    }

    clearTimeout(pendingRequest.timeout);
    this.pendingRequests.delete(response.id);

    if (response.error) {
      pendingRequest.reject(response.error);
    } else {
      pendingRequest.resolve(response); // Return the full response
    }
  }

  /**
   * Send request via WebSocket
   */
  async sendRequest(method: string, params: any): Promise<any> {
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
