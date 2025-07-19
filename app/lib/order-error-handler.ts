/**
 * Order Error Handler
 *
 * Provides comprehensive error handling, recovery mechanisms, and user-friendly
 * error messages for order submission failures in the Derive protocol integration.
 */

import { ORDER_CONFIG } from "./order-config";

export enum OrderErrorType {
  // Validation errors
  INVALID_PARAMETERS = "INVALID_PARAMETERS",
  INVALID_INSTRUMENT = "INVALID_INSTRUMENT",
  INVALID_SIZE = "INVALID_SIZE",
  INVALID_PRICE = "INVALID_PRICE",
  INSUFFICIENT_BALANCE = "INSUFFICIENT_BALANCE",

  // Authentication errors
  NOT_AUTHENTICATED = "NOT_AUTHENTICATED",
  SESSION_EXPIRED = "SESSION_EXPIRED",

  // Network errors
  NETWORK_ERROR = "NETWORK_ERROR",
  WEBSOCKET_DISCONNECTED = "WEBSOCKET_DISCONNECTED",
  TIMEOUT = "TIMEOUT",

  // Exchange errors
  ORDER_REJECTED = "ORDER_REJECTED",
  MARKET_CLOSED = "MARKET_CLOSED",
  INSTRUMENT_SUSPENDED = "INSTRUMENT_SUSPENDED",
  RATE_LIMITED = "RATE_LIMITED",

  // Signing errors
  SIGNATURE_FAILED = "SIGNATURE_FAILED",
  WALLET_ERROR = "WALLET_ERROR",

  // System errors
  SERVER_ERROR = "SERVER_ERROR",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

export interface OrderError {
  type: OrderErrorType;
  message: string;
  originalError?: Error;
  recoverable: boolean;
  retryable: boolean;
  userAction?: string;
  technicalDetails?: string;
  field?: string; // For validation errors
}

export interface OrderRecoveryAction {
  type:
    | "retry"
    | "adjust_parameters"
    | "reconnect"
    | "reauthenticate"
    | "check_balance"
    | "contact_support";
  label: string;
  description: string;
  action: () => Promise<void> | void;
}

export interface OrderNotification {
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
  duration?: number; // in milliseconds
  actions?: OrderRecoveryAction[];
}

export class OrderErrorHandler {
  private retryAttempts: Map<string, number> = new Map();
  private lastErrors: Map<string, OrderError> = new Map();
  private notificationListeners: Array<
    (notification: OrderNotification) => void
  > = [];

  /**
   * Parse and classify an order error
   */
  parseError(error: unknown, context?: string): OrderError {
    const contextKey = context || "default";

    // Increment retry attempts for this context
    const currentAttempts = this.retryAttempts.get(contextKey) || 0;
    this.retryAttempts.set(contextKey, currentAttempts + 1);

    let orderError: OrderError;

    if (error instanceof Error) {
      orderError = this.classifyError(error);
    } else if (typeof error === "string") {
      orderError = this.classifyStringError(error);
    } else if (error && typeof error === "object") {
      orderError = this.classifyObjectError(error);
    } else {
      orderError = {
        type: OrderErrorType.UNKNOWN_ERROR,
        message: ORDER_CONFIG.ERRORS.UNKNOWN_ERROR,
        recoverable: false,
        retryable: false,
        userAction:
          "Please try again or contact support if the problem persists.",
      };
    }

    // Store the error for reference
    this.lastErrors.set(contextKey, orderError);

    return orderError;
  }

  /**
   * Get user-friendly error message with recovery suggestions
   */
  getUserFriendlyMessage(error: OrderError): string {
    const baseMessage = error.message;
    const actionMessage = error.userAction ? ` ${error.userAction}` : "";

    return `${baseMessage}${actionMessage}`;
  }

