import {
  DERIVE_WS_MAINNET,
  DERIVE_FUTURES_INSTRUMENTS,
} from "@/app/lib/constants";

const WS_URL = DERIVE_WS_MAINNET;

// Add new interface for statistics response
interface StatisticsResponse {
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

class DeriveAPIService {
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
  private marketDataCache: Map<string, FuturesMarketData> = new Map();

  // Add properties to store cached data
  private cachedOptionInstruments: any[] = [];
  private cachedInstrumentDetails: Map<string, any> = new Map();

  constructor() {
    // Auto-connect is handled in ensureConnection
  }

  // Add method to check connection status
  public isConnected(): boolean {
    return this.isReady && this.ws?.readyState === WebSocket.OPEN;
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async ensureConnection(): Promise<void> {
    if (this.isConnected()) {
      return Promise.resolve();
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = this.connect();
    return this.connectionPromise;
  }

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

        // Note: Authentication is optional for public endpoints
        // We can add it later if needed for better rate limits
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

  // Add method to wait for connection
  public async waitForConnection(timeoutMs: number = 10000): Promise<void> {
    const startTime = Date.now();
    while (!this.isConnected() && Date.now() - startTime < timeoutMs) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    if (!this.isConnected()) {
      throw new Error("Timeout waiting for WebSocket connection");
    }
  }

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

  private handleSubscriptionMessage(message: any): void {
    const { method, params } = message;

    if (method === "subscription" && params) {
      const { channel, data } = params;
      // console.log("WS SUB MSG", channel, data, this.subscriptions);
      const subscription = this.subscriptions.get(channel);

      if (subscription) {
        subscription.callback(data);
      }
    }
  }

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

  private async sendRequest(method: string, params: any): Promise<any> {
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

  // Subscription methods for futures market data
  async subscribeToTicker(
    instrumentName: string,
    callback: DeriveSubscriptionCallback,
  ): Promise<void> {
    await this.ensureConnection();

    const subscriptionId = `ticker.${instrumentName}.1000`;
    const subscription: DeriveSubscription = {
      channel: `ticker.${instrumentName}.1000`,
      callback,
      instrumentName,
      type: "ticker",
    };

    this.subscriptions.set(subscriptionId, subscription);

    // Send subscription request
    await this.sendRequest("subscribe", {
      channels: [`ticker.${instrumentName}.1000`],
    });
  }

  // async subscribeToOrderBook(
  //   instrumentName: string,
  //   callback: DeriveSubscriptionCallback,
  // ): Promise<void> {
  //   await this.ensureConnection();

  //   const subscriptionId = `orderbook_${instrumentName}`;
  //   const subscription: DeriveSubscription = {
  //     channel: `orderbook.${instrumentName}.10.1000`,
  //     callback,
  //     instrumentName,
  //     type: "orderbook",
  //   };

  //   this.subscriptions.set(subscriptionId, subscription);

  //   // Send subscription request
  //   await this.sendRequest("subscribe", {
  //     channels: [`orderbook.${instrumentName}.10.1000`],
  //   });
  // }

  // Unsubscribe from futures ticker
  async unsubscribeFromFuturesTicker(instrumentName: string): Promise<void> {
    try {
      const subscriptionId = `ticker.${instrumentName}.1000`;

      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        await this.sendRequest("unsubscribe", {
          channels: [`ticker.${instrumentName}.1000`],
        });
        this.subscriptions.delete(subscriptionId);
      }
    } catch (error) {
      console.error("Failed to unsubscribe from futures ticker:", error);
    }
  }

  // Unsubscribe from futures orderbook
  // async unsubscribeFromFuturesOrderBook(instrumentName: string): Promise<void> {
  //   try {
  //     const subscriptionId = `orderbook_${instrumentName}`;

  //     if (this.ws && this.ws.readyState === WebSocket.OPEN) {
  //       await this.sendRequest("unsubscribe", {
  //         channels: [`orderbook.${instrumentName}.10.1000`],
  //       });
  //       this.subscriptions.delete(subscriptionId);
  //     }
  //   } catch (error) {
  //     console.error("Failed to unsubscribe from futures orderbook:", error);
  //   }
  // }

  // Get futures instruments
  async getFuturesInstruments(
    currency: string = "ETH",
  ): Promise<FuturesInstrument[]> {
    try {
      const response = await this.sendRequest("public/get_instruments", {
        currency,
        kind: "future",
        expired: false,
      });

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

  // Get current market data for a futures instrument
  async getFuturesMarketData(
    instrumentName: string,
  ): Promise<FuturesMarketData> {
    try {
      // Only fetch ticker data for now - order book API not available
      const tickerResponse = await this.sendRequest("public/get_ticker", {
        instrument_name: instrumentName,
      });

      const ticker = tickerResponse?.result
        ? {
            instrument_name: instrumentName,
            mark_price: tickerResponse.result.mark_price || "0",
            index_price: tickerResponse.result.index_price || "0",
            last_price: tickerResponse.result.last_price || "0",
            best_bid_price: tickerResponse.result.best_bid_price || "0",
            best_ask_price: tickerResponse.result.best_ask_price || "0",
            best_bid_amount: tickerResponse.result.best_bid_amount || "0",
            best_ask_amount: tickerResponse.result.best_ask_amount || "0",
            volume_24h: tickerResponse.result.volume_24h || "0",
            price_change_24h: tickerResponse.result.price_change_24h || "0",
            price_change_percentage_24h:
              tickerResponse.result.price_change_percentage_24h || "0",
            high_24h: tickerResponse.result.high_24h || "0",
            low_24h: tickerResponse.result.low_24h || "0",
            funding_rate: tickerResponse.result.funding_rate || "0",
            next_funding_rate: tickerResponse.result.next_funding_rate || "0",
            open_interest: tickerResponse.result.open_interest || "0",
            timestamp: Date.now(),
          }
        : null;

      // Comment out order book for now since API not available
      // const orderBook = orderBookResponse?.result
      //   ? {
      //       instrument_name: instrumentName,
      //       bids: orderBookResponse.result.bids || [],
      //       asks: orderBookResponse.result.asks || [],
      //       timestamp: Date.now(),
      //     }
      //   : null;

      const marketData: FuturesMarketData = {
        ticker,
        orderBook: null, // Set to null for now
        lastUpdated: Date.now(),
      };

      this.marketDataCache.set(instrumentName, marketData);
      return marketData;
    } catch (error) {
      console.error(`Error fetching market data for ${instrumentName}:`, error);
      throw error;
    }
  }

  // Get cached market data
  getCachedMarketData(instrumentName: string): FuturesMarketData | null {
    return this.marketDataCache.get(instrumentName) || null;
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
        page_size: 100,
      };

      if (currency) {
        params.currency = currency;
      }

      const response = await this.sendRequest(
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
        // Handle case where response has nested result structure
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
      const response = await this.sendRequest("public/get_instrument", {
        instrument_name: instrumentName,
      });

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
      // Create a promise that will resolve with the first ticker data
      const tickerPromise = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          // Clean up subscription on timeout
          this.unsubscribeFromFuturesTicker(instrumentName).catch(
            console.error,
          );
          reject(
            new Error(`Ticker subscription timeout for ${instrumentName}`),
          );
        }, 10000); // 10 second timeout

        // One-time callback that resolves the promise with ticker data
        const callback = (data: any) => {
          clearTimeout(timeout);
          this.unsubscribeFromFuturesTicker(instrumentName).catch(
            console.error,
          );
          resolve({ result: data.instrument_ticker });
        };

        // Subscribe to ticker updates
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

  async getOptionChainData(
    baseAsset: string = "ETH",
    retryAttempt: number = 0,
    isRefresh: boolean = false,
  ): Promise<OptionData[]> {
    const maxRetries = 3;
    const retryDelay = Math.pow(2, retryAttempt) * 1000; // Exponential backoff

    try {
      // Ensure connection is established
      await this.ensureConnection();

      // Only fetch static data if this is not a refresh call
      let optionInstruments: any[] = [];
      if (!isRefresh) {
        // Step 1: Get all option instruments for the specified base asset
        const instruments = await this.getAllInstruments(
          "option",
          false,
          baseAsset,
        );

        // Filter for active options with strike and option_type
        optionInstruments = instruments.filter(
          (instrument) =>
            instrument.is_active &&
            instrument.option_details?.strike &&
            instrument.option_details?.option_type,
        );

        if (optionInstruments.length === 0) {
          return [];
        }
      }

      // Get cached instruments if this is a refresh
      const cachedInstruments = this.cachedOptionInstruments || [];
      const instrumentsToProcess = isRefresh
        ? cachedInstruments
        : optionInstruments;

      // Fetch ticker data only
      const dataPromises = instrumentsToProcess.map(async (instrument) => {
        try {
          const tickerData = await this.getTicker(instrument.instrument_name);

          // If this is not a refresh, also fetch instrument details
          let instrumentDetails = null;
          if (!isRefresh) {
            instrumentDetails = await this.getInstrument(
              instrument.instrument_name,
            );
          }

          return {
            instrument,
            details:
              instrumentDetails ||
              this.cachedInstrumentDetails?.get(instrument.instrument_name),
            ticker: tickerData,
          };
        } catch (error) {
          return null;
        }
      });

      const instrumentDataArray = await Promise.all(dataPromises);

      // Cache the instruments and details if this is not a refresh
      if (!isRefresh) {
        this.cachedOptionInstruments = instrumentsToProcess;
        this.cachedInstrumentDetails = new Map(
          instrumentDataArray
            .filter((data) => data !== null)
            .map((data) => [data!.instrument.instrument_name, data!.details]),
        );
      }

      // Transform data to match OptionData interface
      const optionData: OptionData[] = instrumentDataArray
        .filter((data) => data !== null)
        .map((data) => {
          const { instrument, ticker } = data!;

          // Extract strike price from instrument option_details
          const strike = instrument.option_details?.strike
            ? parseFloat(instrument.option_details.strike)
            : 0;

          // Extract pricing data from ticker
          const tickerResult = ticker?.result || ticker;

          // Helper function to safely parse numeric values
          const parseNumeric = (value: any): number => {
            if (value === null || value === undefined) return 0;
            const parsed =
              typeof value === "string" ? parseFloat(value) : Number(value);
            return isNaN(parsed) ? 0 : parsed;
          };

          const optionPricing = tickerResult?.option_pricing;
          const stats = tickerResult?.stats;

          const mappedData = {
            delta:
              parseNumeric(optionPricing?.delta) ||
              parseNumeric(tickerResult?.delta) ||
              0,
            iv:
              parseNumeric(optionPricing?.iv) ||
              parseNumeric(optionPricing?.implied_volatility) ||
              parseNumeric(tickerResult?.iv) ||
              parseNumeric(tickerResult?.implied_volatility) ||
              0,
            volume:
              parseNumeric(stats?.contract_volume) ||
              parseNumeric(tickerResult?.volume_24h) ||
              parseNumeric(tickerResult?.volume) ||
              0,
            bidSize:
              parseNumeric(tickerResult?.best_bid_amount) ||
              parseNumeric(tickerResult?.bid_size) ||
              parseNumeric(tickerResult?.bidSize) ||
              0,
            bidPrice:
              parseNumeric(tickerResult?.best_bid_price) ||
              parseNumeric(tickerResult?.bid_price) ||
              parseNumeric(tickerResult?.bidPrice) ||
              0,
            askPrice:
              parseNumeric(tickerResult?.best_ask_price) ||
              parseNumeric(tickerResult?.ask_price) ||
              parseNumeric(tickerResult?.askPrice) ||
              0,
            askSize:
              parseNumeric(tickerResult?.best_ask_amount) ||
              parseNumeric(tickerResult?.ask_size) ||
              parseNumeric(tickerResult?.askSize) ||
              0,
            strike: strike,
          };

          return mappedData;
        })
        .filter((option) => option.strike > 0)
        .sort((a, b) => a.strike - b.strike);

      return optionData;
    } catch (error) {
      console.error(
        `Error fetching option chain data (attempt ${retryAttempt + 1}):`,
        error,
      );

      // Retry with exponential backoff
      if (retryAttempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        return this.getOptionChainData(baseAsset, retryAttempt + 1, isRefresh);
      }

      throw error;
    }
  }

  // Add new method to get statistics
  async getStatistics(
    instrumentName: string,
    currency?: string,
  ): Promise<StatisticsResponse> {
    try {
      await this.waitForConnection();

      const params: any = {
        instrument_name: instrumentName,
      };

      if (currency) {
        params.currency = currency;
      }

      console.log("Sending statistics request with params:", params);
      const response = await this.sendRequest("public/statistics", params);
      console.log("Received statistics response:", response);

      if (!response) {
        throw new Error("No response received from statistics endpoint");
      }

      // The response should be the full RPC response with result field
      return response.result;
    } catch (error) {
      console.error(`Error fetching statistics for ${instrumentName}:`, error);
      throw error;
    }
  }

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
  }
}

// Create a singleton instance
export const deriveAPI = new DeriveAPIService();

// Helper function to fetch live option data from WebSocket
export async function fetchOptionChainData(
  baseAsset: string = "ETH",
  isRefresh: boolean = false,
): Promise<OptionData[]> {
  try {
    const data = await deriveAPI.getOptionChainData(baseAsset, 0, isRefresh);

    if (data.length === 0) {
      return [];
    }

    return data;
  } catch (error) {
    console.error("Failed to fetch live option chain data:", error);
    throw error;
  }
}

// Helper functions for futures market data
export async function fetchFuturesInstruments(
  currency: string = "ETH",
): Promise<FuturesInstrument[]> {
  try {
    return await deriveAPI.getFuturesInstruments(currency);
  } catch (error) {
    console.error("Failed to fetch futures instruments:", error);
    throw error;
  }
}

export async function fetchFuturesMarketData(
  instrumentName: string,
): Promise<FuturesMarketData> {
  try {
    return await deriveAPI.getFuturesMarketData(instrumentName);
  } catch (error) {
    console.error(
      `Failed to fetch futures market data for ${instrumentName}:`,
      error,
    );
    throw error;
  }
}

export async function subscribeToFuturesTicker(
  instrumentName: string,
  callback: DeriveSubscriptionCallback,
): Promise<void> {
  try {
    await deriveAPI.subscribeToTicker(instrumentName, callback);
  } catch (error) {
    console.error(
      `Failed to subscribe to futures ticker for ${instrumentName}:`,
      error,
    );
    throw error;
  }
}

// Comment out order book subscriptions for now
// export async function subscribeToFuturesOrderBook(
//   instrumentName: string,
//   callback: DeriveSubscriptionCallback,
// ): Promise<void> {
//   try {
//     await deriveAPI.subscribeToOrderBook(instrumentName, callback);
//   } catch (error) {
//     console.error(
//       `Failed to subscribe to futures order book for ${instrumentName}:`,
//       error,
//     );
//     throw error;
//   }
// }

export async function unsubscribeFromFuturesTicker(
  instrumentName: string,
): Promise<void> {
  try {
    await deriveAPI.unsubscribeFromFuturesTicker(instrumentName);
  } catch (error) {
    console.error(
      `Failed to unsubscribe from futures ticker for ${instrumentName}:`,
      error,
    );
    throw error;
  }
}

// Comment out order book unsubscriptions for now
// export async function unsubscribeFromFuturesOrderBook(
//   instrumentName: string,
// ): Promise<void> {
//   try {
//     await deriveAPI.unsubscribeFromFuturesOrderBook(instrumentName);
//   } catch (error) {
//     console.error(
//       `Failed to unsubscribe from futures order book for ${instrumentName}:`,
//       error,
//     );
//     throw error;
//   }
// }

// Helper to get the appropriate futures instrument name for a base asset
export function getFuturesInstrumentName(baseAsset: string): string {
  const upperAsset =
    baseAsset.toUpperCase() as keyof typeof DERIVE_FUTURES_INSTRUMENTS;
  return DERIVE_FUTURES_INSTRUMENTS[upperAsset] || `${upperAsset}-PERP`;
}

export async function fetchInstrumentStatistics(
  instrumentName: string,
  currency?: string,
): Promise<StatisticsResponse> {
  try {
    console.log("Fetching statistics for:", instrumentName, currency);
    const response = await deriveAPI.getStatistics(instrumentName, currency);
    console.log("Processed statistics response:", response);
    return response;
  } catch (error) {
    console.error(`Failed to fetch statistics for ${instrumentName}:`, error);
    throw error;
  }
}
