/**
 * Account and Position Methods for Derive API
 *
 * Handles account information, balances, positions, and related subscriptions.
 */

import type { WebSocketManager } from "./websocket-manager";
import type { AuthMethods } from "./auth-methods";

export class AccountMethods {
  private wsManager: WebSocketManager;
  private authMethods: AuthMethods;

  constructor(wsManager: WebSocketManager, authMethods: AuthMethods) {
    this.wsManager = wsManager;
    this.authMethods = authMethods;
  }

  /**
   * Get subaccounts for the authenticated user
   */
  async getSubaccounts(): Promise<any> {
    try {
      await this.authMethods.ensureAuthenticated();

      const response = await this.authMethods.sendAuthenticatedRequest(
        "private/get_subaccounts",
        {},
      );

      if (response.error) {
        throw new Error(`Failed to get subaccounts: ${response.error.message}`);
      }

      console.log("✅ Retrieved subaccounts:", response.result);
      return response.result;
    } catch (error) {
      console.error("❌ Failed to get subaccounts:", error);
      throw error;
    }
  }

  /**
   * Get account summary including balances
   */
  async getAccountSummary(subaccountId?: number): Promise<any> {
    try {
      await this.authMethods.ensureAuthenticated();

      const params: any = {};
      if (subaccountId !== undefined) {
        params.subaccount_id = subaccountId;
      }

      const response = await this.authMethods.sendAuthenticatedRequest(
        "private/get_account_summary",
        params,
      );

      if (response.error) {
        throw new Error(
          `Failed to get account summary: ${response.error.message}`,
        );
      }

      console.log("✅ Retrieved account summary:", response.result);
      return response.result;
    } catch (error) {
      console.error("❌ Failed to get account summary:", error);
      throw error;
    }
  }

  /**
   * Get positions for a subaccount
   */
  async getPositions(
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
        "private/get_positions",
        params,
      );

      if (response.error) {
        throw new Error(`Failed to get positions: ${response.error.message}`);
      }

