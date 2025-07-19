/**
 * Authentication Error Handler
 *
 * Provides comprehensive error handling, recovery mechanisms, and user-friendly
 * error messages for authentication failures in the Derive protocol integration.
 */

import { ORDER_CONFIG } from "./order-config";

export enum AuthErrorType {
  WALLET_NOT_CONNECTED = "WALLET_NOT_CONNECTED",
  WALLET_CONNECTION_FAILED = "WALLET_CONNECTION_FAILED",
  SIGNATURE_REJECTED = "SIGNATURE_REJECTED",
  SIGNATURE_FAILED = "SIGNATURE_FAILED",
  NETWORK_ERROR = "NETWORK_ERROR",
  SESSION_EXPIRED = "SESSION_EXPIRED",
  INVALID_SIGNATURE = "INVALID_SIGNATURE",
  RATE_LIMITED = "RATE_LIMITED",
  SERVER_ERROR = "SERVER_ERROR",
  TIMEOUT = "TIMEOUT",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

export interface AuthError {
  type: AuthErrorType;
  message: string;
  originalError?: Error;
  recoverable: boolean;
  retryable: boolean;
  userAction?: string;
  technicalDetails?: string;
}

export interface RecoveryAction {
  type:
    | "retry"
    | "reconnect_wallet"
    | "switch_network"
    | "manual_refresh"
    | "contact_support";
  label: string;
  description: string;
  action: () => Promise<void> | void;
}

export class AuthErrorHandler {
  private retryAttempts: Map<string, number> = new Map();
  private lastErrors: Map<string, AuthError> = new Map();

  /**
   * Parse and classify an authentication error
   */
  parseError(error: any, context?: string): AuthError {
    const contextKey = context || "default";

    // Increment retry attempts for this context
    const currentAttempts = this.retryAttempts.get(contextKey) || 0;
    this.retryAttempts.set(contextKey, currentAttempts + 1);

    let authError: AuthError;

    if (error instanceof Error) {
      authError = this.classifyError(error);
    } else if (typeof error === "string") {
      authError = this.classifyStringError(error);
    } else if (error && typeof error === "object") {
      authError = this.classifyObjectError(error);
    } else {
      authError = {
        type: AuthErrorType.UNKNOWN_ERROR,
        message: ORDER_CONFIG.ERRORS.UNKNOWN_ERROR,
        recoverable: false,
        retryable: false,
        userAction:
          "Please try again or contact support if the problem persists.",
      };
    }

    // Store the error for reference
    this.lastErrors.set(contextKey, authError);

    return authError;
  }

  /**
   * Get user-friendly error message with recovery suggestions
   */
  getUserFriendlyMessage(error: AuthError): string {
    const baseMessage = error.message;
    const actionMessage = error.userAction ? ` ${error.userAction}` : "";

    return `${baseMessage}${actionMessage}`;
  }

