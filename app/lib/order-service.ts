/**
 * Order Service - Main orchestration layer for order submission
 *
 * This service coordinates authentication, order signing, and submission
 * to provide a complete order management workflow.
 */

import { ethers } from "ethers";
import {
  authenticationService,
  type AuthenticationSession,
  type WalletProvider,
} from "./authentication-service";
import {
  orderSigningService,
  type OrderParams,
  type SignedOrder,
} from "./order-signing";
import { deriveAPI } from "./derive-api";
import { ORDER_CONFIG } from "./order-config";
import {
  orderErrorHandler,
  type OrderError,
  type OrderRecoveryAction,
  type OrderNotification,
  OrderErrorType,
} from "./order-error-handler";

// Order service interfaces
export interface OrderFormData {
  size: string;
  limitPrice: string;
  orderType: "limit" | "market";
  direction: "buy" | "sell";
  selectedOption: OptionData;
  optionType: "call" | "put";
}

export interface OptionData {
  strike: number;
  instrument: {
    instrument_name: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface OrderValidation {
  isValid: boolean;
  errors: {
    size?: string;
    limitPrice?: string;
    balance?: string;
    limits?: string;
    authentication?: string;
    network?: string;
  };
  warnings?: string[];
}

export interface OrderResult {
  success: boolean;
  orderId?: string;
  error?: string;
  details?: unknown;
  timestamp: number;
}

export interface OrderState {
  isSubmitting: boolean;
  lastOrder?: OrderResult;
  error?: string;
  validationErrors?: OrderValidation["errors"];
}

export interface OrderStatusUpdate {
  orderId: string;
  status: string;
  timestamp: number;
  details?: unknown;
}

export interface OrderHistoryItem {
  orderId: string;
  instrumentName: string;
  direction: "buy" | "sell";
  amount: number;
  price: number;
  orderType: "limit" | "market";
  status: string;
  createdAt: number;
  updatedAt: number;
  filledAmount: number;
  averagePrice?: number;
  fee: number;
  subaccountId: number;
}

// Order service event types
export type OrderUpdateCallback = (update: OrderStatusUpdate) => void;
export type OrderStateCallback = (state: OrderState) => void;

export class OrderService {
  private state: OrderState = {
    isSubmitting: false,
  };

  private stateChangeListeners: OrderStateCallback[] = [];
  private orderUpdateListeners: OrderUpdateCallback[] = [];
  private orderStatusSubscription: (() => void) | null = null;
  private notificationUnsubscribe: (() => void) | null = null;

  // Order history management
  private orderHistory: Map<string, OrderHistoryItem> = new Map();
  private orderHistoryListeners: ((history: OrderHistoryItem[]) => void)[] = [];

  constructor() {
    // Initialize order status tracking
    this.initializeOrderStatusTracking();

    // Subscribe to error notifications
    this.notificationUnsubscribe = orderErrorHandler.onNotification(
      (notification) => this.handleNotification(notification),
    );
  }

  /**
   * Get current order service state
   */
  getState(): OrderState {
    return { ...this.state };
  }

  /**
   * Subscribe to order state changes
   */
  onStateChange(listener: OrderStateCallback): () => void {
    this.stateChangeListeners.push(listener);
    return () => {
      const index = this.stateChangeListeners.indexOf(listener);
      if (index > -1) {
        this.stateChangeListeners.splice(index, 1);
      }
    };
  }

  /**
   * Subscribe to order status updates
   */
  onOrderUpdate(listener: OrderUpdateCallback): () => void {
    this.orderUpdateListeners.push(listener);
    return () => {
      const index = this.orderUpdateListeners.indexOf(listener);
      if (index > -1) {
        this.orderUpdateListeners.splice(index, 1);
      }
    };
  }

  /**
   * Subscribe to order history updates
   */
  onOrderHistoryUpdate(
    listener: (history: OrderHistoryItem[]) => void,
  ): () => void {
    this.orderHistoryListeners.push(listener);
    return () => {
      const index = this.orderHistoryListeners.indexOf(listener);
      if (index > -1) {
        this.orderHistoryListeners.splice(index, 1);
      }
    };
  }

  /**
   * Get current order history
   */
  getOrderHistory(): OrderHistoryItem[] {
    return Array.from(this.orderHistory.values()).sort(
      (a, b) => b.updatedAt - a.updatedAt,
    );
  }

  /**
   * Get order history filtered by status
   */
  getOrderHistoryByStatus(status?: string): OrderHistoryItem[] {
    const history = this.getOrderHistory();
    if (!status) return history;
    return history.filter(
      (order) => order.status.toLowerCase() === status.toLowerCase(),
    );
  }

  /**
   * Get open orders (orders that can be cancelled)
   */
  getOpenOrders(): OrderHistoryItem[] {
    const openStatuses = ["open", "pending", "partially_filled", "submitted"];
    return this.getOrderHistory().filter((order) =>
      openStatuses.includes(order.status.toLowerCase()),
    );
  }

  /**
   * Get completed orders
   */
  getCompletedOrders(): OrderHistoryItem[] {
    const completedStatuses = [
      "filled",
      "completed",
      "cancelled",
      "rejected",
      "expired",
    ];
    return this.getOrderHistory().filter((order) =>
      completedStatuses.includes(order.status.toLowerCase()),
    );
  }

  /**
   * Get order by ID from history
   */
  getOrderById(orderId: string): OrderHistoryItem | null {
    return this.orderHistory.get(orderId) || null;
  }

  /**
   * Main order submission method - orchestrates complete workflow
   */
  async submitOrder(
    orderFormData: OrderFormData,
    walletProvider: WalletProvider,
    subaccountId: number = 0,
  ): Promise<OrderResult> {
    if (this.state.isSubmitting) {
      throw new Error("Order submission already in progress");
    }

    this.updateState({
      isSubmitting: true,
      error: undefined,
      validationErrors: undefined,
    });

    const contextKey = `order_${Date.now()}`;

    try {
      // Step 1: Validate order parameters
      const validation = await this.validateOrder(
        orderFormData,
        walletProvider,
        subaccountId,
      );

      if (!validation.isValid) {
        const result: OrderResult = {
          success: false,
          error: "Order validation failed",
          details: validation.errors,
          timestamp: Date.now(),
        };

        this.updateState({
          isSubmitting: false,
          lastOrder: result,
          validationErrors: validation.errors,
        });

        // Create validation error notification
        this.notifyValidationErrors(validation.errors);

        return result;
      }

      // Show warnings if any
      if (validation.warnings && validation.warnings.length > 0) {
        validation.warnings.forEach((warning) => {
          const notification =
            orderErrorHandler.createWarningNotification(warning);
          orderErrorHandler.notify(notification);
        });
      }

      // Step 2: Ensure authentication
      await this.ensureAuthentication(walletProvider);

      // Step 3: Create order parameters
      const orderParams = this.createOrderParams(
        orderFormData,
        walletProvider.address,
        subaccountId,
      );

      // Step 4: Sign the order
      const signedOrder = await this.signOrder(orderParams, walletProvider);

      // Step 5: Submit to exchange
      const submissionResult = await this.submitSignedOrder(signedOrder);

      // Step 6: Process result
      const result: OrderResult = {
        success: true,
        orderId: submissionResult.order_id || submissionResult.id,
        details: submissionResult,
        timestamp: Date.now(),
      };

      this.updateState({
        isSubmitting: false,
        lastOrder: result,
        error: undefined,
        validationErrors: undefined,
      });

      // Reset retry attempts on success
      orderErrorHandler.resetRetryAttempts(contextKey);

      // Create success notification
      if (result.orderId) {
        const notification = orderErrorHandler.createSuccessNotification(
          result.orderId,
          result.details,
        );
        orderErrorHandler.notify(notification);

        // Add to order history
        this.addToOrderHistory(orderFormData, result, subaccountId);

        // Start tracking this order
        this.trackOrderStatus(result.orderId);
      }

      return result;
    } catch (error) {
      // Parse and classify the error
      const orderError = orderErrorHandler.parseError(error, contextKey);

      const result: OrderResult = {
        success: false,
        error: orderError.message,
        details: orderError,
        timestamp: Date.now(),
      };

      this.updateState({
        isSubmitting: false,
        lastOrder: result,
        error: orderError.message,
      });

      // Create recovery actions
      const recoveryActions = orderErrorHandler.getRecoveryActions(orderError, {
        onRetry: () =>
          this.submitOrder(orderFormData, walletProvider, subaccountId),
        onAdjustParameters: () => this.handleParameterAdjustment(orderError),
        onReconnect: () => this.handleReconnection(),
        onReauthenticate: () => this.handleReauthentication(walletProvider),
        onCheckBalance: () => this.handleBalanceCheck(subaccountId),
      });

      // Create and send error notification
      const notification = orderErrorHandler.createErrorNotification(
        orderError,
        recoveryActions,
      );
      orderErrorHandler.notify(notification);

      // Attempt automatic retry if appropriate
      if (orderErrorHandler.shouldAutoRetry(orderError, contextKey)) {
        const delay = orderErrorHandler.getRetryDelay(contextKey);
        console.log(`Auto-retrying order submission in ${delay}ms`);

        setTimeout(async () => {
          try {
            await this.submitOrder(orderFormData, walletProvider, subaccountId);
          } catch (retryError) {
            console.error("Auto-retry failed:", retryError);
          }
        }, delay);
      }

      return result;
    }
  }

  /**
   * Validate order before submission
   */
  async validateOrder(
    orderFormData: OrderFormData,
    walletProvider: WalletProvider,
    subaccountId: number = 0,
  ): Promise<OrderValidation> {
    const errors: OrderValidation["errors"] = {};
    const warnings: string[] = [];

    try {
      // Validate wallet connection
      if (!walletProvider.isConnected) {
        errors.authentication = ORDER_CONFIG.ERRORS.AUTH_WALLET_NOT_CONNECTED;
      }

      // Validate network connection
      if (!deriveAPI.isConnected()) {
        errors.network = ORDER_CONFIG.ERRORS.WEBSOCKET_CONNECTION_FAILED;
      }

      // Validate order size
      const size = parseFloat(orderFormData.size);
      if (isNaN(size) || size <= 0) {
        errors.size = "Order size must be a positive number";
      } else if (size < ORDER_CONFIG.LIMITS.MIN_ORDER_SIZE) {
        errors.size = `Order size must be at least ${ORDER_CONFIG.LIMITS.MIN_ORDER_SIZE}`;
      } else if (size > ORDER_CONFIG.LIMITS.MAX_ORDER_SIZE) {
        errors.size = `Order size cannot exceed ${ORDER_CONFIG.LIMITS.MAX_ORDER_SIZE}`;
      }

      // Validate limit price for limit orders
      if (orderFormData.orderType === "limit") {
        const limitPrice = parseFloat(orderFormData.limitPrice);
        if (isNaN(limitPrice) || limitPrice <= 0) {
          errors.limitPrice = "Limit price must be a positive number";
        } else if (limitPrice < ORDER_CONFIG.LIMITS.MIN_PRICE) {
          errors.limitPrice = `Limit price must be at least ${ORDER_CONFIG.LIMITS.MIN_PRICE}`;
        } else if (limitPrice > ORDER_CONFIG.LIMITS.MAX_PRICE) {
          errors.limitPrice = `Limit price cannot exceed ${ORDER_CONFIG.LIMITS.MAX_PRICE}`;
        }
      }

      // Validate instrument
      if (!orderFormData.selectedOption?.instrument?.instrument_name) {
        errors.limits = "No option selected";
      }

      // Check available balance if authenticated
      if (
        authenticationService.isAuthenticated() &&
        !errors.size &&
        !errors.limitPrice
      ) {
        try {
          const orderValue =
            size *
            (orderFormData.orderType === "limit"
              ? parseFloat(orderFormData.limitPrice)
              : 0);
          const hasBalance = await deriveAPI.checkSufficientBalance(
            orderValue,
            subaccountId,
          );

          if (!hasBalance) {
            errors.balance = ORDER_CONFIG.ERRORS.ORDER_INSUFFICIENT_BALANCE;
          }
        } catch (error) {
          // Balance check failed, add as warning
          warnings.push("Could not verify account balance");
        }
      }

      // Add warnings for market conditions
      if (orderFormData.orderType === "market") {
        warnings.push(
          "Market orders execute immediately at current market price",
        );
      }

      const isValid = Object.keys(errors).length === 0;

      return {
        isValid,
        errors,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error) {
      return {
        isValid: false,
        errors: {
          limits: `Validation error: ${error instanceof Error ? error.message : "Unknown error"}`,
        },
      };
    }
  }

  /**
   * Get order status
   */
  async getOrderStatus(orderId: string): Promise<OrderStatusUpdate | null> {
    try {
      const status = await deriveAPI.getOrderStatus(orderId);

      return {
        orderId,
        status: status.order_state || status.status || "unknown",
        timestamp: Date.now(),
        details: status,
      };
    } catch (error) {
      console.error(`Failed to get order status for ${orderId}:`, error);
      return null;
    }
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string): Promise<OrderResult> {
    try {
      console.log(`🚫 Cancelling order: ${orderId}`);

      // Check if order exists in history and is cancellable
      const orderInHistory = this.getOrderById(orderId);
      if (orderInHistory) {
        const cancellableStatuses = [
          "open",
          "pending",
          "partially_filled",
          "submitted",
        ];
        if (
          !cancellableStatuses.includes(orderInHistory.status.toLowerCase())
        ) {
          throw new Error(
            `Order ${orderId} cannot be cancelled (status: ${orderInHistory.status})`,
          );
        }
      }

      const result = await deriveAPI.cancelOrder(orderId);

      // Update order status in history immediately
      if (orderInHistory) {
        const updatedOrder: OrderHistoryItem = {
          ...orderInHistory,
          status: "cancelling",
          updatedAt: Date.now(),
        };
        this.orderHistory.set(orderId, updatedOrder);
        this.notifyOrderHistoryListeners();
      }

      // Create success notification
      const notification = orderErrorHandler.createSuccessNotification(
        orderId,
        {
          message: `Order ${orderId} cancellation requested`,
          type: "order_cancellation",
        },
      );
      orderErrorHandler.notify(notification);

      console.log(`✅ Order cancellation requested: ${orderId}`);

      return {
        success: true,
        orderId,
        details: result,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error(`❌ Failed to cancel order ${orderId}:`, error);

      // Create error notification
      const notification = orderErrorHandler.createErrorNotification({
        type: OrderErrorType.ORDER_CANCELLATION_FAILED,
        message:
          error instanceof Error ? error.message : "Failed to cancel order",
        recoverable: true,
        retryable: true,
        orderId,
      });
      orderErrorHandler.notify(notification);

      return {
        success: false,
        orderId,
        error:
          error instanceof Error ? error.message : "Failed to cancel order",
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Cancel multiple orders
   */
  async cancelMultipleOrders(orderIds: string[]): Promise<OrderResult[]> {
    console.log(`🚫 Cancelling ${orderIds.length} orders:`, orderIds);

    const results = await Promise.allSettled(
      orderIds.map((orderId) => this.cancelOrder(orderId)),
    );

    return results.map((result, index) => {
      if (result.status === "fulfilled") {
        return result.value;
      } else {
        return {
          success: false,
          orderId: orderIds[index],
          error:
            result.reason instanceof Error
              ? result.reason.message
              : "Cancellation failed",
          timestamp: Date.now(),
        };
      }
    });
  }

  /**
   * Cancel all open orders
   */
  async cancelAllOpenOrders(): Promise<OrderResult[]> {
    const openOrders = this.getOpenOrders();
    const orderIds = openOrders.map((order) => order.orderId);

    if (orderIds.length === 0) {
      console.log("No open orders to cancel");
      return [];
    }

    console.log(`🚫 Cancelling all ${orderIds.length} open orders`);
    return this.cancelMultipleOrders(orderIds);
  }

  /**
   * Get order history from API
   */
  async getOrderHistoryFromAPI(
    subaccountId?: number,
    instrumentName?: string,
    limit: number = 50,
  ): Promise<unknown[]> {
    try {
      return await deriveAPI.getOrderHistory(
        subaccountId,
        instrumentName,
        limit,
      );
    } catch (error) {
      console.error("Failed to get order history:", error);
      return [];
    }
  }

  /**
   * Ensure user is authenticated before order submission
   */
  private async ensureAuthentication(
    walletProvider: WalletProvider,
  ): Promise<void> {
    if (!authenticationService.isAuthenticated()) {
      try {
        await authenticationService.authenticate(walletProvider);
      } catch (error) {
        throw new Error(
          `Authentication failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }

    // Validate session is still active
    const isValid = await authenticationService.validateSession(walletProvider);
    if (!isValid) {
      throw new Error("Authentication session invalid");
    }
  }

  /**
   * Create order parameters from form data
   */
  private createOrderParams(
    orderFormData: OrderFormData,
    signerAddress: string,
    subaccountId: number,
  ): OrderParams {
    const size = parseFloat(orderFormData.size);
    const limitPrice =
      orderFormData.orderType === "limit"
        ? parseFloat(orderFormData.limitPrice)
        : 0; // Market orders will use current market price

    return orderSigningService.createOrderParams(
      orderFormData.selectedOption.instrument.instrument_name,
      subaccountId,
      orderFormData.direction,
      limitPrice,
      size,
      signerAddress,
      orderFormData.orderType,
      false, // mmp
    );
  }

  /**
   * Sign order using order signing service
   */
  private async signOrder(
    orderParams: OrderParams,
    walletProvider: WalletProvider,
  ): Promise<SignedOrder> {
    try {
      return await orderSigningService.signOrder(
        orderParams,
        walletProvider.signer,
      );
    } catch (error) {
      throw new Error(
        `Order signing failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Submit signed order to exchange
   */
  private async submitSignedOrder(signedOrder: SignedOrder): Promise<unknown> {
    try {
      // Validate order before submission
      const validation =
        await deriveAPI.validateOrderBeforeSubmission(signedOrder);
      if (!validation.isValid) {
        throw new Error(
          `Order validation failed: ${validation.errors.join(", ")}`,
        );
      }

      // Submit to exchange
      const result = await deriveAPI.submitOrder(signedOrder);

      if (!result || result.error) {
        throw new Error(result?.error?.message || "Order submission failed");
      }

      return result;
    } catch (error) {
      throw new Error(
        `Order submission failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Initialize order status tracking
   */
  private async initializeOrderStatusTracking(): Promise<void> {
    try {
      // Subscribe to order updates from the API
      await deriveAPI.subscribeToOrderUpdates((orderUpdate: unknown) => {
        this.handleOrderUpdate(orderUpdate);
      });

      // Subscribe to trade updates for position refresh
      await deriveAPI.subscribeToTradeUpdates((tradeUpdate: unknown) => {
        this.handleTradeUpdate(tradeUpdate);
      });

      console.log("✅ Order status tracking initialized");
    } catch (error) {
      console.warn("Failed to initialize order status tracking:", error);
    }
  }

  /**
   * Handle order status updates from WebSocket
   */
  private handleOrderUpdate(orderUpdate: unknown): void {
    try {
      // Parse order update
      const update = this.parseOrderUpdate(orderUpdate);

      if (update) {
        console.log("📊 Order status update:", {
          orderId: update.orderId,
          status: update.status,
          timestamp: new Date(update.timestamp).toISOString(),
        });

        // Update order history
        this.updateOrderInHistory(update);

        // Check if order is completed and trigger position refresh
        if (this.isOrderCompleted(update.status)) {
          this.handleOrderCompletion(update);
        }

        // Notify listeners
        this.orderUpdateListeners.forEach((listener) => {
          try {
            listener(update);
          } catch (error) {
            console.error("Error in order update listener:", error);
          }
        });
      }
    } catch (error) {
      console.error("Failed to handle order update:", error);
    }
  }

  /**
   * Handle trade updates from WebSocket
   */
  private handleTradeUpdate(tradeUpdate: unknown): void {
    try {
      if (typeof tradeUpdate === "object" && tradeUpdate !== null) {
        const trade = tradeUpdate as Record<string, unknown>;

        console.log("💰 Trade executed:", {
          tradeId: trade.tradeId,
          orderId: trade.orderId,
          instrument: trade.instrumentName,
          amount: trade.amount,
          price: trade.price,
        });

        // Trigger position refresh after trade execution
        this.refreshPositionsAfterTrade(trade);

        // Create trade notification
        const notification = orderErrorHandler.createSuccessNotification(
          String(trade.tradeId || "trade"),
          {
            message: `Trade executed: ${trade.amount} ${trade.instrumentName} at ${trade.price}`,
            type: "trade_execution",
          },
        );
        orderErrorHandler.notify(notification);
      }
    } catch (error) {
      console.error("Failed to handle trade update:", error);
    }
  }

  /**
   * Check if order status indicates completion
   */
  private isOrderCompleted(status: string): boolean {
    const completedStatuses = [
      "filled",
      "completed",
      "partially_filled",
      "cancelled",
      "rejected",
      "expired",
    ];
    return completedStatuses.includes(status.toLowerCase());
  }

  /**
   * Handle order completion - refresh positions and balances
   */
  private async handleOrderCompletion(
    orderUpdate: OrderStatusUpdate,
  ): Promise<void> {
    try {
      console.log("🔄 Order completed, refreshing positions and balances...");

      // Refresh positions
      await this.refreshPositions();

      // Refresh balances
      await this.refreshBalances();

      // Create completion notification
      const isSuccessful = ["filled", "completed", "partially_filled"].includes(
        orderUpdate.status.toLowerCase(),
      );

      if (isSuccessful) {
        const notification = orderErrorHandler.createSuccessNotification(
          orderUpdate.orderId,
          {
            message: `Order ${orderUpdate.orderId} ${orderUpdate.status}`,
            type: "order_completion",
          },
        );
        orderErrorHandler.notify(notification);
      } else {
        const notification = orderErrorHandler.createWarningNotification(
          `Order ${orderUpdate.orderId} ${orderUpdate.status}`,
          "Order Status",
        );
        orderErrorHandler.notify(notification);
      }
    } catch (error) {
      console.error("Failed to handle order completion:", error);
    }
  }

  /**
   * Refresh positions after trade execution
   */
  private async refreshPositionsAfterTrade(
    trade: Record<string, unknown>,
  ): Promise<void> {
    try {
      // Small delay to ensure backend has processed the trade
      setTimeout(async () => {
        await this.refreshPositions();
        await this.refreshBalances();
      }, 1000);
    } catch (error) {
      console.error("Failed to refresh positions after trade:", error);
    }
  }

  /**
   * Refresh user positions
   */
  private async refreshPositions(): Promise<void> {
    try {
      // This would typically trigger a UI refresh
      // For now, we just log the action
      console.log("🔄 Refreshing positions...");

      // In a real implementation, this might:
      // 1. Fetch updated positions from the API
      // 2. Update a global state store
      // 3. Trigger UI components to re-render

      // Example: await deriveAPI.getPositions();
    } catch (error) {
      console.error("Failed to refresh positions:", error);
    }
  }

  /**
   * Refresh user balances
   */
  private async refreshBalances(): Promise<void> {
    try {
      console.log("💰 Refreshing balances...");

      // In a real implementation, this might:
      // 1. Fetch updated account summary
      // 2. Update balance displays in UI
      // 3. Recalculate available trading power

      // Example: await deriveAPI.getAccountSummary();
    } catch (error) {
      console.error("Failed to refresh balances:", error);
    }
  }

  /**
   * Parse order update from WebSocket message
   */
  private parseOrderUpdate(orderUpdate: unknown): OrderStatusUpdate | null {
    try {
      if (typeof orderUpdate === "object" && orderUpdate !== null) {
        const update = orderUpdate as Record<string, unknown>;

        // Handle different possible data structures
        let orderData = update;

        // If update has an 'order' property, use that
        if (update.order) {
          orderData = update.order as Record<string, unknown>;
        }

        // If update is an array, take the first item
        if (Array.isArray(update) && update.length > 0) {
          orderData = update[0] as Record<string, unknown>;
        }

        const orderId = String(
          orderData.orderId || orderData.order_id || orderData.id || "",
        );
        const status = String(
          orderData.status ||
            orderData.order_state ||
            orderData.state ||
            "unknown",
        );

        // Extract additional order information
        const instrumentName = String(
          orderData.instrumentName || orderData.instrument_name || "",
        );
        const direction = String(orderData.direction || "");
        const amount = orderData.amount
          ? parseFloat(String(orderData.amount))
          : undefined;
        const price = orderData.price
          ? parseFloat(String(orderData.price))
          : undefined;
        const filledAmount =
          orderData.filledAmount || orderData.filled_amount
            ? parseFloat(
                String(orderData.filledAmount || orderData.filled_amount),
              )
            : 0;

        return {
          orderId,
          status,
          timestamp:
            typeof orderData.timestamp === "number"
              ? orderData.timestamp
              : Date.now(),
          details: {
            ...orderData,
            instrumentName,
            direction,
            amount,
            price,
            filledAmount,
          },
        };
      }

      return null;
    } catch (error) {
      console.error("Failed to parse order update:", error);
      return null;
    }
  }

  /**
   * Track status of a specific order
   */
  private async trackOrderStatus(orderId: string): Promise<void> {
    // For now, we rely on the general order update subscription
    // In a more advanced implementation, we could track specific orders
    console.log(`Tracking order status for order: ${orderId}`);
  }

  /**
   * Update internal state and notify listeners
   */
  private updateState(updates: Partial<OrderState>): void {
    this.state = { ...this.state, ...updates };

    // Notify all listeners
    this.stateChangeListeners.forEach((listener) => {
      try {
        listener(this.getState());
      } catch (error) {
        console.error("Error in order state listener:", error);
      }
    });
  }

  /**
   * Handle notification from error handler
   */
  private handleNotification(notification: OrderNotification): void {
    // This method can be extended to handle notifications in the UI
    // For now, we just log them
    console.log(
      `Order notification: ${notification.title} - ${notification.message}`,
    );
  }

  /**
   * Notify validation errors
   */
  private notifyValidationErrors(errors: OrderValidation["errors"]): void {
    Object.entries(errors).forEach(([field, message]) => {
      if (message) {
        const notification = orderErrorHandler.createErrorNotification({
          type: OrderErrorType.INVALID_PARAMETERS,
          message,
          recoverable: true,
          retryable: false,
          field,
        });
        orderErrorHandler.notify(notification);
      }
    });
  }

  /**
   * Handle parameter adjustment recovery action
   */
  private async handleParameterAdjustment(error: OrderError): Promise<void> {
    console.log("Parameter adjustment needed:", error.field, error.message);
    // This would typically trigger UI to highlight the problematic field
    // For now, we just log the action
  }

  /**
   * Handle reconnection recovery action
   */
  private async handleReconnection(): Promise<void> {
    try {
      console.log("Attempting to reconnect to trading server...");

      // Disconnect and reconnect
      deriveAPI.disconnect();
      await deriveAPI.waitForConnection(
        ORDER_CONFIG.TIMEOUTS.WEBSOCKET_CONNECTION_TIMEOUT,
      );

      console.log("Reconnection successful");

      const notification = orderErrorHandler.createSuccessNotification(
        "reconnection",
        { message: "Successfully reconnected to trading server" },
      );
      orderErrorHandler.notify(notification);
    } catch (error) {
      console.error("Reconnection failed:", error);

      const notification = orderErrorHandler.createErrorNotification({
        type: OrderErrorType.NETWORK_ERROR,
        message: "Failed to reconnect to trading server",
        recoverable: true,
        retryable: true,
      });
      orderErrorHandler.notify(notification);
    }
  }

  /**
   * Handle reauthentication recovery action
   */
  private async handleReauthentication(
    walletProvider: WalletProvider,
  ): Promise<void> {
    try {
      console.log("Attempting to reauthenticate...");

      // Clear current session and reauthenticate
      await authenticationService.logout();
      await authenticationService.authenticate(walletProvider);

      console.log("Reauthentication successful");

      const notification = orderErrorHandler.createSuccessNotification(
        "reauthentication",
        { message: "Successfully reauthenticated" },
      );
      orderErrorHandler.notify(notification);
    } catch (error) {
      console.error("Reauthentication failed:", error);

      const notification = orderErrorHandler.createErrorNotification({
        type: OrderErrorType.NOT_AUTHENTICATED,
        message: "Failed to reauthenticate. Please try signing in manually.",
        recoverable: true,
        retryable: true,
      });
      orderErrorHandler.notify(notification);
    }
  }

  /**
   * Handle balance check recovery action
   */
  private async handleBalanceCheck(subaccountId: number): Promise<void> {
    try {
      console.log("Checking account balance...");

      const balance = await deriveAPI.getAvailableBalance(subaccountId);

      const notification = orderErrorHandler.createWarningNotification(
        `Available balance: ${balance}`,
        "Account Balance",
      );
      orderErrorHandler.notify(notification);
    } catch (error) {
      console.error("Balance check failed:", error);

      const notification = orderErrorHandler.createErrorNotification({
        type: OrderErrorType.NETWORK_ERROR,
        message: "Failed to check account balance",
        recoverable: true,
        retryable: true,
      });
      orderErrorHandler.notify(notification);
    }
  }

  /**
   * Retry order submission with exponential backoff
   */
  async retryOrderSubmission(
    orderFormData: OrderFormData,
    walletProvider: WalletProvider,
    subaccountId: number = 0,
    maxRetries: number = ORDER_CONFIG.TIMEOUTS.MAX_RETRY_ATTEMPTS,
  ): Promise<OrderResult> {
    const contextKey = `retry_order_${Date.now()}`;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Order submission attempt ${attempt}/${maxRetries}`);

        const result = await this.submitOrder(
          orderFormData,
          walletProvider,
          subaccountId,
        );

        if (result.success) {
          orderErrorHandler.resetRetryAttempts(contextKey);
          return result;
        }

        // If not successful and not the last attempt, wait before retrying
        if (attempt < maxRetries) {
          const delay = orderErrorHandler.getRetryDelay(contextKey);
          console.log(`Waiting ${delay}ms before retry...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }

        return result;
      } catch (error) {
        console.error(`Order submission attempt ${attempt} failed:`, error);

        if (attempt === maxRetries) {
          // Last attempt failed, return error result
          const orderError = orderErrorHandler.parseError(error, contextKey);
          return {
            success: false,
            error: orderError.message,
            details: orderError,
            timestamp: Date.now(),
          };
        }

        // Wait before next attempt
        const delay = orderErrorHandler.getRetryDelay(contextKey);
        console.log(`Waiting ${delay}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    // This should never be reached, but just in case
    return {
      success: false,
      error: "Maximum retry attempts exceeded",
      timestamp: Date.now(),
    };
  }

  /**
   * Validate order with detailed feedback
   */
  async validateOrderDetailed(
    orderFormData: OrderFormData,
    walletProvider: WalletProvider,
    subaccountId: number = 0,
  ): Promise<{
    validation: OrderValidation;
    suggestions: string[];
    canProceed: boolean;
  }> {
    const validation = await this.validateOrder(
      orderFormData,
      walletProvider,
      subaccountId,
    );
    const suggestions: string[] = [];

    // Generate helpful suggestions based on validation errors
    if (validation.errors.size) {
      suggestions.push(
        `Adjust order size to be between ${ORDER_CONFIG.LIMITS.MIN_ORDER_SIZE} and ${ORDER_CONFIG.LIMITS.MAX_ORDER_SIZE}`,
      );
    }

    if (validation.errors.limitPrice) {
      suggestions.push(
        `Set limit price between ${ORDER_CONFIG.LIMITS.MIN_PRICE} and ${ORDER_CONFIG.LIMITS.MAX_PRICE}`,
      );
    }

    if (validation.errors.balance) {
      suggestions.push("Check your account balance or reduce the order size");
    }

    if (validation.errors.authentication) {
      suggestions.push("Connect your wallet to continue");
    }

    if (validation.errors.network) {
      suggestions.push("Check your internet connection");
    }

    if (validation.errors.limits) {
      suggestions.push("Select an option to trade");
    }

    // Add general suggestions
    if (validation.isValid) {
      suggestions.push("Order parameters look good - ready to submit");
    } else {
      suggestions.push("Please fix the validation errors before submitting");
    }

    return {
      validation,
      suggestions,
      canProceed: validation.isValid,
    };
  }

  /**
   * Get order submission statistics
   */
  getOrderStatistics(): {
    totalOrders: number;
    successfulOrders: number;
    failedOrders: number;
    successRate: number;
    lastOrderTime?: number;
  } {
    // This would typically be tracked over time
    // For now, return basic stats based on current state
    const hasLastOrder = !!this.state.lastOrder;
    const lastOrderSuccess = this.state.lastOrder?.success ?? false;

    return {
      totalOrders: hasLastOrder ? 1 : 0,
      successfulOrders: lastOrderSuccess ? 1 : 0,
      failedOrders: hasLastOrder && !lastOrderSuccess ? 1 : 0,
      successRate: hasLastOrder ? (lastOrderSuccess ? 100 : 0) : 0,
      lastOrderTime: this.state.lastOrder?.timestamp,
    };
  }

  /**
   * Add order to history when submitted
   */
  private addToOrderHistory(
    orderFormData: OrderFormData,
    orderResult: OrderResult,
    subaccountId: number,
  ): void {
    if (!orderResult.orderId) return;

    const historyItem: OrderHistoryItem = {
      orderId: orderResult.orderId,
      instrumentName: orderFormData.selectedOption.instrument.instrument_name,
      direction: orderFormData.direction,
      amount: parseFloat(orderFormData.size),
      price: parseFloat(orderFormData.limitPrice || "0"),
      orderType: orderFormData.orderType,
      status: "pending",
      createdAt: orderResult.timestamp,
      updatedAt: orderResult.timestamp,
      filledAmount: 0,
      averagePrice: undefined,
      fee: 0,
      subaccountId,
    };

    this.orderHistory.set(orderResult.orderId, historyItem);
    this.notifyOrderHistoryListeners();
  }

  /**
   * Update order in history from status update
   */
  private updateOrderInHistory(update: OrderStatusUpdate): void {
    const existingOrder = this.orderHistory.get(update.orderId);

    if (existingOrder) {
      // Update existing order
      const updatedOrder: OrderHistoryItem = {
        ...existingOrder,
        status: update.status,
        updatedAt: update.timestamp,
      };

      // Update additional fields from details if available
      if (update.details && typeof update.details === "object") {
        const details = update.details as Record<string, unknown>;

        if (details.filledAmount && typeof details.filledAmount === "number") {
          updatedOrder.filledAmount = details.filledAmount;
        }

        if (details.averagePrice && typeof details.averagePrice === "number") {
          updatedOrder.averagePrice = details.averagePrice;
        }

        if (details.fee && typeof details.fee === "number") {
          updatedOrder.fee = details.fee;
        }
      }

      this.orderHistory.set(update.orderId, updatedOrder);
      this.notifyOrderHistoryListeners();
    } else {
      // Create new order entry from update (in case we missed the initial submission)
      if (update.details && typeof update.details === "object") {
        const details = update.details as Record<string, unknown>;

        const historyItem: OrderHistoryItem = {
          orderId: update.orderId,
          instrumentName: String(details.instrumentName || ""),
          direction: String(details.direction || "buy") as "buy" | "sell",
          amount: typeof details.amount === "number" ? details.amount : 0,
          price: typeof details.price === "number" ? details.price : 0,
          orderType: "limit", // Default assumption
          status: update.status,
          createdAt: update.timestamp,
          updatedAt: update.timestamp,
          filledAmount:
            typeof details.filledAmount === "number" ? details.filledAmount : 0,
          averagePrice:
            typeof details.averagePrice === "number"
              ? details.averagePrice
              : undefined,
          fee: typeof details.fee === "number" ? details.fee : 0,
          subaccountId: 0, // Default assumption
        };

        this.orderHistory.set(update.orderId, historyItem);
        this.notifyOrderHistoryListeners();
      }
    }
  }

  /**
   * Notify order history listeners
   */
  private notifyOrderHistoryListeners(): void {
    const history = this.getOrderHistory();
    this.orderHistoryListeners.forEach((listener) => {
      try {
        listener(history);
      } catch (error) {
        console.error("Error in order history listener:", error);
      }
    });
  }

  /**
   * Load order history from API
   */
  async loadOrderHistory(
    subaccountId?: number,
    instrumentName?: string,
    limit: number = 50,
  ): Promise<void> {
    try {
      const history = await this.getOrderHistoryFromAPI(
        subaccountId,
        instrumentName,
        limit,
      );

      // Convert API response to OrderHistoryItem format
      if (Array.isArray(history)) {
        history.forEach((order: any) => {
          const historyItem: OrderHistoryItem = {
            orderId: order.order_id || order.id,
            instrumentName: order.instrument_name || "",
            direction: order.direction || "buy",
            amount: parseFloat(order.amount || "0"),
            price: parseFloat(order.price || "0"),
            orderType: order.order_type || "limit",
            status: order.order_state || order.status || "unknown",
            createdAt: order.creation_timestamp || Date.now(),
            updatedAt:
              order.last_update_timestamp ||
              order.creation_timestamp ||
              Date.now(),
            filledAmount: parseFloat(order.filled_amount || "0"),
            averagePrice: order.average_price
              ? parseFloat(order.average_price)
              : undefined,
            fee: parseFloat(order.fee || "0"),
            subaccountId: order.subaccount_id || 0,
          };

          this.orderHistory.set(historyItem.orderId, historyItem);
        });

        this.notifyOrderHistoryListeners();
      }
    } catch (error) {
      console.error("Failed to load order history:", error);
    }
  }

  /**
   * Clear order history
   */
  clearOrderHistory(): void {
    this.orderHistory.clear();
    this.notifyOrderHistoryListeners();
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    // Unsubscribe from order updates
    if (this.orderStatusSubscription) {
      this.orderStatusSubscription();
      this.orderStatusSubscription = null;
    }

    // Unsubscribe from notifications
    if (this.notificationUnsubscribe) {
      this.notificationUnsubscribe();
      this.notificationUnsubscribe = null;
    }

    // Clear listeners
    this.stateChangeListeners = [];
    this.orderUpdateListeners = [];
    this.orderHistoryListeners = [];

    // Clear order history
    this.orderHistory.clear();
  }
}

// Export singleton instance
export const orderService = new OrderService();