  /**
   * Get recovery actions for an error
   */
  getRecoveryActions(
    error: OrderError,
    callbacks: {
      onRetry?: () => Promise<void>;
      onAdjustParameters?: () => Promise<void>;
      onReconnect?: () => Promise<void>;
      onReauthenticate?: () => Promise<void>;
      onCheckBalance?: () => Promise<void>;
    },
  ): OrderRecoveryAction[] {
    const actions: OrderRecoveryAction[] = [];

    switch (error.type) {
      case OrderErrorType.INVALID_SIZE:
      case OrderErrorType.INVALID_PRICE:
      case OrderErrorType.INVALID_PARAMETERS:
        if (callbacks.onAdjustParameters) {
          actions.push({
            type: "adjust_parameters",
            label: "Adjust Order",
            description: "Modify order parameters and try again",
            action: callbacks.onAdjustParameters,
          });
        }
        break;

      case OrderErrorType.INSUFFICIENT_BALANCE:
        if (callbacks.onCheckBalance) {
          actions.push({
            type: "check_balance",
            label: "Check Balance",
            description: "Review your account balance",
            action: callbacks.onCheckBalance,
          });
        }
        break;

      case OrderErrorType.NOT_AUTHENTICATED:
      case OrderErrorType.SESSION_EXPIRED:
        if (callbacks.onReauthenticate) {
          actions.push({
            type: "reauthenticate",
            label: "Sign In",
            description: "Authenticate to continue trading",
            action: callbacks.onReauthenticate,
          });
        }
        break;

      case OrderErrorType.NETWORK_ERROR:
      case OrderErrorType.WEBSOCKET_DISCONNECTED:
        if (callbacks.onReconnect) {
          actions.push({
            type: "reconnect",
            label: "Reconnect",
            description: "Reconnect to trading server",
            action: callbacks.onReconnect,
          });
        }
        break;

      case OrderErrorType.TIMEOUT:
      case OrderErrorType.SERVER_ERROR:
        if (callbacks.onRetry) {
          actions.push({
            type: "retry",
            label: "Try Again",
            description: "Retry the order submission",
            action: callbacks.onRetry,
          });
        }
        break;

      case OrderErrorType.RATE_LIMITED:
        // No immediate action for rate limiting - user needs to wait
        break;

      default:
        if (error.retryable && callbacks.onRetry) {
          actions.push({
            type: "retry",
            label: "Try Again",
            description: "Retry the operation",
            action: callbacks.onRetry,
          });
        }
        break;
    }

    // Always add contact support option for non-recoverable errors
    if (!error.recoverable) {
      actions.push({
        type: "contact_support",
        label: "Contact Support",
        description: "Get help with this issue",
        action: () => {
          console.log("Contact support for error:", error);
        },
      });
    }

    return actions;
  }

  /**
   * Create user notification from error
   */
  createErrorNotification(
    error: OrderError,
    recoveryActions?: OrderRecoveryAction[],
  ): OrderNotification {
    return {
      type: "error",
      title: this.getErrorTitle(error.type),
      message: this.getUserFriendlyMessage(error),
      duration: error.recoverable ? 8000 : 12000, // Longer duration for non-recoverable errors
      actions: recoveryActions,
    };
  }

  /**
   * Create success notification
   */
  createSuccessNotification(
    orderId: string,
    orderDetails?: unknown,
  ): OrderNotification {
    return {
      type: "success",
      title: "Order Submitted",
      message: `Order ${orderId} has been successfully submitted.`,
      duration: 5000,
    };
  }

  /**
   * Create warning notification
   */
  createWarningNotification(
    message: string,
    title: string = "Warning",
  ): OrderNotification {
    return {
      type: "warning",
      title,
      message,
      duration: 6000,
    };
  }

  /**
   * Subscribe to notifications
   */
  onNotification(
    listener: (notification: OrderNotification) => void,
  ): () => void {
    this.notificationListeners.push(listener);
    return () => {
      const index = this.notificationListeners.indexOf(listener);
      if (index > -1) {
        this.notificationListeners.splice(index, 1);
      }
    };
  }

