/**
 * Order Error Handler for Derive Protocol
 */

export enum OrderErrorType {
  INVALID_PARAMETERS = "INVALID_PARAMETERS",
  NOT_AUTHENTICATED = "NOT_AUTHENTICATED",
  NETWORK_ERROR = "NETWORK_ERROR",
  INSUFFICIENT_BALANCE = "INSUFFICIENT_BALANCE",
  ORDER_REJECTED = "ORDER_REJECTED",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

export interface OrderError {
  type: OrderErrorType;
  message: string;
  recoverable: boolean;
  retryable: boolean;
  field?: string;
}

export interface OrderRecoveryAction {
  type: string;
  label: string;
  action: () => Promise<void>;
}

export interface OrderNotification {
  id: string;
  type: "success" | "error" | "warning";
  title: string;
  message: string;
  timestamp: number;
  actions?: OrderRecoveryAction[];
}

export class OrderErrorHandler {
  private retryAttempts: Map<string, number> = new Map();
  private notificationListeners: Array<
    (notification: OrderNotification) => void
  > = [];

  parseError(error: unknown, contextKey: string): OrderError {
    if (error instanceof Error) {
      if (error.message.includes("Authentication")) {
        return {
          type: OrderErrorType.NOT_AUTHENTICATED,
          message: error.message,
          recoverable: true,
          retryable: true,
        };
      }

      if (error.message.includes("balance")) {
        return {
          type: OrderErrorType.INSUFFICIENT_BALANCE,
          message: error.message,
          recoverable: true,
          retryable: false,
        };
      }

      if (
        error.message.includes("network") ||
        error.message.includes("connection")
      ) {
        return {
          type: OrderErrorType.NETWORK_ERROR,
          message: error.message,
          recoverable: true,
          retryable: true,
        };
      }

      return {
        type: OrderErrorType.UNKNOWN_ERROR,
        message: error.message,
        recoverable: true,
        retryable: true,
      };
    }

    return {
      type: OrderErrorType.UNKNOWN_ERROR,
      message: "Unknown order error",
      recoverable: true,
      retryable: true,
    };
  }

  getRecoveryActions(
    error: OrderError,
    actions: {
      onRetry: () => Promise<void>;
      onAdjustParameters: () => Promise<void>;
      onReconnect: () => Promise<void>;
      onReauthenticate: () => Promise<void>;
      onCheckBalance: () => Promise<void>;
    },
  ): OrderRecoveryAction[] {
    const recoveryActions: OrderRecoveryAction[] = [];

    if (error.retryable) {
      recoveryActions.push({
        type: "retry",
        label: "Retry Order",
        action: actions.onRetry,
      });
    }

    if (error.type === OrderErrorType.NOT_AUTHENTICATED) {
      recoveryActions.push({
        type: "reauthenticate",
        label: "Reauthenticate",
        action: actions.onReauthenticate,
      });
    }

    if (error.type === OrderErrorType.NETWORK_ERROR) {
      recoveryActions.push({
        type: "reconnect",
        label: "Reconnect",
        action: actions.onReconnect,
      });
    }

    if (error.type === OrderErrorType.INSUFFICIENT_BALANCE) {
      recoveryActions.push({
        type: "check_balance",
        label: "Check Balance",
        action: actions.onCheckBalance,
      });
    }

    return recoveryActions;
  }

  shouldAutoRetry(error: OrderError, contextKey: string): boolean {
    const attempts = this.retryAttempts.get(contextKey) || 0;
    return error.retryable && attempts < 3;
  }

  getRetryDelay(contextKey: string): number {
    const attempts = this.retryAttempts.get(contextKey) || 0;
    this.retryAttempts.set(contextKey, attempts + 1);
    return Math.min(1000 * Math.pow(2, attempts), 10000);
  }

  resetRetryAttempts(contextKey: string): void {
    this.retryAttempts.delete(contextKey);
  }

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

  notify(notification: OrderNotification): void {
    this.notificationListeners.forEach((listener) => {
      try {
        listener(notification);
      } catch (error) {
        console.error("Error in notification listener:", error);
      }
    });
  }

  createErrorNotification(
    error: OrderError,
    actions?: OrderRecoveryAction[],
  ): OrderNotification {
    return {
      id: `error_${Date.now()}`,
      type: "error",
      title: "Order Failed",
      message: error.message,
      timestamp: Date.now(),
      actions,
    };
  }

  createSuccessNotification(
    orderId: string,
    details?: unknown,
  ): OrderNotification {
    return {
      id: `success_${Date.now()}`,
      type: "success",
      title: "Order Successful",
      message: `Order ${orderId} submitted successfully`,
      timestamp: Date.now(),
    };
  }

  createWarningNotification(
    message: string,
    title?: string,
  ): OrderNotification {
    return {
      id: `warning_${Date.now()}`,
      type: "warning",
      title: title || "Warning",
      message,
      timestamp: Date.now(),
    };
  }
}

export const orderErrorHandler = new OrderErrorHandler();