  /**
   * Get recovery actions for an error
   */
  getRecoveryActions(
    error: AuthError,
    callbacks: {
      onRetry?: () => Promise<void>;
      onReconnectWallet?: () => Promise<void>;
      onSwitchNetwork?: () => Promise<void>;
      onManualRefresh?: () => Promise<void>;
    },
  ): RecoveryAction[] {
    const actions: RecoveryAction[] = [];

    switch (error.type) {
      case AuthErrorType.WALLET_NOT_CONNECTED:
        if (callbacks.onReconnectWallet) {
          actions.push({
            type: "reconnect_wallet",
            label: "Connect Wallet",
            description: "Connect your wallet to continue",
            action: callbacks.onReconnectWallet,
          });
        }
        break;

      case AuthErrorType.SIGNATURE_REJECTED:
        if (callbacks.onRetry) {
          actions.push({
            type: "retry",
            label: "Try Again",
            description: "Retry the authentication process",
            action: callbacks.onRetry,
          });
        }
        break;

      case AuthErrorType.NETWORK_ERROR:
      case AuthErrorType.TIMEOUT:
        if (callbacks.onRetry) {
          actions.push({
            type: "retry",
            label: "Retry",
            description: "Retry the connection",
            action: callbacks.onRetry,
          });
        }
        break;

      case AuthErrorType.SESSION_EXPIRED:
        if (callbacks.onManualRefresh) {
          actions.push({
            type: "manual_refresh",
            label: "Re-authenticate",
            description: "Sign in again to continue",
            action: callbacks.onManualRefresh,
          });
        }
        break;

      case AuthErrorType.RATE_LIMITED:
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
          // Open support link or show contact information
          console.log("Contact support for error:", error);
        },
      });
    }

    return actions;
  }

  /**
   * Check if an error should trigger automatic retry
   */
  shouldAutoRetry(error: AuthError, context?: string): boolean {
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
  getLastError(context?: string): AuthError | null {
    const contextKey = context || "default";
    return this.lastErrors.get(contextKey) || null;
  }

  /**
   * Classify Error objects
   */
  private classifyError(error: Error): AuthError {
    const message = error.message.toLowerCase();

    // Wallet connection errors
    if (
      message.includes("wallet not connected") ||
      message.includes("no provider")
    ) {
      return {
        type: AuthErrorType.WALLET_NOT_CONNECTED,
        message: ORDER_CONFIG.ERRORS.AUTH_WALLET_NOT_CONNECTED,
        originalError: error,
        recoverable: true,
        retryable: false,
        userAction: "Please connect your wallet and try again.",
      };
    }

    // Signature errors
    if (message.includes("user rejected") || message.includes("user denied")) {
      return {
        type: AuthErrorType.SIGNATURE_REJECTED,
        message:
          "Authentication was cancelled. Please approve the signature to continue.",
        originalError: error,
        recoverable: true,
        retryable: true,
        userAction: 'Click "Try Again" and approve the signature request.',
      };
    }

    if (message.includes("signature") || message.includes("sign")) {
      return {
        type: AuthErrorType.SIGNATURE_FAILED,
        message: ORDER_CONFIG.ERRORS.AUTH_SIGNATURE_FAILED,
        originalError: error,
        recoverable: true,
        retryable: true,
        userAction: "Please check your wallet connection and try again.",
      };
    }

    // Network errors
    if (
      message.includes("network") ||
      message.includes("connection") ||
      message.includes("fetch")
    ) {
      return {
        type: AuthErrorType.NETWORK_ERROR,
        message:
          "Network connection failed. Please check your internet connection.",
        originalError: error,
        recoverable: true,
        retryable: true,
        userAction: "Check your connection and try again.",
        technicalDetails: error.message,
      };
    }

    // Timeout errors
    if (message.includes("timeout") || message.includes("timed out")) {
      return {
        type: AuthErrorType.TIMEOUT,
        message: "Authentication timed out. Please try again.",
        originalError: error,
        recoverable: true,
        retryable: true,
        userAction: "The request took too long. Please try again.",
      };
    }

    // Session errors
    if (
      message.includes("session") ||
      message.includes("expired") ||
      message.includes("unauthorized")
    ) {
      return {
        type: AuthErrorType.SESSION_EXPIRED,
        message: ORDER_CONFIG.ERRORS.AUTH_SESSION_EXPIRED,
        originalError: error,
        recoverable: true,
        retryable: false,
        userAction: "Please sign in again to continue.",
      };
    }

    // Rate limiting
    if (
      message.includes("rate limit") ||
      message.includes("too many requests")
    ) {
      return {
        type: AuthErrorType.RATE_LIMITED,
        message:
          "Too many authentication attempts. Please wait a moment before trying again.",
        originalError: error,
        recoverable: true,
        retryable: false,
        userAction: "Please wait a few minutes before trying again.",
      };
    }

    // Default to unknown error
    return {
      type: AuthErrorType.UNKNOWN_ERROR,
      message: `Authentication failed: ${error.message}`,
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
  private classifyStringError(errorString: string): AuthError {
    const message = errorString.toLowerCase();

    if (message.includes("wallet") && message.includes("not connected")) {
      return {
        type: AuthErrorType.WALLET_NOT_CONNECTED,
        message: ORDER_CONFIG.ERRORS.AUTH_WALLET_NOT_CONNECTED,
        recoverable: true,
        retryable: false,
        userAction: "Please connect your wallet and try again.",
      };
    }

    if (message.includes("signature") && message.includes("failed")) {
      return {
        type: AuthErrorType.SIGNATURE_FAILED,
        message: ORDER_CONFIG.ERRORS.AUTH_SIGNATURE_FAILED,
        recoverable: true,
        retryable: true,
        userAction: "Please check your wallet connection and try again.",
      };
    }

    return {
      type: AuthErrorType.UNKNOWN_ERROR,
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
  private classifyObjectError(errorObj: any): AuthError {
    // Handle WebSocket/API error responses
    if (errorObj.code && errorObj.message) {
      switch (errorObj.code) {
        case 401:
        case "UNAUTHORIZED":
          return {
            type: AuthErrorType.INVALID_SIGNATURE,
            message: ORDER_CONFIG.ERRORS.AUTH_INVALID_SIGNATURE,
            recoverable: true,
            retryable: true,
            userAction: "Please try signing in again.",
            technicalDetails: errorObj.message,
          };

        case 429:
        case "RATE_LIMITED":
          return {
            type: AuthErrorType.RATE_LIMITED,
            message:
              "Too many authentication attempts. Please wait before trying again.",
            recoverable: true,
            retryable: false,
            userAction: "Please wait a few minutes before trying again.",
            technicalDetails: errorObj.message,
          };

        case 500:
        case "INTERNAL_ERROR":
          return {
            type: AuthErrorType.SERVER_ERROR,
            message: "Server error occurred. Please try again later.",
            recoverable: true,
            retryable: true,
            userAction:
              "The server is experiencing issues. Please try again in a few minutes.",
            technicalDetails: errorObj.message,
          };

        default:
          return {
            type: AuthErrorType.UNKNOWN_ERROR,
            message: errorObj.message || "An unknown error occurred",
            recoverable: false,
            retryable: false,
            userAction:
              "Please try again or contact support if the problem persists.",
            technicalDetails: JSON.stringify(errorObj),
          };
      }
    }

    // Handle generic object errors
    const message =
      errorObj.message || errorObj.error || JSON.stringify(errorObj);
    return {
      type: AuthErrorType.UNKNOWN_ERROR,
      message: `Authentication failed: ${message}`,
      recoverable: false,
      retryable: false,
      userAction:
        "Please try again or contact support if the problem persists.",
      technicalDetails: JSON.stringify(errorObj),
    };
  }
}

// Export singleton instance
export const authErrorHandler = new AuthErrorHandler();
