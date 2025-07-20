/**
 * Refactored Derive API Service
 *
 * Main orchestrator that uses modular components for better maintainability.
 * This replaces the large monolithic DeriveAPIService class.
 */

import {
  DERIVE_WS_TESTNET,
  DERIVE_FUTURES_INSTRUMENTS,
} from "@/app/lib/constants";
import {
  type AuthenticationSession,
  type WalletProvider,
} from "./authentication-service";
import { WebSocketManager } from "./derive-api/websocket-manager";
import { AuthMethods } from "./derive-api/auth-methods";
import { OrderOperations } from "./derive-api/order-operations";
import { AccountMethods } from "./derive-api/account-methods";

// Types and interfaces
export interface FuturesInstrument {
  instrument_name: string;
  instrument_type: string;
  base_currency: string;
  quote_currency: string;
  settlement_currency: string;
  contract_size: number;
  tick_size: number;
  min_trade_amount: number;
  is_active: boolean;
  kind: string;
  expiration_timestamp?: number;
}

export interface FuturesMarketData {
  ticker: any;
  orderBook: any;
  lastUpdated: number;
}

export interface DeriveInstrument {
  instrument_name: string;
  is_active: boolean;
  option_details?: {
    strike: string;
    option_type: string;
  };
  [key: string]: any;
}

export interface DeriveInstrumentDetails {
  [key: string]: any;
}

