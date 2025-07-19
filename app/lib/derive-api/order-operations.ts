/**
 * Order Operations for Derive API
 *
 * Handles order submission, cancellation, status tracking, and order-related subscriptions.
 */

import type { WebSocketManager } from "./websocket-manager";
import type { AuthMethods } from "./auth-methods";

export class OrderOperations {
  private wsManager: WebSocketManager;
  private authMethods: AuthMethods;

  constructor(wsManager: WebSocketManager, authMethods: AuthMethods) {
    this.wsManager = wsManager;
    this.authMethods = authMethods;
  }

  /**
   * Submit an order to the Derive exchange
   */
  async submitOrder(signedOrder: any): Promise<any> {
    try {
      await this.authMethods.ensureAuthenticated();

      console.log("📤 Submitting order:", {
        instrument: signedOrder.instrument_name,
        direction: signedOrder.direction,
        amount: signedOrder.amount,
        price: signedOrder.limit_price,
        type: signedOrder.order_type,
      });

      const response = await this.authMethods.sendAuthenticatedRequest(
        "private/buy",
        {
          instrument_name: signedOrder.instrument_name,
          subaccount_id: signedOrder.subaccount_id,
          direction: signedOrder.direction,
          limit_price: signedOrder.limit_price.toString(),
          amount: signedOrder.amount.toString(),
          signature_expiry_sec: signedOrder.signature_expiry_sec,
          max_fee: signedOrder.max_fee,
          nonce: signedOrder.nonce,
          signer: signedOrder.signer,
          order_type: signedOrder.order_type,
          mmp: signedOrder.mmp,
          signature: signedOrder.signature,
        },
      );

      if (response.error) {
        throw new Error(`Order submission failed: ${response.error.message}`);
      }

      console.log("✅ Order submitted successfully:", response.result);
      return response.result;
    } catch (error) {
      console.error("❌ Order submission failed:", error);
      throw error;
    }
  }

  /**
   * Cancel an existing order
   */
  async cancelOrder(orderId: string): Promise<any> {
    try {
      await this.authMethods.ensureAuthenticated();

      console.log("🚫 Cancelling order:", orderId);

      const response = await this.authMethods.sendAuthenticatedRequest(
        "private/cancel",
        {
          order_id: orderId,
        },
      );

      if (response.error) {
        throw new Error(`Order cancellation failed: ${response.error.message}`);
      }

      console.log("✅ Order cancelled successfully:", response.result);
      return response.result;
    } catch (error) {
      console.error("❌ Order cancellation failed:", error);
      throw error;
    }
  }

  /**
   * Get order status
   */
  async getOrderStatus(orderId: string): Promise<any> {
    try {
      await this.authMethods.ensureAuthenticated();

      const response = await this.authMethods.sendAuthenticatedRequest(
        "private/get_order_state",
        {
          order_id: orderId,
        },
      );

      if (response.error) {
        throw new Error(
          `Failed to get order status: ${response.error.message}`,
        );
      }

      return response.result;
    } catch (error) {
      console.error("❌ Failed to get order status:", error);
      throw error;
    }
  }

  /**
   * Get open orders for a subaccount
   */
  async getOpenOrders(
    subaccountId?: number,
    instrumentName?: string,
  ): Promise<any> {
    try {
      await this.authMethods.ensureAuthenticated();

      const params: any = {};
      if (subaccountId !== undefined) {
        params.subaccount_id = subaccountId;
      }
      if (instrumentName) {
        params.instrument_name = instrumentName;
      }

      const response = await this.authMethods.sendAuthenticatedRequest(
        "private/get_open_orders",
        params,
      );

      if (response.error) {
        throw new Error(`Failed to get open orders: ${response.error.message}`);
      }

      return response.result;
    } catch (error) {
      console.error("❌ Failed to get open orders:", error);
      throw error;
    }
  }

  /**
   * Get order history for a subaccount
   */
  async getOrderHistory(
    subaccountId?: number,
    instrumentName?: string,
    limit?: number,
  ): Promise<any> {
    try {
      await this.authMethods.ensureAuthenticated();

      const params: any = {};
      if (subaccountId !== undefined) {
        params.subaccount_id = subaccountId;
      }
      if (instrumentName) {
        params.instrument_name = instrumentName;
      }
      if (limit) {
        params.limit = limit;
      }

      const response = await this.authMethods.sendAuthenticatedRequest(
        "private/get_order_history",
        params,
      );

      if (response.error) {
        throw new Error(
          `Failed to get order history: ${response.error.message}`,
        );
      }

      return response.result;
    } catch (error) {
      console.error("❌ Failed to get order history:", error);
      throw error;
    }
  }

