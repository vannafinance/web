/**
 * Authentication Error Handler for Derive Protocol
 */

export interface AuthError {
  type: string;
  message: string;
  recoverable: boolean;
  retryable: boolean;
  field?: string;
}

export interface RecoveryAction {
  type: string;
  label: string;
  action: () => Promise<void>;
}

export class AuthErrorHandler {
  private retryAttempts: Map<string, number> = new Map();

  parseError(error: unknown, contextKey: string): AuthError {
    if (error instanceof Error) {
      return {
        type: "AUTHENTICATION_ERROR",
        message: error.message,
        recoverable: true,
        retryable: true,
      };
    }

    return {
      type: "UNKNOWN_ERROR",
      message: "Unknown authentication error",
      recoverable: true,
      retryable: true,
    };
  }

  getRecoveryActions(
    error: AuthError,
    actions: {
      onRetry: () => Promise<void>;
      onReconnectWallet: () => Promise<void>;
      onManualRefresh: () => Promise<void>;
    },
  ): RecoveryAction[] {
    return [
      {
        type: "retry",
        label: "Retry Authentication",
        action: actions.onRetry,
      },
      {
        type: "reconnect",
        label: "Reconnect Wallet",
        action: actions.onReconnectWallet,
      },
    ];
  }

  shouldAutoRetry(error: AuthError, contextKey: string): boolean {
    const attempts = this.retryAttempts.get(contextKey) || 0;
    return error.retryable && attempts < 3;
  }

  getRetryDelay(contextKey: string): number {
    const attempts = this.retryAttempts.get(contextKey) || 0;
    return Math.min(1000 * Math.pow(2, attempts), 10000);
  }

  resetRetryAttempts(contextKey: string): void {
    this.retryAttempts.delete(contextKey);
  }

  getUserFriendlyMessage(error: AuthError): string {
    return error.message;
  }
}

export const authErrorHandler = new AuthErrorHandler();