export interface OptionData {
  delta: number;
  iv: number;
  volume: number;
  bidSize: number;
  bidPrice: number;
  askPrice: number;
  askSize: number;
  strike: number;
  instrument: {
    instrument_name: string;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface StatisticsResponse {
  daily_fees: string;
  daily_notional_volume: string;
  daily_premium_volume: string;
  daily_trades: number;
  open_interest: string;
  total_fees: string;
  total_notional_volume: string;
  total_premium_volume: string;
  total_trades: number;
}

export type DeriveSubscriptionCallback = (data: any) => void;

class DeriveAPIService {
  // Core modules
  private wsManager: WebSocketManager;
  private authMethods: AuthMethods;
  private orderOps: OrderOperations;
  private accountMethods: AccountMethods;

  // Market data cache and option-specific properties
  private marketDataCache: Map<string, FuturesMarketData> = new Map();
  private cachedOptionInstruments: any[] = [];
  private cachedInstrumentDetails: Map<string, any> = new Map();
  private currentCachedAsset: string | null = null;

  // Option subscriptions management
  private optionSubscriptions: Map<
    string,
    {
      instrumentNames: string[];
      callback: (instrumentName: string, data: any) => void;
    }
  > = new Map();
  private isOptionSubscriptionActive = false;

  constructor() {
    // Initialize core modules
    this.wsManager = new WebSocketManager();
    this.authMethods = new AuthMethods(this.wsManager);
    this.orderOps = new OrderOperations(this.wsManager, this.authMethods);
    this.accountMethods = new AccountMethods(this.wsManager, this.authMethods);
  }

  // Connection Management
  isConnected(): boolean {
    return this.wsManager.isConnected();
  }

  async waitForConnection(timeoutMs: number = 10000): Promise<void> {
    return this.wsManager.waitForConnection(timeoutMs);
  }

  disconnect(): void {
    this.wsManager.disconnect();
  }

  // Direct WebSocket request method
  async sendRequest(method: string, params: any): Promise<any> {
    return this.wsManager.sendRequest(method, params);
  }

  // Authentication Methods (delegated to AuthMethods)
  async login(walletProvider: WalletProvider): Promise<AuthenticationSession> {
    return this.authMethods.login(walletProvider);
  }

  async logout(): Promise<void> {
    return this.authMethods.logout();
  }

  isUserAuthenticated(): boolean {
    return this.authMethods.isUserAuthenticated();
  }

  getCurrentSession(): AuthenticationSession | null {
    return this.authMethods.getCurrentSession();
  }

  getAuthHeaders(): Record<string, string> {
    return this.authMethods.getAuthHeaders();
  }

  async refreshSession(): Promise<AuthenticationSession> {
    return this.authMethods.refreshSession();
  }

  // Order Operations (delegated to OrderOperations)
  async submitOrder(signedOrder: any): Promise<any> {
    return this.orderOps.submitOrder(signedOrder);
  }

  async cancelOrder(orderId: string): Promise<any> {
    return this.orderOps.cancelOrder(orderId);
  }

  async getOrderStatus(orderId: string): Promise<any> {
    return this.orderOps.getOrderStatus(orderId);
  }

  async getOpenOrders(
    subaccountId?: number,
    instrumentName?: string,
  ): Promise<any> {
    return this.orderOps.getOpenOrders(subaccountId, instrumentName);
  }

  async getOrderHistory(
    subaccountId?: number,
    instrumentName?: string,
    limit?: number,
  ): Promise<any> {
    return this.orderOps.getOrderHistory(subaccountId, instrumentName, limit);
  }

  async subscribeToOrderUpdates(
    callback: (orderUpdate: any) => void,
  ): Promise<void> {
    return this.orderOps.subscribeToOrderUpdates(callback);
  }

  async unsubscribeFromOrderUpdates(): Promise<void> {
    return this.orderOps.unsubscribeFromOrderUpdates();
  }

  async getOrderBook(instrumentName: string, depth: number = 10): Promise<any> {
    return this.orderOps.getOrderBook(instrumentName, depth);
  }

  parseOrderResponse(response: any): any {
    return this.orderOps.parseOrderResponse(response);
  }

  async validateOrderBeforeSubmission(
    signedOrder: any,
  ): Promise<{ isValid: boolean; errors: string[] }> {
    return this.orderOps.validateOrderBeforeSubmission(signedOrder);
  }

  // Account Methods (delegated to AccountMethods)
  async getSubaccounts(): Promise<any> {
    return this.accountMethods.getSubaccounts();
  }

  async getAccountSummary(subaccountId?: number): Promise<any> {
    return this.accountMethods.getAccountSummary(subaccountId);
  }

  async getPositions(
    subaccountId?: number,
    instrumentName?: string,
  ): Promise<any> {
    return this.accountMethods.getPositions(subaccountId, instrumentName);
  }

  async getAvailableBalance(
    subaccountId?: number,
    currency?: string,
  ): Promise<number> {
    return this.accountMethods.getAvailableBalance(subaccountId, currency);
  }

  async subscribeToPositionUpdates(
    callback: (positionUpdate: any) => void,
  ): Promise<void> {
    return this.accountMethods.subscribeToPositionUpdates(callback);
  }

  async subscribeToBalanceUpdates(
    callback: (balanceUpdate: any) => void,
  ): Promise<void> {
    return this.accountMethods.subscribeToBalanceUpdates(callback);
  }

  async checkSufficientBalance(
    orderValue: number,
    subaccountId?: number,
  ): Promise<boolean> {
    return this.accountMethods.checkSufficientBalance(orderValue, subaccountId);
  }

  parsePositionData(positions: any[]): any[] {
    return this.accountMethods.parsePositionData(positions);
  }

  calculatePortfolioValue(accountSummary: any): number {
    return this.accountMethods.calculatePortfolioValue(accountSummary);
  }

  // Market Data Methods (kept in main class for now due to complexity)
  async subscribeToTicker(
    instrumentName: string,
    callback: DeriveSubscriptionCallback,
  ): Promise<void> {
    await this.wsManager.ensureConnection();

    const subscriptionId = `ticker.${instrumentName}.1000`;

    // Check if subscription already exists
    if (this.wsManager.hasSubscription(subscriptionId)) {
      console.log(
        `Already subscribed to ticker ${instrumentName}, updating callback`,
      );
      const existingSubscription =
        this.wsManager.getSubscription(subscriptionId)!;
      existingSubscription.callback = callback;
      return;
    }

    const subscription = {
      channel: `ticker.${instrumentName}.1000`,
      callback,
      instrumentName,
      type: "ticker",
    };

    this.wsManager.addSubscription(subscriptionId, subscription);

    // Send subscription request
    await this.wsManager.sendRequest("subscribe", {
      channels: [`ticker.${instrumentName}.1000`],
    });
  }

  async subscribeToMultipleTickers(
    instrumentNames: string[],
    callback: (instrumentName: string, data: any) => void,
  ): Promise<void> {
    await this.wsManager.ensureConnection();

    // Filter out instruments that are already subscribed
    const newInstruments = instrumentNames.filter((instrumentName) => {
      const subscriptionId = `ticker.${instrumentName}.1000`;
      return !this.wsManager.hasSubscription(subscriptionId);
    });

    // Update callbacks for existing subscriptions
    instrumentNames.forEach((instrumentName) => {
      const subscriptionId = `ticker.${instrumentName}.1000`;
      if (this.wsManager.hasSubscription(subscriptionId)) {
        const existingSubscription =
          this.wsManager.getSubscription(subscriptionId)!;
        existingSubscription.callback = (data: any) =>
          callback(instrumentName, data);
      }
    });

    // Only subscribe to new instruments
    if (newInstruments.length === 0) {
      console.log("All instruments already subscribed, callbacks updated");
      return;
    }

    const channels = newInstruments.map((name) => `ticker.${name}.1000`);

    // Create subscriptions for new instruments only
    newInstruments.forEach((instrumentName) => {
      const subscriptionId = `ticker.${instrumentName}.1000`;
      const subscription = {
        channel: `ticker.${instrumentName}.1000`,
        callback: (data: any) => callback(instrumentName, data),
        instrumentName,
        type: "ticker",
      };
      this.wsManager.addSubscription(subscriptionId, subscription);
    });

    // Send single subscription request for new channels only
    await this.wsManager.sendRequest("subscribe", {
      channels,
    });
  }

  async unsubscribeFromFuturesTicker(instrumentName: string): Promise<void> {
    try {
      const subscriptionId = `ticker.${instrumentName}.1000`;

      if (!this.wsManager.hasSubscription(subscriptionId)) {
        console.log(
          `No active subscription found for ticker ${instrumentName}`,
        );
        return;
      }

      if (this.wsManager.isConnected()) {
        await this.wsManager.sendRequest("unsubscribe", {
          channels: [`ticker.${instrumentName}.1000`],
        });
      }

      this.wsManager.removeSubscription(subscriptionId);
      console.log(`Unsubscribed from ticker ${instrumentName}`);
    } catch (error) {
      console.error("Failed to unsubscribe from futures ticker:", error);
    }
  }

  async unsubscribeFromMultipleTickers(
    instrumentNames: string[],
  ): Promise<void> {
    try {
      const subscribedInstruments = instrumentNames.filter((instrumentName) => {
        const subscriptionId = `ticker.${instrumentName}.1000`;
        return this.wsManager.hasSubscription(subscriptionId);
      });

      if (subscribedInstruments.length === 0) {
        console.log(
          "No active subscriptions found for the specified instruments",
        );
        return;
      }

      const channels = subscribedInstruments.map(
        (name) => `ticker.${name}.1000`,
      );

      if (this.wsManager.isConnected()) {
        await this.wsManager.sendRequest("unsubscribe", {
          channels,
        });
      }

      subscribedInstruments.forEach((instrumentName) => {
        const subscriptionId = `ticker.${instrumentName}.1000`;
        this.wsManager.removeSubscription(subscriptionId);
      });

      console.log(
        `Unsubscribed from ${subscribedInstruments.length} tickers:`,
        subscribedInstruments,
      );
    } catch (error) {
      console.error("Failed to unsubscribe from multiple tickers:", error);
    }
  }

  // Public API Methods
  async getFuturesInstruments(
    currency: string = "ETH",
  ): Promise<FuturesInstrument[]> {
    try {
      const response = await this.wsManager.sendRequest(
        "public/get_instruments",
        {
          currency,
          kind: "future",
          expired: false,
        },
      );

      if (response && response.result && Array.isArray(response.result)) {
        return response.result.map((instrument: any) => ({
          instrument_name: instrument.instrument_name,
          instrument_type: instrument.instrument_type,
          base_currency: instrument.base_currency,
          quote_currency: instrument.quote_currency,
          settlement_currency: instrument.settlement_currency,
          contract_size: instrument.contract_size,
          tick_size: instrument.tick_size,
          min_trade_amount: instrument.min_trade_amount,
          is_active: instrument.is_active,
          kind: instrument.kind,
          expiration_timestamp: instrument.expiration_timestamp,
        }));
      }

      return [];
    } catch (error) {
      console.error("Error fetching futures instruments:", error);
      throw error;
    }
  }

  async getAllInstruments(
    instrumentType: string = "option",
    expired: boolean = false,
    currency: string | null = null,
  ): Promise<DeriveInstrument[]> {
    try {
      const params: any = {
        expired,
        instrument_type: instrumentType,
        page: 1,
        page_size: 400,
      };

      if (currency) {
        params.currency = currency;
      }

      const response = await this.wsManager.sendRequest(
        "public/get_all_instruments",
        params,
      );

      // Extract instruments from response
      let instruments: DeriveInstrument[] = [];

      if (
        response &&
        response.instruments &&
        Array.isArray(response.instruments)
      ) {
        instruments = response.instruments;
      } else if (
        response &&
        response.result &&
        response.result.instruments &&
        Array.isArray(response.result.instruments)
      ) {
        instruments = response.result.instruments;
      } else {
        return [];
      }

      return instruments;
    } catch (error) {
      console.error("Error fetching all instruments via WebSocket:", error);
      throw error;
    }
  }

  async getInstrument(
    instrumentName: string,
  ): Promise<DeriveInstrumentDetails> {
    try {
      const response = await this.wsManager.sendRequest(
        "public/get_instrument",
        {
          instrument_name: instrumentName,
        },
      );

      return response;
    } catch (error) {
      console.error(
        `Error fetching instrument ${instrumentName} via WebSocket:`,
        error,
      );
      throw error;
    }
  }

  async getTicker(instrumentName: string): Promise<any> {
    try {
      const tickerPromise = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          this.unsubscribeFromFuturesTicker(instrumentName).catch(
            console.error,
          );
          reject(
            new Error(`Ticker subscription timeout for ${instrumentName}`),
          );
        }, 10000);

        const callback = (data: any) => {
          clearTimeout(timeout);
          this.unsubscribeFromFuturesTicker(instrumentName).catch(
            console.error,
          );
          resolve({ result: data.instrument_ticker });
        };

        this.subscribeToTicker(instrumentName, callback).catch((error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });

      return await tickerPromise;
    } catch (error) {
      console.error(
        `Error fetching ticker for ${instrumentName} via WebSocket:`,
        error,
      );
      throw error;
    }
  }