  /**
   * Subscribe to order status updates
   */
  async subscribeToOrderUpdates(
    callback: (orderUpdate: any) => void,
  ): Promise<void> {
    try {
      await this.authMethods.ensureAuthenticated();
      await this.wsManager.ensureConnection();

      const subscriptionId = "user.orders";

      // Check if subscription already exists
      if (this.wsManager.hasSubscription(subscriptionId)) {
        console.log("Already subscribed to order updates, updating callback");
        const existingSubscription =
          this.wsManager.getSubscription(subscriptionId)!;
        existingSubscription.callback = callback;
        return;
      }

      const subscription = {
        channel: "user.orders",
        callback,
        instrumentName: "orders",
        type: "orders",
      };

      this.wsManager.addSubscription(subscriptionId, subscription);

      // Send subscription request
      await this.authMethods.sendAuthenticatedRequest("private/subscribe", {
        channels: ["user.orders"],
      });

      console.log("✅ Subscribed to order updates");
    } catch (error) {
      console.error("❌ Failed to subscribe to order updates:", error);
      throw error;
    }
  }

  /**
   * Unsubscribe from order status updates
   */
  async unsubscribeFromOrderUpdates(): Promise<void> {
    try {
      const subscriptionId = "user.orders";

      if (!this.wsManager.hasSubscription(subscriptionId)) {
        console.log("No active order updates subscription found");
        return;
      }

      if (
        this.wsManager.isConnected() &&
        this.authMethods.isUserAuthenticated()
      ) {
        await this.authMethods.sendAuthenticatedRequest("private/unsubscribe", {
          channels: ["user.orders"],
        });
      }

      this.wsManager.removeSubscription(subscriptionId);
      console.log("✅ Unsubscribed from order updates");
    } catch (error) {
      console.error("❌ Failed to unsubscribe from order updates:", error);
    }
  }

  /**
   * Get order book for validation before order submission
   */
  async getOrderBook(instrumentName: string, depth: number = 10): Promise<any> {
    try {
      const response = await this.wsManager.sendRequest(
        "public/get_order_book",
        {
          instrument_name: instrumentName,
          depth,
        },
      );

      if (response.error) {
        throw new Error(`Failed to get order book: ${response.error.message}`);
      }

      return response.result;
    } catch (error) {
      console.error("❌ Failed to get order book:", error);
      throw error;
    }
  }

  /**
   * Parse order response and extract relevant information
   */
  parseOrderResponse(response: any): any {
    try {
      if (!response || !response.order) {
        throw new Error("Invalid order response format");
      }

      const order = response.order;

      return {
        orderId: order.order_id,
        instrumentName: order.instrument_name,
        direction: order.direction,
        amount: parseFloat(order.amount),
        price: parseFloat(order.price),
        orderType: order.order_type,
        status: order.order_state,
        createdAt: order.creation_timestamp,
        filledAmount: parseFloat(order.filled_amount || "0"),
        averagePrice: parseFloat(order.average_price || "0"),
        fee: parseFloat(order.fee || "0"),
        subaccountId: order.subaccount_id,
      };
    } catch (error) {
      console.error("❌ Failed to parse order response:", error);
      throw new Error(
        `Failed to parse order response: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Validate order before submission
   */
  async validateOrderBeforeSubmission(
    signedOrder: any,
  ): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      // Check authentication
      if (!this.authMethods.isUserAuthenticated()) {
        errors.push("Authentication required");
      }

      // Check WebSocket connection
      if (!this.wsManager.isConnected()) {
        errors.push("WebSocket connection required");
      }

      // Validate order signature
      if (!signedOrder.signature) {
        errors.push("Order signature is required");
      }

      // Get order book to check if price is reasonable (optional validation)
      try {
        const orderBook = await this.getOrderBook(
          signedOrder.instrument_name,
          5,
        );
        if (orderBook && orderBook.bids && orderBook.asks) {
          const bestBid = parseFloat(orderBook.bids[0]?.[0] || "0");
          const bestAsk = parseFloat(orderBook.asks[0]?.[0] || "0");
          const orderPrice = parseFloat(signedOrder.limit_price);

          // Check if price is within reasonable range (not more than 50% away from best prices)
          if (signedOrder.direction === "buy" && bestAsk > 0) {
            if (orderPrice > bestAsk * 1.5) {
              errors.push("Buy price is significantly above market price");
            }
          } else if (signedOrder.direction === "sell" && bestBid > 0) {
            if (orderPrice < bestBid * 0.5) {
              errors.push("Sell price is significantly below market price");
            }
          }
        }
      } catch (error) {
        // Order book validation is optional, don't fail the entire validation
        console.warn("Could not validate against order book:", error);
      }

      return {
        isValid: errors.length === 0,
        errors,
      };
    } catch (error) {
      errors.push(
        `Validation error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      return {
        isValid: false,
        errors,
      };
    }
  }
}