  /**
   * Send notification to all listeners
   */
  notify(notification: OrderNotification): void {
    this.notificationListeners.forEach((listener) => {
      try {
        listener(notification);
      } catch (error) {
        console.error("Error in notification listener:", error);
      }
    });
  }

  /**
   * Check if an error should trigger automatic retry
   */
  shouldAutoRetry(error: OrderError, context?: string): boolean {
    const contextKey = context || "default";
    const attempts = this.retryAttempts.get(contextKey) || 0;
    const maxAttempts = ORDER_CONFIG.TIMEOUTS.MAX_RETRY_ATTEMPTS;

    return error.retryable && attempts < maxAttempts;
  }

  /**
   * Get retry delay with exponential backoff
   */
  getRetryDelay(context?: string): number {
    const contextKey = context || "default";
    const attempts = this.retryAttempts.get(contextKey) || 0;

    return Math.min(
      ORDER_CONFIG.TIMEOUTS.RETRY_DELAY_BASE * Math.pow(2, attempts),
      ORDER_CONFIG.TIMEOUTS.RETRY_DELAY_MAX,
    );
  }

  /**
   * Reset retry attempts for a context
   */
  resetRetryAttempts(context?: string): void {
    const contextKey = context || "default";
    this.retryAttempts.delete(contextKey);
    this.lastErrors.delete(contextKey);
  }

  /**
   * Get the last error for a context
   */
  getLastError(context?: string): OrderError | null {
    const contextKey = context || "default";
    return this.lastErrors.get(contextKey) || null;
  }