      console.log("✅ Retrieved positions:", response.result);
      return response.result;
    } catch (error) {
      console.error("❌ Failed to get positions:", error);
      throw error;
    }
  }

  /**
   * Get available balance for order validation
   */
  async getAvailableBalance(
    subaccountId?: number,
    currency?: string,
  ): Promise<number> {
    try {
      const accountSummary = await this.getAccountSummary(subaccountId);

      if (!accountSummary || !accountSummary.balances) {
        return 0;
      }

      // Find balance for specified currency (default to USD/USDC)
      const targetCurrency = currency || "USDC";
      const balance = accountSummary.balances.find(
        (b: any) => b.currency === targetCurrency || b.asset === targetCurrency,
      );

      if (!balance) {
        console.warn(`No balance found for currency: ${targetCurrency}`);
        return 0;
      }

      const availableBalance = parseFloat(
        balance.available || balance.free || "0",
      );
      console.log(
        `💰 Available balance for ${targetCurrency}:`,
        availableBalance,
      );

      return availableBalance;
    } catch (error) {
      console.error("❌ Failed to get available balance:", error);
      return 0; // Return 0 if we can't get balance to avoid blocking orders
    }
  }

  /**
   * Get portfolio summary with P&L information
   */
  async getPortfolioSummary(subaccountId?: number): Promise<any> {
    try {
      await this.authMethods.ensureAuthenticated();

      const params: any = {};
      if (subaccountId !== undefined) {
        params.subaccount_id = subaccountId;
      }

      const response = await this.authMethods.sendAuthenticatedRequest(
        "private/get_portfolio_summary",
        params,
      );

      if (response.error) {
        throw new Error(
          `Failed to get portfolio summary: ${response.error.message}`,
        );
      }

      console.log("✅ Retrieved portfolio summary:", response.result);
      return response.result;
    } catch (error) {
      console.error("❌ Failed to get portfolio summary:", error);
      throw error;
    }
  }

  /**
   * Subscribe to position updates
   */
  async subscribeToPositionUpdates(
    callback: (positionUpdate: any) => void,
  ): Promise<void> {
    try {
      await this.authMethods.ensureAuthenticated();
      await this.wsManager.ensureConnection();

      const subscriptionId = "user.positions";

      // Check if subscription already exists
      if (this.wsManager.hasSubscription(subscriptionId)) {
        console.log(
          "Already subscribed to position updates, updating callback",
        );
        const existingSubscription =
          this.wsManager.getSubscription(subscriptionId)!;
        existingSubscription.callback = callback;
        return;
      }

      const subscription = {
        channel: "user.positions",
        callback,
        instrumentName: "positions",
        type: "positions",
      };

      this.wsManager.addSubscription(subscriptionId, subscription);

      // Send subscription request
      await this.authMethods.sendAuthenticatedRequest("private/subscribe", {
        channels: ["user.positions"],
      });

      console.log("✅ Subscribed to position updates");
    } catch (error) {
      console.error("❌ Failed to subscribe to position updates:", error);
      throw error;
    }
  }

  /**
   * Subscribe to balance updates
   */
  async subscribeToBalanceUpdates(
    callback: (balanceUpdate: any) => void,
  ): Promise<void> {
    try {
      await this.authMethods.ensureAuthenticated();
      await this.wsManager.ensureConnection();

      const subscriptionId = "user.balances";

      // Check if subscription already exists
      if (this.wsManager.hasSubscription(subscriptionId)) {
        console.log("Already subscribed to balance updates, updating callback");
        const existingSubscription =
          this.wsManager.getSubscription(subscriptionId)!;
        existingSubscription.callback = callback;
        return;
      }

      const subscription = {
        channel: "user.balances",
        callback,
        instrumentName: "balances",
        type: "balances",
      };

      this.wsManager.addSubscription(subscriptionId, subscription);

      // Send subscription request
      await this.authMethods.sendAuthenticatedRequest("private/subscribe", {
        channels: ["user.balances"],
      });

      console.log("✅ Subscribed to balance updates");
    } catch (error) {
      console.error("❌ Failed to subscribe to balance updates:", error);
      throw error;
    }
  }

  /**
   * Get transaction history for a subaccount
   */
  async getTransactionHistory(
    subaccountId?: number,
    limit?: number,
    offset?: number,
  ): Promise<any> {
    try {
      await this.authMethods.ensureAuthenticated();

      const params: any = {};
      if (subaccountId !== undefined) {
        params.subaccount_id = subaccountId;
      }
      if (limit) {
        params.limit = limit;
      }
      if (offset) {
        params.offset = offset;
      }

      const response = await this.authMethods.sendAuthenticatedRequest(
        "private/get_transaction_history",
        params,
      );

      if (response.error) {
        throw new Error(
          `Failed to get transaction history: ${response.error.message}`,
        );
      }

      return response.result;
    } catch (error) {
      console.error("❌ Failed to get transaction history:", error);
      throw error;
    }
  }

  /**
   * Parse position data for easier consumption
   */
  parsePositionData(positions: any[]): any[] {
    try {
      return positions.map((position) => ({
        instrumentName: position.instrument_name,
        size: parseFloat(position.size || "0"),
        averagePrice: parseFloat(position.average_price || "0"),
        markPrice: parseFloat(position.mark_price || "0"),
        unrealizedPnl: parseFloat(position.unrealized_pnl || "0"),
        realizedPnl: parseFloat(position.realized_pnl || "0"),
        direction: position.direction,
        delta: parseFloat(position.delta || "0"),
        gamma: parseFloat(position.gamma || "0"),
        theta: parseFloat(position.theta || "0"),
        vega: parseFloat(position.vega || "0"),
        indexPrice: parseFloat(position.index_price || "0"),
        settlementPrice: parseFloat(position.settlement_price || "0"),
        maintenanceMargin: parseFloat(position.maintenance_margin || "0"),
        initialMargin: parseFloat(position.initial_margin || "0"),
      }));
    } catch (error) {
      console.error("❌ Failed to parse position data:", error);
      return [];
    }
  }

  /**
   * Calculate total portfolio value
   */
  calculatePortfolioValue(accountSummary: any): number {
    try {
      if (!accountSummary || !accountSummary.total_equity) {
        return 0;
      }

      return parseFloat(accountSummary.total_equity || "0");
    } catch (error) {
      console.error("❌ Failed to calculate portfolio value:", error);
      return 0;
    }
  }

  /**
   * Check if user has sufficient balance for order
   */
  async checkSufficientBalance(
    orderValue: number,
    subaccountId?: number,
  ): Promise<boolean> {
    try {
      const availableBalance = await this.getAvailableBalance(subaccountId);
      return availableBalance >= orderValue;
    } catch (error) {
      console.error("❌ Failed to check balance:", error);
      return false; // Conservative approach - assume insufficient balance on error
    }
  }
}
