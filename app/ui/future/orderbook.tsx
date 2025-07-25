"use client";

import { useEffect, useState } from "react";

interface OrderBookEntry {
  price: number;
  size: number;
  total: number;
}

interface OrderBookData {
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  lastUpdated: number;
}

interface OrderBookProps {
  instrumentName: string;
  selectedPair: string;
  liveTicker: unknown; // Pass ticker data from parent
  onPriceClick?: (price: number, type: "bid" | "ask") => void;
}

export default function OrderBook({
  instrumentName,
  selectedPair,
  liveTicker,
  onPriceClick,
}: OrderBookProps) {
  const [orderBookData, setOrderBookData] = useState<OrderBookData>({
    bids: [],
    asks: [],
    lastUpdated: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPrice, setCurrentPrice] = useState<number>(0);

  // Format number with appropriate decimal places
  const formatPrice = (price: number): string => {
    if (price >= 1000) {
      return price.toLocaleString(undefined, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      });
    }
    return price.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatSize = (size: number): string => {
    return size.toLocaleString(undefined, {
      minimumFractionDigits: 5,
      maximumFractionDigits: 5,
    });
  };

  const formatTotal = (total: number): string => {
    return total.toLocaleString(undefined, {
      minimumFractionDigits: 5,
      maximumFractionDigits: 5,
    });
  };

  // Process ticker data to create mock orderbook data based on available ticker info
  const processTickerData = (tickerData: unknown): OrderBookData => {
    if (!tickerData?.instrument_ticker) {
      return { bids: [], asks: [], lastUpdated: Date.now() };
    }

    const ticker = tickerData.instrument_ticker;
    const markPrice = parseFloat(ticker.mark_price || "0");
    const bestBidPrice = parseFloat(ticker.best_bid_price || "0");
    const bestAskPrice = parseFloat(ticker.best_ask_price || "0");
    const bestBidAmount = parseFloat(ticker.best_bid_amount || "0");
    const bestAskAmount = parseFloat(ticker.best_ask_amount || "0");

    // Create mock orderbook data based on ticker information
    const bids: OrderBookEntry[] = [];
    const asks: OrderBookEntry[] = [];

    if (bestBidPrice > 0 && bestAskPrice > 0) {
      // Generate mock bid levels around best bid
      let bidTotal = 0;
      for (let i = 0; i < 10; i++) {
        const price = bestBidPrice - i * (bestBidPrice * 0.0001); // 0.01% steps down
        const size = (bestBidAmount || 0.1) * (0.5 + Math.random() * 1.0); // Vary size
        bidTotal += size;

        bids.push({
          price,
          size,
          total: bidTotal,
        });
      }

      // Generate mock ask levels around best ask
      let askTotal = 0;
      for (let i = 9; i >= 0; i--) {
        const price = bestAskPrice + i * (bestAskPrice * 0.0001); // 0.01% steps up
        const size = (bestAskAmount || 0.1) * (0.5 + Math.random() * 1.0); // Vary size
        askTotal += size;

        asks.push({
          price,
          size,
          total: askTotal,
        });
      }
    } else if (markPrice > 0) {
      // Fallback to mark price if bid/ask not available
      const spread = markPrice * 0.001; // 0.1% spread

      let bidTotal = 0;
      for (let i = 0; i < 10; i++) {
        const price = markPrice - spread / 2 - i * (markPrice * 0.0001);
        const size = 0.05 + Math.random() * 0.2;
        bidTotal += size;

        bids.push({
          price,
          size,
          total: bidTotal,
        });
      }

      let askTotal = 0;
      for (let i = 9; i >= 0; i--) {
        const price = markPrice + spread / 2 + i * (markPrice * 0.0001);
        const size = 0.05 + Math.random() * 0.2;
        askTotal += size;

        asks.push({
          price,
          size,
          total: askTotal,
        });
      }
    }

    return {
      bids,
      asks,
      lastUpdated: Date.now(),
    };
  };

  // Process ticker data from parent component
  useEffect(() => {
    if (liveTicker) {
      try {
        setError(null);
        const processedData = processTickerData(liveTicker);
        setOrderBookData(processedData);

        // Set current price from ticker
        if (liveTicker?.instrument_ticker?.mark_price) {
          setCurrentPrice(Number(liveTicker.instrument_ticker.mark_price));
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Failed to process ticker data:", error);
        setError("Failed to process live data");
        setIsLoading(false);
      }
    } else {
      // If no ticker data yet, keep loading
      setIsLoading(true);
    }
  }, [liveTicker]);

  // Debug: Log when onPriceClick is received
  useEffect(() => {
    console.log(
      "OrderBook onPriceClick callback:",
      onPriceClick ? "provided" : "not provided",
    );
  }, [onPriceClick]);

  // Calculate the maximum total for bar width calculation
  const maxTotal = Math.max(
    ...orderBookData.bids.map((b) => b.total),
    ...orderBookData.asks.map((a) => a.total),
    1, // Prevent division by zero
  );

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-baseDark rounded-xl border border-neutral-100 dark:border-neutral-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Book</h3>
          <div className="text-xs text-neutral-500">Loading...</div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-baseDark rounded-xl border border-neutral-100 dark:border-neutral-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Book</h3>
          <div className="text-xs text-red-500">{error}</div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-sm text-neutral-500 text-center">
            <div className="mb-2">Failed to load orderbook data</div>
            <div className="text-xs">Check your connection and try again</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-baseDark rounded-xl border border-neutral-100 dark:border-neutral-700 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Book</h3>
        <div className="flex items-center space-x-2">
          <div className="text-xs text-neutral-500">{selectedPair}</div>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        </div>
      </div>

      {/* Column Headers */}
      <div className="flex items-center justify-between mb-2 px-2">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-medium text-neutral-500">Price</span>
          <button className="w-6 h-6 flex items-center justify-center border border-neutral-300 dark:border-neutral-600 rounded text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800">
            —
          </button>
          <button className="w-6 h-6 flex items-center justify-center border border-neutral-300 dark:border-neutral-600 rounded text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800">
            +
          </button>
        </div>
        <div className="flex items-center space-x-8">
          <span className="text-xs font-medium text-neutral-500">Size</span>
          <span className="text-xs font-medium text-neutral-500">Total</span>
        </div>
      </div>

      {/* Order Book Content */}
      <div className="space-y-0 max-h-64 overflow-y-auto">
        {/* Asks (Sell Orders) - Red */}
        <div className="space-y-0">
          {orderBookData.asks.map((ask, index) => (
            <div
              key={`ask-${ask.price}-${index}`}
              className="relative flex items-center justify-between text-xs py-1 px-2 hover:bg-neutral-50 dark:hover:bg-neutral-800/20 cursor-pointer"
              onClick={() => {
                console.log(
                  "Ask clicked:",
                  ask.price,
                  "onPriceClick available:",
                  !!onPriceClick,
                );
                onPriceClick?.(ask.price, "ask");
              }}
            >
              <div className="text-red-500 font-medium relative z-10">
                ${formatPrice(ask.price)}
              </div>
              <div className="flex items-center space-x-6 relative z-10">
                <span>{formatSize(ask.size)}</span>
                <span>{formatTotal(ask.total)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Current Price */}
        <div className="py-3 px-2 text-center border-y border-neutral-200 dark:border-neutral-700 my-2">
          <div className="text-lg font-semibold">
            ${formatPrice(currentPrice)}
          </div>
        </div>

        {/* Bids (Buy Orders) - Green */}
        <div className="space-y-0">
          {orderBookData.bids.map((bid, index) => (
            <div
              key={`bid-${bid.price}-${index}`}
              className="relative flex items-center justify-between text-xs py-1 px-2 hover:bg-neutral-50 dark:hover:bg-neutral-800/20 cursor-pointer"
              onClick={() => {
                console.log(
                  "Bid clicked:",
                  bid.price,
                  "onPriceClick available:",
                  !!onPriceClick,
                );
                onPriceClick?.(bid.price, "bid");
              }}
            >
              <div className="text-green-500 font-medium relative z-10">
                ${formatPrice(bid.price)}
              </div>
              <div className="flex items-center space-x-6 relative z-10">
                <span>{formatSize(bid.size)}</span>
                <span>{formatTotal(bid.total)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer with last update time */}
      <div className="mt-4 pt-2 border-t border-neutral-200 dark:border-neutral-700">
        <div className="text-xs text-neutral-500 text-center">
          Last updated:{" "}
          {new Date(orderBookData.lastUpdated).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}
