import {
  DERIVE_WS_TESTNET,
  DERIVE_FUTURES_INSTRUMENTS,
} from "@/app/lib/constants";

const WS_URL = DERIVE_WS_TESTNET;

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
  private currentCachedAsset: string | null = null;

  // Add properties for persistent option subscriptions
  private optionSubscriptions: Map<
    string,
    {
      instrumentNames: string[];
      callback: (instrumentName: string, data: any) => void;
    }
  > = new Map();
  private isOptionSubscriptionActive = false;

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

    // Check if subscription already exists
    if (this.subscriptions.has(subscriptionId)) {
      console.log(
        `Already subscribed to ticker ${instrumentName}, updating callback`,
      );
      // Update the callback for existing subscription
      const existingSubscription = this.subscriptions.get(subscriptionId)!;
      existingSubscription.callback = callback;
      return;
    }

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

  // New method for batch subscription to multiple ticker channels
  async subscribeToMultipleTickers(
    instrumentNames: string[],
    callback: (instrumentName: string, data: any) => void,
  ): Promise<void> {
    await this.ensureConnection();

    // Filter out instruments that are already subscribed
    const newInstruments = instrumentNames.filter((instrumentName) => {
      const subscriptionId = `ticker.${instrumentName}.1000`;
      return !this.subscriptions.has(subscriptionId);
    });

    // Update callbacks for existing subscriptions
    instrumentNames.forEach((instrumentName) => {
      const subscriptionId = `ticker.${instrumentName}.1000`;
      if (this.subscriptions.has(subscriptionId)) {
        const existingSubscription = this.subscriptions.get(subscriptionId)!;
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
      const subscription: DeriveSubscription = {
        channel: `ticker.${instrumentName}.1000`,
        callback: (data: any) => callback(instrumentName, data),
        instrumentName,
        type: "ticker",
      };
      this.subscriptions.set(subscriptionId, subscription);
    });

    // Send single subscription request for new channels only
    await this.sendRequest("subscribe", {
      channels,
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

      // Check if subscription exists before trying to unsubscribe
      if (!this.subscriptions.has(subscriptionId)) {
        console.log(
          `No active subscription found for ticker ${instrumentName}`,
        );
        return;
      }

      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        await this.sendRequest("unsubscribe", {
          channels: [`ticker.${instrumentName}.1000`],
        });
      }

      // Always remove from local subscriptions map, even if WebSocket is not open
      this.subscriptions.delete(subscriptionId);
      console.log(`Unsubscribed from ticker ${instrumentName}`);
    } catch (error) {
      console.error("Failed to unsubscribe from futures ticker:", error);
    }
  }

  // Unsubscribe from multiple tickers
  async unsubscribeFromMultipleTickers(
    instrumentNames: string[],
  ): Promise<void> {
    try {
      // Filter only instruments that are actually subscribed
      const subscribedInstruments = instrumentNames.filter((instrumentName) => {
        const subscriptionId = `ticker.${instrumentName}.1000`;
        return this.subscriptions.has(subscriptionId);
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

      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        await this.sendRequest("unsubscribe", {
          channels,
        });
      }

      // Remove subscriptions from the map (always, even if WebSocket is not open)
      subscribedInstruments.forEach((instrumentName) => {
        const subscriptionId = `ticker.${instrumentName}.1000`;
        this.subscriptions.delete(subscriptionId);
      });

      console.log(
        `Unsubscribed from ${subscribedInstruments.length} tickers:`,
        subscribedInstruments,
      );
    } catch (error) {
      console.error("Failed to unsubscribe from multiple tickers:", error);
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
        page_size: 400,
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

  // New method to get multiple tickers using batch subscription
  async getMultipleTickers(
    instrumentNames: string[],
  ): Promise<Map<string, any>> {
    try {
      const results = new Map<string, any>();
      const pendingInstruments = new Set(instrumentNames);

      // Create a promise that will resolve when all ticker data is received
      const tickersPromise = new Promise<Map<string, any>>(
        (resolve, reject) => {
          const timeout = setTimeout(() => {
            // Clean up subscriptions on timeout using batch unsubscription
            this.unsubscribeFromMultipleTickers(instrumentNames).catch(
              console.error,
            );
            reject(new Error(`Batch ticker subscription timeout`));
          }, 15000); // 15 second timeout for batch

          // Callback that handles each ticker response
          const callback = (instrumentName: string, data: any) => {
            results.set(instrumentName, { result: data.instrument_ticker });
            pendingInstruments.delete(instrumentName);

            // If all instruments have responded, resolve
            if (pendingInstruments.size === 0) {
              clearTimeout(timeout);
              // Clean up subscriptions using batch unsubscription
              this.unsubscribeFromMultipleTickers(instrumentNames).catch(
                console.error,
              );
              resolve(results);
            }
          };

          // Subscribe to multiple ticker updates
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

  // Method to clear cache manually if needed
  public clearOptionCache(): void {
    console.log("🧹 Manually clearing option cache");
    this.cachedOptionInstruments = [];
    this.cachedInstrumentDetails.clear();
    this.currentCachedAsset = null;
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

      console.log(
        `🔍 getOptionChainData: baseAsset=${baseAsset}, retryAttempt=${retryAttempt}, isRefresh=${isRefresh}`,
      );
      console.log(`🔍 Current cached asset: ${this.currentCachedAsset}`);

      // Clear cache if switching to a different asset
      if (this.currentCachedAsset && this.currentCachedAsset !== baseAsset) {
        console.log(
          `🧹 Clearing cache due to asset change: ${this.currentCachedAsset} -> ${baseAsset}`,
        );
        this.cachedOptionInstruments = [];
        this.cachedInstrumentDetails.clear();
        this.currentCachedAsset = null;
      }

      // Only fetch static data if this is not a refresh call
      let optionInstruments: any[] = [];
      if (!isRefresh) {
        console.log(`🔄 Fetching fresh instruments for ${baseAsset}...`);
        // Step 1: Get all option instruments for the specified base asset
        const instruments = await this.getAllInstruments(
          "option",
          false,
          baseAsset,
        );

        console.log(
          `📦 Received ${instruments.length} raw instruments from API`,
        );

        // Filter for active options with strike and option_type (no strike range filtering)
        optionInstruments = instruments.filter((instrument) => {
          const isValid =
            instrument.is_active &&
            instrument.option_details?.strike &&
            instrument.option_details?.option_type;

          return isValid;
        });

        console.log(
          `✅ Filtered to ${optionInstruments.length} valid instruments for ${baseAsset}`,
        );

        if (optionInstruments.length === 0) {
          console.warn(`⚠️ No option instruments found for ${baseAsset}`);
          return [];
        }

        // Set the current cached asset
        this.currentCachedAsset = baseAsset;
      }

      // Get cached instruments if this is a refresh
      const cachedInstruments = this.cachedOptionInstruments || [];
      const instrumentsToProcess = isRefresh
        ? cachedInstruments
        : optionInstruments;

      console.log(
        `🔄 Processing ${instrumentsToProcess.length} instruments (isRefresh: ${isRefresh})`,
      );

      // If refresh and no cached instruments, do nothing
      if (isRefresh && instrumentsToProcess.length === 0) {
        console.warn(
          `⚠️ Refresh requested but no cached instruments available for ${baseAsset}`,
        );
        return [];
      }

      // If refresh and cached asset doesn't match current asset, return empty
      if (isRefresh && this.currentCachedAsset !== baseAsset) {
        console.warn(
          `⚠️ Refresh requested for ${baseAsset} but cache is for ${this.currentCachedAsset}`,
        );
        return [];
      }

      // Fetch ticker data using batch subscription
      let tickerDataMap: Map<string, any>;
      const instrumentNames = instrumentsToProcess.map(
        (instrument) => instrument.instrument_name,
      );

      try {
        tickerDataMap = await this.getMultipleTickers(instrumentNames);
      } catch (error) {
        console.error(
          "Batch ticker subscription failed, falling back to individual requests:",
          error,
        );
        // Fallback to individual ticker requests
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
          console.log(
            `💾 Caching ${instrumentsToProcess.length} instruments for ${baseAsset}`,
          );
          this.cachedOptionInstruments = instrumentsToProcess;
          this.cachedInstrumentDetails = new Map(
            instrumentDataArray
              .filter((data) => data !== null)
              .map((data) => [data!.instrument.instrument_name, data!.details]),
          );
          this.currentCachedAsset = baseAsset;
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
              instrument: {
                instrument_name: instrument.instrument_name,
                option_details: instrument.option_details,
              },
            };

            return mappedData;
          })
          .sort((a, b) => a.strike - b.strike);

        return optionData;
      }

      // Process batch ticker data
      const instrumentDataArray = await Promise.all(
        instrumentsToProcess.map(async (instrument) => {
          try {
            const tickerData = tickerDataMap.get(instrument.instrument_name);

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
        }),
      ); // Cache the instruments and details if this is not a refresh
      if (!isRefresh) {
        console.log(
          `💾 Caching ${instrumentsToProcess.length} instruments for ${baseAsset} (batch)`,
        );
        this.cachedOptionInstruments = instrumentsToProcess;
        this.cachedInstrumentDetails = new Map(
          instrumentDataArray
            .filter((data) => data !== null)
            .map((data) => [data!.instrument.instrument_name, data!.details]),
        );
        this.currentCachedAsset = baseAsset;
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
            instrument: {
              instrument_name: instrument.instrument_name,
              option_details: instrument.option_details,
            },
          };

          return mappedData;
        })
        .sort((a, b) => a.strike - b.strike);

      console.log(
        `✅ Returning ${optionData.length} option data points for ${baseAsset}`,
      );
      if (optionData.length > 0) {
        console.log(
          `📊 Strike range in results: ${Math.min(...optionData.map((o) => o.strike))} - ${Math.max(...optionData.map((o) => o.strike))}`,
        );
      }

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

  // Add new method for persistent option data subscriptions
  async subscribeToOptionChainUpdates(
    baseAsset: string,
    callback: (data: OptionData[]) => void,
  ): Promise<void> {
    try {
      console.log(
        `🔔 Setting up persistent option subscription for ${baseAsset}`,
      );

      // Get initial option instruments if not cached
      if (
        this.currentCachedAsset !== baseAsset ||
        this.cachedOptionInstruments.length === 0
      ) {
        console.log(`📦 Fetching initial instruments for ${baseAsset}...`);
        await this.getOptionChainData(baseAsset, 0, false);
      }

      const instrumentNames = this.cachedOptionInstruments.map(
        (instrument) => instrument.instrument_name,
      );

      if (instrumentNames.length === 0) {
        console.warn(`⚠️ No option instruments found for ${baseAsset}`);
        return;
      }

      // Unsubscribe from any existing option subscriptions
      // if (this.isOptionSubscriptionActive) {
      //   await this.unsubscribeFromOptionChainUpdates();
      // }

      const subscriptionKey = `option_chain_${baseAsset}`;

      // Subscribe to multiple tickers with persistent callback
      const tickerCallback = (instrumentName: string, data: any) => {
        // Update cache with new ticker data
        this.updateCachedOptionData(instrumentName, data);

        // Transform cached data and call the callback
        const optionData = this.transformCachedDataToOptionData();
        callback(optionData);
      };

      await this.subscribeToMultipleTickers(instrumentNames, tickerCallback);

      // Store subscription info
      this.optionSubscriptions.set(subscriptionKey, {
        instrumentNames,
        callback: tickerCallback,
      });
      this.isOptionSubscriptionActive = true;

      console.log(
        `✅ Persistent option subscription active for ${baseAsset} (${instrumentNames.length} instruments)`,
      );
    } catch (error) {
      console.error(
        `❌ Failed to set up persistent option subscription for ${baseAsset}:`,
        error,
      );
      throw error;
    }
  }

  // Method to unsubscribe from option chain updates
  async unsubscribeFromOptionChainUpdates(): Promise<void> {
    try {
      if (!this.isOptionSubscriptionActive) {
        console.log("📴 No active option subscriptions to unsubscribe from");
        return;
      }

      console.log("🔕 Unsubscribing from persistent option subscriptions...");

      // Use forEach instead of for...of to avoid iterator issues
      this.optionSubscriptions.forEach(async (subscription, key) => {
        await this.unsubscribeFromMultipleTickers(subscription.instrumentNames);
      });

      this.optionSubscriptions.clear();
      this.isOptionSubscriptionActive = false;

      console.log("✅ Successfully unsubscribed from all option subscriptions");
    } catch (error) {
      console.error(
        "❌ Failed to unsubscribe from option subscriptions:",
        error,
      );
      throw error;
    }
  }

  // Helper method to update cached option data with new ticker data
  private updateCachedOptionData(
    instrumentName: string,
    tickerData: any,
  ): void {
    // Find and update the cached instrument data
    const instrument = this.cachedOptionInstruments.find(
      (inst) => inst.instrument_name === instrumentName,
    );

    if (instrument) {
      // Store the latest ticker data for this instrument
      instrument._latestTickerData =
        tickerData?.instrument_ticker || tickerData;
      console.log(`📊 Updated cached data for ${instrumentName}`);
    }
  }

  // Helper method to transform cached data to OptionData format
  private transformCachedDataToOptionData(): OptionData[] {
    if (!this.cachedOptionInstruments.length) {
      return [];
    }

    // Transform cached instruments and latest ticker data to OptionData format
    const optionData: OptionData[] = this.cachedOptionInstruments
      .filter((instrument) => instrument._latestTickerData) // Only include instruments with ticker data
      .map((instrument) => {
        const strike = instrument.option_details?.strike
          ? parseFloat(instrument.option_details.strike)
          : 0;

        const tickerResult = instrument._latestTickerData;

        // Helper function to safely parse numeric values
        const parseNumeric = (value: any): number => {
          if (value === null || value === undefined) return 0;
          const parsed =
            typeof value === "string" ? parseFloat(value) : Number(value);
          return isNaN(parsed) ? 0 : parsed;
        };

        const optionPricing = tickerResult?.option_pricing;
        const stats = tickerResult?.stats;

        return {
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
          instrument: {
            instrument_name: instrument.instrument_name,
            option_details: instrument.option_details,
          },
        };
      });

    return optionData.sort((a, b) => a.strike - b.strike);
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

  // Debug method to get current subscriptions
  getActiveSubscriptions(): string[] {
    return Array.from(this.subscriptions.keys());
  }

  // Debug method to get subscription count
  getSubscriptionCount(): number {
    return this.subscriptions.size;
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
    console.log(
      `🔄 fetchOptionChainData called with baseAsset: ${baseAsset}, isRefresh: ${isRefresh}`,
    );
    const data = await deriveAPI.getOptionChainData(baseAsset, 0, isRefresh);

    console.log(`✅ fetchOptionChainData received ${data.length} items`);
    if (data.length > 0) {
      console.log("📊 Sample option data:", data[0]);
    }

    if (data.length === 0) {
      return [];
    }

    return data;
  } catch (error) {
    console.error("❌ Failed to fetch live option chain data:", error);
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

export async function subscribeToMultipleFuturesTickers(
  instrumentNames: string[],
  callback: (instrumentName: string, data: any) => void,
): Promise<void> {
  try {
    await deriveAPI.subscribeToMultipleTickers(instrumentNames, callback);
  } catch (error) {
    console.error(`Failed to subscribe to multiple futures tickers:`, error);
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

export async function unsubscribeFromMultipleFuturesTickers(
  instrumentNames: string[],
): Promise<void> {
  try {
    await deriveAPI.unsubscribeFromMultipleTickers(instrumentNames);
  } catch (error) {
    console.error(
      `Failed to unsubscribe from multiple futures tickers:`,
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

// Helper function to clear option cache
export function clearOptionCache(): void {
  deriveAPI.clearOptionCache();
}

// Helper function for persistent option chain subscriptions
export async function subscribeToOptionChainUpdates(
  baseAsset: string,
  callback: (data: OptionData[]) => void,
): Promise<void> {
  try {
    await deriveAPI.subscribeToOptionChainUpdates(baseAsset, callback);
  } catch (error) {
    console.error(
      `Failed to subscribe to option chain updates for ${baseAsset}:`,
      error,
    );
    throw error;
  }
}

export async function unsubscribeFromOptionChainUpdates(): Promise<void> {
  try {
    await deriveAPI.unsubscribeFromOptionChainUpdates();
  } catch (error) {
    console.error("Failed to unsubscribe from option chain updates:", error);
    throw error;
  }
}