  /**
   * Classify Error objects
   */
  private classifyError(error: Error): OrderError {
    const message = error.message.toLowerCase();

    // Validation errors
    if (message.includes("invalid") && message.includes("size")) {
      return {
        type: OrderErrorType.INVALID_SIZE,
        message: ORDER_CONFIG.ERRORS.ORDER_INVALID_SIZE.replace(
          "{min}",
          String(ORDER_CONFIG.LIMITS.MIN_ORDER_SIZE),
        ).replace("{max}", String(ORDER_CONFIG.LIMITS.MAX_ORDER_SIZE)),
        originalError: error,
        recoverable: true,
        retryable: false,
        field: "size",
        userAction: "Please adjust the order size and try again.",
      };
    }

    if (message.includes("invalid") && message.includes("price")) {
      return {
        type: OrderErrorType.INVALID_PRICE,
        message: ORDER_CONFIG.ERRORS.ORDER_INVALID_PRICE.replace(
          "{min}",
          String(ORDER_CONFIG.LIMITS.MIN_PRICE),
        ).replace("{max}", String(ORDER_CONFIG.LIMITS.MAX_PRICE)),
        originalError: error,
        recoverable: true,
        retryable: false,
        field: "limitPrice",
        userAction: "Please adjust the order price and try again.",
      };
    }

    if (message.includes("insufficient") && message.includes("balance")) {
      return {
        type: OrderErrorType.INSUFFICIENT_BALANCE,
        message: ORDER_CONFIG.ERRORS.ORDER_INSUFFICIENT_BALANCE,
        originalError: error,
        recoverable: true,
        retryable: false,
        field: "balance",
        userAction:
          "Please check your account balance or reduce the order size.",
      };
    }

    // Authentication errors
    if (
      message.includes("not authenticated") ||
      message.includes("unauthorized")
    ) {
      return {
        type: OrderErrorType.NOT_AUTHENTICATED,
        message: "You must be signed in to place orders.",
        originalError: error,
        recoverable: true,
        retryable: false,
        userAction: "Please sign in and try again.",
      };
    }

    if (message.includes("session") && message.includes("expired")) {
      return {
        type: OrderErrorType.SESSION_EXPIRED,
        message: "Your session has expired. Please sign in again.",
        originalError: error,
        recoverable: true,
        retryable: false,
        userAction: "Please sign in again to continue trading.",
      };
    }

    // Network errors
    if (message.includes("network") || message.includes("connection")) {
      return {
        type: OrderErrorType.NETWORK_ERROR,
        message: ORDER_CONFIG.ERRORS.ORDER_NETWORK_ERROR,
        originalError: error,
        recoverable: true,
        retryable: true,
        userAction: "Please check your connection and try again.",
      };
    }

    if (message.includes("websocket") || message.includes("disconnected")) {
      return {
        type: OrderErrorType.WEBSOCKET_DISCONNECTED,
        message: ORDER_CONFIG.ERRORS.WEBSOCKET_DISCONNECTED,
        originalError: error,
        recoverable: true,
        retryable: true,
        userAction: "Reconnecting to trading server...",
      };
    }

    // Timeout errors
    if (message.includes("timeout") || message.includes("timed out")) {
      return {
        type: OrderErrorType.TIMEOUT,
        message: ORDER_CONFIG.ERRORS.ORDER_TIMEOUT,
        originalError: error,
        recoverable: true,
        retryable: true,
        userAction: "The request took too long. Please try again.",
      };
    }

    // Signature errors
    if (message.includes("signature") || message.includes("sign")) {
      return {
        type: OrderErrorType.SIGNATURE_FAILED,
        message: ORDER_CONFIG.ERRORS.ORDER_SIGNATURE_FAILED,
        originalError: error,
        recoverable: true,
        retryable: true,
        userAction: "Please check your wallet connection and try again.",
      };
    }

    // Exchange errors
    if (message.includes("rejected") || message.includes("order rejected")) {
      return {
        type: OrderErrorType.ORDER_REJECTED,
        message: ORDER_CONFIG.ERRORS.ORDER_REJECTED,
        originalError: error,
        recoverable: false,
        retryable: false,
        userAction: "Please check your order parameters and try again.",
        technicalDetails: error.message,
      };
    }

    // Rate limiting
    if (message.includes("rate limit") || message.includes("too many")) {
      return {
        type: OrderErrorType.RATE_LIMITED,
        message: "Too many order attempts. Please wait before trying again.",
        originalError: error,
        recoverable: true,
        retryable: false,
        userAction: "Please wait a moment before placing another order.",
      };
    }

    // Default to unknown error
    return {
      type: OrderErrorType.UNKNOWN_ERROR,
      message: `Order failed: ${error.message}`,
      originalError: error,
      recoverable: false,
      retryable: false,
      userAction:
        "Please try again or contact support if the problem persists.",
      technicalDetails: error.message,
    };
  }

  /**
   * Classify string errors
   */
  private classifyStringError(errorString: string): OrderError {
    const message = errorString.toLowerCase();

    if (message.includes("validation") && message.includes("failed")) {
      return {
        type: OrderErrorType.INVALID_PARAMETERS,
        message: "Order parameters are invalid.",
        recoverable: true,
        retryable: false,
        userAction: "Please check your order details and try again.",
      };
    }

    if (message.includes("insufficient") && message.includes("balance")) {
      return {
        type: OrderErrorType.INSUFFICIENT_BALANCE,
        message: ORDER_CONFIG.ERRORS.ORDER_INSUFFICIENT_BALANCE,
        recoverable: true,
        retryable: false,
        field: "balance",
        userAction: "Please check your account balance.",
      };
    }

    return {
      type: OrderErrorType.UNKNOWN_ERROR,
      message: errorString,
      recoverable: false,
      retryable: false,
      userAction:
        "Please try again or contact support if the problem persists.",
    };
  }