  async getMultipleTickers(
    instrumentNames: string[],
  ): Promise<Map<string, any>> {
    try {
      const results = new Map<string, any>();
      const pendingInstruments = new Set(instrumentNames);

      const tickersPromise = new Promise<Map<string, any>>(
        (resolve, reject) => {
          const timeout = setTimeout(() => {
            this.unsubscribeFromMultipleTickers(instrumentNames).catch(
              console.error,
            );
            reject(new Error(`Batch ticker subscription timeout`));
          }, 15000);

          const callback = (instrumentName: string, data: unknown) => {
            results.set(instrumentName, { result: data.instrument_ticker });
            pendingInstruments.delete(instrumentName);

            if (pendingInstruments.size === 0) {
              clearTimeout(timeout);
              this.unsubscribeFromMultipleTickers(instrumentNames).catch(
                console.error,
              );
              resolve(results);
            }
          };

          this.subscribeToMultipleTickers(instrumentNames, callback).catch(
            (error) => {
              clearTimeout(timeout);
              reject(error);
            },
          );
        },
      );

      return await tickersPromise;
    } catch (error) {
      console.error(`Error fetching multiple tickers via WebSocket:`, error);
      throw error;
    }
  }

  // Cache management
  getCachedMarketData(instrumentName: string): FuturesMarketData | null {
    return this.marketDataCache.get(instrumentName) || null;
  }