  /**
   * Classify object errors (e.g., from API responses)
   */
  private classifyObjectError(errorObj: unknown): OrderError {
    if (typeof errorObj !== "object" || errorObj === null) {
      return {
        type: OrderErrorType.UNKNOWN_ERROR,
        message: "An unknown error occurred",
        recoverable: false,
        retryable: false,
      };
    }

    const error = errorObj as Record<string, unknown>;

    // Handle WebSocket/API error responses
    if (error.code && error.message) {
      switch (error.code) {
        case 400:
        case "INVALID_PARAMETERS":
          return {
            type: OrderErrorType.INVALID_PARAMETERS,
            message: String(error.message) || "Invalid order parameters",
            recoverable: true,
            retryable: false,
            userAction: "Please check your order details and try again.",
            technicalDetails: String(error.message),
          };

        case 401:
        case "UNAUTHORIZED":
          return {
            type: OrderErrorType.NOT_AUTHENTICATED,
            message: "Authentication required to place orders",
            recoverable: true,
            retryable: false,
            userAction: "Please sign in and try again.",
            technicalDetails: String(error.message),
          };

        case 403:
        case "INSUFFICIENT_BALANCE":
          return {
            type: OrderErrorType.INSUFFICIENT_BALANCE,
            message: ORDER_CONFIG.ERRORS.ORDER_INSUFFICIENT_BALANCE,
            recoverable: true,
            retryable: false,
            field: "balance",
            userAction: "Please check your account balance.",
            technicalDetails: String(error.message),
          };

        case 429:
        case "RATE_LIMITED":
          return {
            type: OrderErrorType.RATE_LIMITED,
            message:
              "Too many order attempts. Please wait before trying again.",
            recoverable: true,
            retryable: false,
            userAction: "Please wait a moment before placing another order.",
            technicalDetails: String(error.message),
          };

        case 500:
        case "INTERNAL_ERROR":
          return {
            type: OrderErrorType.SERVER_ERROR,
            message: "Server error occurred. Please try again later.",
            recoverable: true,
            retryable: true,
            userAction:
              "The server is experiencing issues. Please try again in a few minutes.",
            technicalDetails: String(error.message),
          };

        default:
          return {
            type: OrderErrorType.UNKNOWN_ERROR,
            message: String(error.message) || "An unknown error occurred",
            recoverable: false,
            retryable: false,
            userAction:
              "Please try again or contact support if the problem persists.",
            technicalDetails: JSON.stringify(error),
          };
      }
    }

    // Handle generic object errors
    const message = String(error.message || error.error || "Unknown error");
    return {
      type: OrderErrorType.UNKNOWN_ERROR,
      message: `Order failed: ${message}`,
      recoverable: false,
      retryable: false,
      userAction:
        "Please try again or contact support if the problem persists.",
      technicalDetails: JSON.stringify(error),
    };
  }

  /**
   * Get error title based on error type
   */
  private getErrorTitle(errorType: OrderErrorType): string {
    switch (errorType) {
      case OrderErrorType.INVALID_PARAMETERS:
      case OrderErrorType.INVALID_SIZE:
      case OrderErrorType.INVALID_PRICE:
        return "Invalid Order";
      case OrderErrorType.INSUFFICIENT_BALANCE:
        return "Insufficient Balance";
      case OrderErrorType.NOT_AUTHENTICATED:
      case OrderErrorType.SESSION_EXPIRED:
        return "Authentication Required";
      case OrderErrorType.NETWORK_ERROR:
      case OrderErrorType.WEBSOCKET_DISCONNECTED:
        return "Connection Error";
      case OrderErrorType.TIMEOUT:
        return "Request Timeout";
      case OrderErrorType.ORDER_REJECTED:
        return "Order Rejected";
      case OrderErrorType.SIGNATURE_FAILED:
        return "Signature Failed";
      case OrderErrorType.RATE_LIMITED:
        return "Rate Limited";
      case OrderErrorType.SERVER_ERROR:
        return "Server Error";
      default:
        return "Order Failed";
    }
  }
}

// Export singleton instance
export const orderErrorHandler = new OrderErrorHandler();