  async getInstrumentStatistics(
    instrumentType: string,
    baseAsset: string,
  ): Promise<StatisticsResponse> {
    try {
      // Use the correct public/statistics API endpoint
      const response = await this.wsManager.sendRequest("public/statistics", {
        instrument_name: instrumentType, // 'PERP', 'OPTION', etc.
        currency: baseAsset, // 'ETH', 'BTC', etc.
      });

      if (response.error) {
        throw new Error(
          `Failed to fetch instrument statistics: ${response.error.message}`,
        );
      }

      // The API returns the data in the exact format we need
      const result = response.result || {};
      return {
        daily_fees: result.daily_fees || "0",
        daily_notional_volume: result.daily_notional_volume || "0",
        daily_premium_volume: result.daily_premium_volume || "0",
        daily_trades: result.daily_trades || 0,
        open_interest: result.open_interest || "0",
        total_fees: result.total_fees || "0",
        total_notional_volume: result.total_notional_volume || "0",
        total_premium_volume: result.total_premium_volume || "0",
        total_trades: result.total_trades || 0,
      };
    } catch (error) {
      console.error("Error fetching instrument statistics:", error);
      throw error;
    }
  }

  clearOptionCache(): void {
    console.log("🧹 Manually clearing option cache");
    this.cachedOptionInstruments = [];
    this.cachedInstrumentDetails.clear();
    this.currentCachedAsset = null;
  }

  // Simplified option chain data method (keeping core logic but cleaner)
  async getOptionChainData(
    baseAsset: string = "ETH",
    retryAttempt: number = 0,
    isRefresh: boolean = false,
  ): Promise<OptionData[]> {
    try {
      await this.wsManager.ensureConnection();

      // Clear cache if switching assets
      if (this.currentCachedAsset && this.currentCachedAsset !== baseAsset) {
        this.clearOptionCache();
      }

      let instrumentsToProcess: unknown[] = [];

      if (!isRefresh) {
        const instruments = await this.getAllInstruments(
          "option",
          false,
          baseAsset,
        );
        instrumentsToProcess = instruments.filter(
          (instrument) =>
            instrument.is_active &&
            instrument.option_details?.strike &&
            instrument.option_details?.option_type,
        );

        this.cachedOptionInstruments = instrumentsToProcess;
        this.currentCachedAsset = baseAsset;
      } else {
        instrumentsToProcess = this.cachedOptionInstruments;
      }

      if (instrumentsToProcess.length === 0) {
        return [];
      }

      // Get ticker data
      const instrumentNames = instrumentsToProcess.map(
        (i) => i.instrument_name,
      );
      const tickerDataMap = await this.getMultipleTickers(instrumentNames);

      // Transform to OptionData format
      const optionData: OptionData[] = instrumentsToProcess.map(
        (instrument) => {
          const tickerData = tickerDataMap.get(instrument.instrument_name);
          const tickerResult = tickerData?.result || {};

          const parseNumeric = (value: unknown): number => {
            if (value === null || value === undefined) return 0;
            const parsed =
              typeof value === "string" ? parseFloat(value) : Number(value);
            return isNaN(parsed) ? 0 : parsed;
          };

          return {
            delta: parseNumeric(tickerResult.delta),
            iv: parseNumeric(
              tickerResult.iv || tickerResult.implied_volatility,
            ),
            volume: parseNumeric(
              tickerResult.volume_24h || tickerResult.volume,
            ),
            bidSize: parseNumeric(
              tickerResult.best_bid_amount || tickerResult.bid_size,
            ),
            bidPrice: parseNumeric(
              tickerResult.best_bid_price || tickerResult.bid_price,
            ),
            askPrice: parseNumeric(
              tickerResult.best_ask_price || tickerResult.ask_price,
            ),
            askSize: parseNumeric(
              tickerResult.best_ask_amount || tickerResult.ask_size,
            ),
            strike: parseFloat(instrument.option_details?.strike || "0"),
            instrument: {
              instrument_name: instrument.instrument_name,
              ...instrument,
            },
          };
        },
      );

      return optionData;
    } catch (error) {
      console.error(`Error fetching option chain data:`, error);
      throw error;
    }
  }
}

// Create a singleton instance
export const deriveAPI = new DeriveAPIService();

// Helper function to fetch live option data from WebSocket
export async function fetchLiveOptionData(
  baseAsset: string = "ETH",
  isRefresh: boolean = false,
): Promise<OptionData[]> {
  try {
    return await deriveAPI.getOptionChainData(baseAsset, 0, isRefresh);
  } catch (error) {
    console.error("Error fetching live option data:", error);
    throw error;
  }
}

// Export alias for backward compatibility
export const fetchOptionChainData = fetchLiveOptionData;

// Futures-specific helper functions
export async function subscribeToFuturesTicker(
  instrumentName: string,
  callback: DeriveSubscriptionCallback,
): Promise<void> {
  return deriveAPI.subscribeToTicker(instrumentName, callback);
}

export function getFuturesInstrumentName(baseAsset: string): string {
  // Helper function to format futures instrument names
  // Convert base asset (e.g., "ETH") to futures instrument name (e.g., "ETH-PERP")
  return `${baseAsset}-PERP`;
}

export async function fetchInstrumentStatistics(
  instrumentType: string,
  baseAsset: string,
): Promise<StatisticsResponse> {
  try {
    return await deriveAPI.getInstrumentStatistics(instrumentType, baseAsset);
  } catch (error) {
    console.error("Error fetching instrument statistics:", error);
    throw error;
  }
}

// Option chain subscription helpers
export async function subscribeToOptionChainUpdates(
  baseAsset: string,
  callback: (data: OptionData[]) => void,
): Promise<void> {
  try {
    // Get initial data
    const initialData = await deriveAPI.getOptionChainData(baseAsset);
    callback(initialData);

    // Set up periodic updates (since we don't have direct option chain subscriptions)
    const updateInterval = setInterval(async () => {
      try {
        const updatedData = await deriveAPI.getOptionChainData(
          baseAsset,
          0,
          true,
        );
        callback(updatedData);
      } catch (error) {
        console.error("Error updating option chain data:", error);
      }
    }, 5000); // Update every 5 seconds

    // Store interval for cleanup
    (globalThis as unknown).__optionChainInterval = updateInterval;
  } catch (error) {
    console.error("Error setting up option chain updates:", error);
    throw error;
  }
}

export function unsubscribeFromOptionChainUpdates(): void {
  if ((globalThis as unknown).__optionChainInterval) {
    clearInterval((globalThis as unknown).__optionChainInterval);
    delete (globalThis as unknown).__optionChainInterval;
  }
}

// Re-export clearOptionCache from the main service
export function clearOptionCache(): void {
  return deriveAPI.clearOptionCache();
}
