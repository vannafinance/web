"use client";

import { useNetwork } from "@/app/context/network-context";
import {
  ARBITRUM_NETWORK,
  BASE_NETWORK,
  OPTIMISM_NETWORK,
} from "@/app/lib/constants";
import FutureDropdown from "@/app/ui/future/future-dropdown";
import PositionOpenClose from "@/app/ui/future/position-open-close";
import PositionsSection from "@/app/ui/future/positions-section";
import TradingViewChart from "@/app/ui/future/trading-view-chart";
import OrderBook from "@/app/ui/future/orderbook";
import axios from "axios";
import { Contract } from "ethers";
import { useWeb3React } from "@web3-react/core";
import { useCallback, useEffect, useRef, useState } from "react";
import { opAddressList } from "@/app/lib/web3-constants";
import OpMarkPrice from "../../abi/vanna/v1/out/OpMarkPrice.sol/OpMarkPrice.json";
import OpIndexPrice from "../../abi/vanna/v1/out/OpIndexPrice.sol/OpIndexPrice.json";
import { ceilWithPrecision } from "@/app/lib/helper";
import {
  subscribeToFuturesTicker,
  getFuturesInstrumentName,
  fetchInstrumentStatistics,
} from "@/app/lib/derive-api";
import {
  orderService,
  type OrderFormData,
  type OrderState,
  type OrderValidation,
  type OrderResult,
  type OrderStatusUpdate,
} from "@/app/lib/order-service";
import {
  authenticationService,
  type AuthenticationState,
  type WalletProvider,
} from "@/app/lib/authentication-service";
import OrderStatusDisplay from "@/app/ui/components/order-status-display";

// Move these outside the component to prevent recreation on every render
const pairOptions: Option[] = [
  { value: "ETH", label: "ETH", icon: "/eth-icon.svg" },
  { value: "BTC", label: "BTC", icon: "/btc-icon.svg" },
];

const networkOptionsMap: { [key: string]: Option[] } = {
  [BASE_NETWORK]: [{ value: "Avantisfi", label: "Avantisfi" }],
  [ARBITRUM_NETWORK]: [{ value: "MUX", label: "MUX" }],
  [OPTIMISM_NETWORK]: [{ value: "Perp", label: "Perp" }],
};

export default function Page() {
  const { account, library } = useWeb3React();
  const { currentNetwork } = useNetwork();

  const [dataFetching, setDataFetching] = useState(false);
  const [selectedPair, setSelectedPair] = useState<Option>(pairOptions[0]);
  const selectedPairRef = useRef(selectedPair);
  const [protocolOptions, setProtocolOptions] = useState<Option[]>([
    { value: "Avantisfi", label: "Avantisfi" },
  ]);
  const [selectedProtocol, setSelectedProtocol] = useState<Option>(
    protocolOptions[0],
  );

  const [marketPrice, setMarketPrice] = useState<number>(1);
  const [indexPrice, setIndexPrice] = useState<string>("-");
  const [markPrice, setMarkPrice] = useState<string>("-");
  const [highLow, setHighLow] = useState<string>("-");
  const [fundingRate, setFundingRate] = useState<string>("-");
  // const [netRatePositive, setNetRatePositive] = useState<string>(
  //   ""
  // );
  // const [netRateNegative, setNetRateNegative] = useState<string>(
  //   ""
  // );
  const [openInterestPositive, setOpenInterestPositive] = useState<string>("-");
  const [openInterestNegative, setOpenInterestNegative] = useState<string>("");
  const [openInterestInPercentage, setOpenInterestInPercentage] =
    useState<string>("");
  const [volume, setVolume] = useState<string>("-");

  // Add state for live ticker data
  const [liveTicker, setLiveTicker] = useState<unknown>(null);
  const [statistics, setStatistics] = useState<unknown>({
    daily_notional_volume: "0",
    daily_trades: 0,
    open_interest: "0",
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  // Add state for selected price from orderbook
  const [selectedPrice, setSelectedPrice] = useState<number | null>(null);

  // Order state management
  const [orderState, setOrderState] = useState<OrderState>({
    isSubmitting: false,
  });
  const [orderValidation, setOrderValidation] = useState<OrderValidation>({
    isValid: false,
    errors: {},
  });
  const [authState, setAuthState] = useState<AuthenticationState>({
    isAuthenticated: false,
    isAuthenticating: false,
    session: null,
    lastError: null,
    retryCount: 0,
    recoveryActions: [],
  });

  // Order form validation state
  const [formErrors, setFormErrors] = useState<{
    size?: string;
    limitPrice?: string;
    general?: string;
  }>({});
  const [showValidationErrors, setShowValidationErrors] = useState(false);

  // Order confirmation dialog state
  const [showOrderConfirmation, setShowOrderConfirmation] = useState(false);
  const [pendingOrderData, setPendingOrderData] =
    useState<OrderFormData | null>(null);

  // Success/error feedback state
  const [orderFeedback, setOrderFeedback] = useState<{
    type: "success" | "error" | null;
    message: string;
    orderId?: string;
  }>({
    type: null,
    message: "",
  });

  // Real-time order status tracking
  const [recentOrderUpdates, setRecentOrderUpdates] = useState<
    OrderStatusUpdate[]
  >([]);
  const [showOrderHistory, setShowOrderHistory] = useState(false);

  // Order form state
  const [orderSize, setOrderSize] = useState<string>("");
  const [orderLimitPrice, setOrderLimitPrice] = useState<string>("");
  const [orderDirection, setOrderDirection] = useState<"buy" | "sell">("buy");

  // Handle price click from orderbook
  const handlePriceClick = useCallback(
    (price: number, type: "bid" | "ask") => {
      console.log(`handlePriceClick called with ${type} price: ${price}`);
      setSelectedPrice(price);

      // Auto-fill the order form with the clicked price
      setOrderLimitPrice(price.toFixed(2));

      // Set direction based on bid/ask
      // Clicking bid means you want to sell at that price
      // Clicking ask means you want to buy at that price
      setOrderDirection(type === "ask" ? "buy" : "sell");

      // Clear any existing errors when user selects a new price
      setFormErrors({});
      setShowValidationErrors(false);
      setOrderFeedback({ type: null, message: "" });

      // Set default size if not already set
      if (!orderSize) {
        setOrderSize("1");
      }
    },
    [orderSize],
  );

  const formatNumber = (
    value: string | number | undefined,
    decimals: number = 2,
  ): string => {
    if (!value) return "0";
    const num = typeof value === "string" ? parseFloat(value) : value;
    return num.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  const formatCurrency = (
    value: string | number | undefined,
    decimals: number = 2,
  ): string => {
    if (!value) return "$0";
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (num >= 1000000) {
      return `$${formatNumber(num / 1000000, decimals)}M`;
    } else if (num >= 1000) {
      return `$${formatNumber(num / 1000, decimals)}K`;
    }
    return `$${formatNumber(num, decimals)}`;
  };

  const formatPercentage = (
    value: string | number | undefined,
    decimals: number = 2,
  ): string => {
    if (!value) return "0%";
    const num = typeof value === "string" ? parseFloat(value) : value;
    const formattedNum = num.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      signDisplay: "exceptZero",
    });
    return `${formattedNum}%`;
  };

  const format24hChange = (value: string | number | undefined): string => {
    if (!value) return "0%";
    const num = typeof value === "string" ? parseFloat(value) : value;
    // Convert decimal to percentage by multiplying by 100
    return formatPercentage(num * 100, 3);
  };

  const formatFundingRate = (value: string | number | undefined): string => {
    if (!value) return "0%";
    const num = typeof value === "string" ? parseFloat(value) : value;
    // The funding rate comes as a decimal (e.g., 0.0000125 for 0.00125% per hour)
    // First convert to percentage (multiply by 100)
    // Then annualize by multiplying by hours in a year (8760)
    const annualizedRate = num * 100 * 8760;
    return formatPercentage(annualizedRate, 3);
  };

  // Handle order confirmation
  const handleOrderConfirmation = (confirmed: boolean) => {
    if (confirmed && pendingOrderData) {
      // Proceed with order submission
      submitOrderToService(pendingOrderData);
    }

    // Close dialog and clear pending data
    setShowOrderConfirmation(false);
    setPendingOrderData(null);
  };

  // Submit order to service
  const submitOrderToService = async (orderData: OrderFormData) => {
    try {
      // Create real wallet provider from useWeb3React
      if (!account || !library) {
        throw new Error("Wallet not connected");
      }

      const signer = library.getSigner();
      const walletProvider: WalletProvider = {
        address: account,
        signer: signer,
        isConnected: true,
      };

      // First authenticate with Derive API using the wallet
      console.log("Authenticating with Derive API...");
      try {
        await authenticationService.authenticate(walletProvider);
        console.log("Authentication successful");
      } catch (authError) {
        console.error("Authentication failed:", authError);
        throw new Error(
          `Authentication failed: ${authError instanceof Error ? authError.message : "Unknown error"}`,
        );
      }

      // Now submit the order
      console.log("Submitting futures order...");
      await orderService.submitOrder(orderData, walletProvider);
    } catch (error) {
      console.error("Order submission failed:", error);
      setOrderFeedback({
        type: "error",
        message:
          error instanceof Error ? error.message : "Order submission failed",
      });
    }
  };

  // Prepare order for confirmation
  const prepareFuturesOrderForConfirmation = (): OrderFormData | null => {
    if (!orderSize) {
      return null;
    }

    return {
      size: orderSize,
      limitPrice: orderLimitPrice || "0",
      orderType: "limit",
      direction: orderDirection,
      selectedOption: {
        strike: 0, // Not applicable for futures
        instrument: {
          instrument_name: getFuturesInstrumentName(selectedPair.value),
        },
      },
      optionType: "call", // Not applicable for futures, but required by interface
    };
  };

  // Calculate order value for display
  const calculateOrderValue = (orderData: OrderFormData): number => {
    const sizeNum = parseFloat(orderData.size);
    const priceNum =
      orderData.orderType === "limit"
        ? parseFloat(orderData.limitPrice)
        : liveTicker?.instrument_ticker?.mark_price
          ? Number(liveTicker.instrument_ticker.mark_price)
          : marketPrice;

    return sizeNum * priceNum;
  };

  // Handle order submission
  const handleOrderSubmit = async () => {
    // Simple wallet connection check
    if (!account || !library) {
      setFormErrors((prev) => ({
        ...prev,
        general: "Please connect your wallet to place orders",
      }));
      setShowValidationErrors(true);
      return;
    }

    // Prepare and show order confirmation
    const orderData = prepareFuturesOrderForConfirmation();
    if (orderData) {
      setPendingOrderData(orderData);
      setShowOrderConfirmation(true);
    } else {
      setFormErrors((prev) => ({
        ...prev,
        general: "Please fill in all required order details",
      }));
      setShowValidationErrors(true);
    }
  };

  const fetchStatistics = useCallback(
    async (retryCount = 0) => {
      try {
        setIsLoadingStats(true);
        setStatsError(null);
        console.log("Fetching stats for pair:", selectedPair.value);
        const stats = await fetchInstrumentStatistics(
          "PERP",
          selectedPair.value,
        );
        setStatistics(stats);
        setIsLoadingStats(false);
      } catch (error) {
        console.error("Failed to fetch statistics:", error);
        // Retry up to 3 times with exponential backoff
        if (retryCount < 3) {
          const delay = Math.pow(2, retryCount) * 1000;
          console.log(`Retrying in ${delay}ms...`);
          setTimeout(() => fetchStatistics(retryCount + 1), delay);
        } else {
          setStatsError("Failed to load statistics");
          setIsLoadingStats(false);
        }
      }
    },
    [selectedPair.value],
  );

  const fetchValues = useCallback(async () => {
    if (!currentNetwork) return;
    const signer = await library?.getSigner();

    let indexPriceContract;
    let markPriceContract;
    if (currentNetwork.id === ARBITRUM_NETWORK) {
    } else if (currentNetwork.id === OPTIMISM_NETWORK) {
      indexPriceContract = new Contract(
        opAddressList.indexPriceContractAddress,
        OpIndexPrice.abi,
        signer,
      );
      markPriceContract = new Contract(
        opAddressList.markPriceContractAddress,
        OpMarkPrice.abi,
        signer,
      );
    } else if (currentNetwork.id === BASE_NETWORK) {
    }

    if (!indexPriceContract || !markPriceContract) {
      return;
    }

    const pointOne = (marketPrice * 0.1) / 100;
    const indexPrice = Number(marketPrice) - Number(pointOne);
    const markPrice = Number(marketPrice);
    const fundingRate = ((markPrice - indexPrice) / (indexPrice / 3)) * 100;

    setIndexPrice(ceilWithPrecision(String(indexPrice), 2));
    setMarkPrice(ceilWithPrecision(String(markPrice), 2));
    setFundingRate(ceilWithPrecision(String(fundingRate)) + "%");
    setVolume("80,005.6");
  }, [currentNetwork, library, marketPrice]);

  useEffect(() => {
    fetchValues();
  }, [fetchValues]);

  useEffect(() => {
    const protocol = networkOptionsMap[currentNetwork?.id || ""] || [
      { value: "Avantisfi", label: "Avantisfi" },
    ];
    setProtocolOptions(protocol);
    setSelectedProtocol(protocol[0]);
  }, [currentNetwork]);

  useEffect(() => {
    selectedPairRef.current = selectedPair;
  }, [selectedPair]);

  useEffect(() => {
    // Subscribe to Derive futures ticker for the selected pair
    const instrumentName = getFuturesInstrumentName(selectedPair.value);

    let unsubscribed = false;
    subscribeToFuturesTicker(instrumentName, (data) => {
      if (!unsubscribed) {
        setLiveTicker(data);
      }
    });
    return () => {
      unsubscribed = true;
    };
  }, [selectedPair]);

  // Add useEffect to fetch statistics periodically
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const initializeStats = async () => {
      await fetchStatistics();
      // Only start periodic updates if we don't have an error
      intervalId = setInterval(() => fetchStatistics(), 10000);
    };

    initializeStats();

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [fetchStatistics]);

  // Order state management - subscribe to order service state changes
  useEffect(() => {
    const unsubscribeOrderState = orderService.onStateChange((newState) => {
      setOrderState(newState);

      // Handle order completion feedback
      if (newState.lastOrder) {
        if (newState.lastOrder.success) {
          setOrderFeedback({
            type: "success",
            message: `Order submitted successfully${newState.lastOrder.orderId ? ` (ID: ${newState.lastOrder.orderId})` : ""}`,
            orderId: newState.lastOrder.orderId,
          });

          // Clear form on successful order
          setOrderSize("");
          setOrderLimitPrice("");
          setFormErrors({});
          setShowValidationErrors(false);

          // Auto-hide success message after 5 seconds
          setTimeout(() => {
            setOrderFeedback({ type: null, message: "" });
          }, 5000);
        } else {
          setOrderFeedback({
            type: "error",
            message: newState.lastOrder.error || "Order submission failed",
          });

          // Auto-hide error message after 10 seconds
          setTimeout(() => {
            setOrderFeedback({ type: null, message: "" });
          }, 10000);
        }
      }

      // Update form validation errors
      if (newState.validationErrors) {
        setFormErrors({
          size: newState.validationErrors.size,
          limitPrice: newState.validationErrors.limitPrice,
          general:
            newState.validationErrors.authentication ||
            newState.validationErrors.network ||
            newState.validationErrors.balance ||
            newState.validationErrors.limits,
        });
        setShowValidationErrors(true);
      }
    });

    const unsubscribeOrderUpdates = orderService.onOrderUpdate((update) => {
      console.log("Order status update:", update);

      // Add to recent updates list (keep last 10 updates)
      setRecentOrderUpdates((prev) => {
        const newUpdates = [
          update,
          ...prev.filter((u) => u.orderId !== update.orderId),
        ];
        return newUpdates.slice(0, 10);
      });

      // Handle real-time order status updates
      if (update.status === "filled" || update.status === "completed") {
        setOrderFeedback({
          type: "success",
          message: `Order ${update.orderId} has been filled`,
          orderId: update.orderId,
        });
      } else if (update.status === "partially_filled") {
        setOrderFeedback({
          type: "success",
          message: `Order ${update.orderId} partially filled`,
          orderId: update.orderId,
        });
      } else if (
        update.status === "rejected" ||
        update.status === "cancelled"
      ) {
        setOrderFeedback({
          type: "error",
          message: `Order ${update.orderId} was ${update.status}`,
        });
      }
    });

    return () => {
      unsubscribeOrderState();
      unsubscribeOrderUpdates();
    };
  }, []);

  // Authentication state management - subscribe to auth service state changes
  useEffect(() => {
    const unsubscribeAuthState = authenticationService.onStateChange(
      (newAuthState) => {
        setAuthState(newAuthState);

        // Handle authentication errors
        if (newAuthState.lastError) {
          setFormErrors((prev) => ({
            ...prev,
            general: `Authentication error: ${newAuthState.lastError.message}`,
          }));
        }
      },
    );

    // Initialize with current auth state
    setAuthState(authenticationService.getState());

    return () => {
      unsubscribeAuthState();
    };
  }, []);

  // Wallet connection integration - sync with useWeb3React
  useEffect(() => {
    // Update auth state based on actual wallet connection
    if (account && library) {
      // Wallet is connected, update auth state to reflect this
      setAuthState((prev) => ({
        ...prev,
        isAuthenticated: true,
        session: {
          access_token: "mock_token",
          refresh_token: "mock_refresh",
          expires_at: Date.now() / 1000 + 3600, // 1 hour from now
          wallet_address: account,
          session_id: "mock_session",
        },
      }));
    } else {
      // Wallet is not connected, clear auth state
      setAuthState((prev) => ({
        ...prev,
        isAuthenticated: false,
        session: null,
      }));
    }
  }, [account, library]);

  // Real-time form validation for futures orders
  useEffect(() => {
    const validateForm = async () => {
      if (!orderSize && !orderLimitPrice) {
        setOrderValidation({ isValid: false, errors: {} });
        return;
      }

      try {
        // Create futures order data structure
        const futuresOrderData: OrderFormData = {
          size: orderSize || "0",
          limitPrice: orderLimitPrice || "0",
          orderType: "limit", // For futures, we'll use limit orders
          direction: orderDirection,
          selectedOption: {
            strike: 0, // Not applicable for futures
            instrument: {
              instrument_name: getFuturesInstrumentName(selectedPair.value),
            },
          },
          optionType: "call", // Not applicable for futures, but required by interface
        };

        // Create a mock wallet provider for validation
        const mockWalletProvider: WalletProvider = {
          address: account || "0x0000000000000000000000000000000000000000",
          signer: {} as unknown,
          isConnected: authState.isAuthenticated,
        };

        const validation = await orderService.validateOrder(
          futuresOrderData,
          mockWalletProvider,
        );
        setOrderValidation(validation);

        // Update form errors based on validation
        const newFormErrors: typeof formErrors = {};
        if (validation.errors.size) newFormErrors.size = validation.errors.size;
        if (validation.errors.limitPrice)
          newFormErrors.limitPrice = validation.errors.limitPrice;
        if (
          validation.errors.authentication ||
          validation.errors.network ||
          validation.errors.balance ||
          validation.errors.limits
        ) {
          newFormErrors.general =
            validation.errors.authentication ||
            validation.errors.network ||
            validation.errors.balance ||
            validation.errors.limits;
        }

        setFormErrors(newFormErrors);
      } catch (error) {
        console.error("Form validation error:", error);
        setOrderValidation({
          isValid: false,
          errors: { limits: "Validation failed" },
        });
      }
    };

    // Debounce validation to avoid excessive API calls
    const timeoutId = setTimeout(validateForm, 500);
    return () => clearTimeout(timeoutId);
  }, [
    orderSize,
    orderLimitPrice,
    orderDirection,
    selectedPair.value,
    authState.isAuthenticated,
    account,
  ]);

  // Clear feedback messages when user starts typing
  useEffect(() => {
    if (orderSize || orderLimitPrice) {
      if (orderFeedback.type === "error") {
        setOrderFeedback({ type: null, message: "" });
      }
      setShowValidationErrors(false);
    }
  }, [orderSize, orderLimitPrice]);

  return (
    <div className="flex flex-col lg:flex-row space-x-0 lg:space-x-5 text-base pt-4 px-2.5 md:px-5 lg:px-7 xl:px-10 text-baseBlack dark:text-baseWhite">
      <div className="w-full lg:w-[70%] mx-auto mb-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-2">
          <div className="flex flex-col border border-neutral-100 dark:border-neutral-700 rounded-xl px-2 py-2 font-semibold text-xl">
            <div className="text-neutral-500 text-xs font-medium mb-1">
              Select Pair
            </div>
            <div className="flex flex-row justify-between items-center">
              <FutureDropdown
                options={pairOptions}
                defaultValue={selectedPair}
                onChange={setSelectedPair}
              />
              <span className="text-green-500 font-semibold ml-2">
                {liveTicker?.instrument_ticker?.mark_price
                  ? Number(liveTicker.instrument_ticker.mark_price).toFixed(2)
                  : "-"}
              </span>
              {/* <span className="text-sm text-green-500 ml-1">+1.09%</span> */}
            </div>
          </div>
          <div className="ml-0 sm:ml-auto mt-2 sm:mt-0 flex flex-row sm:flex-col justify-between sm:justify-normal items-center border border-neutral-100 dark:border-neutral-700 rounded-xl px-2 py-2">
            <div className="text-neutral-500 text-xs font-semibold sm:mb-1">
              Chart protocol
            </div>
            <div className="flex flex-row items-center font-medium text-sm pl-1">
              <FutureDropdown
                options={protocolOptions}
                defaultValue={selectedProtocol}
                onChange={setSelectedProtocol}
                iconFill={true}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap justify-between gap-5 items-center text-sm p-5 border border-neutral-300 dark:border-neutral-700 rounded-xl font-semibold mb-2">
          <div>
            <p className="text-neutral-500 text-xs">ETH Price</p>
            <p className="text-sm">
              {liveTicker?.instrument_ticker?.mark_price
                ? Number(liveTicker.instrument_ticker.mark_price).toFixed(2)
                : "-"}
            </p>
          </div>
          <div>
            <p className="text-neutral-500 text-xs">24H Change</p>
            <p
              className={`text-sm ${
                parseFloat(
                  liveTicker?.instrument_ticker?.stats?.percent_change,
                ) > 0
                  ? "text-green-500"
                  : parseFloat(
                        liveTicker?.instrument_ticker?.stats?.percent_change,
                      ) < 0
                    ? "text-red-500"
                    : ""
              }`}
            >
              {format24hChange(
                liveTicker?.instrument_ticker?.stats?.percent_change,
              )}
            </p>
          </div>
          <div>
            <p className="text-neutral-500 text-xs">1Y Funding</p>
            <p
              className={`text-sm ${
                liveTicker?.instrument_ticker?.perp_details?.funding_rate > 0
                  ? "text-green-500"
                  : liveTicker?.instrument_ticker?.perp_details?.funding_rate <
                      0
                    ? "text-red-500"
                    : ""
              }`}
            >
              {formatFundingRate(
                liveTicker?.instrument_ticker?.perp_details?.funding_rate,
              )}
            </p>
          </div>
          <div className="col-span-2 sm:col-auto">
            <p className="text-neutral-500 text-xs">24H Volume</p>
            <div className="flex items-center space-x-1">
              {isLoadingStats ? (
                <span className="text-neutral-400">Loading...</span>
              ) : statsError ? (
                <span className="text-red-500 text-xs">{statsError}</span>
              ) : (
                <p className="text-sm">
                  {formatCurrency(statistics?.daily_notional_volume)}
                </p>
              )}
            </div>
          </div>
          <div className="col-span-2 sm:col-auto">
            <p className="text-neutral-500 text-xs">Open Interest</p>
            <div className="flex items-center space-x-1">
              {isLoadingStats ? (
                <span className="text-neutral-400">Loading...</span>
              ) : statsError ? (
                <span className="text-red-500 text-xs">{statsError}</span>
              ) : (
                <p className="text-green-500 text-sm">
                  {formatCurrency(statistics?.open_interest)}
                </p>
              )}
            </div>
          </div>
          <div>
            <p className="text-neutral-500 text-xs">24H Trades</p>
            {isLoadingStats ? (
              <span className="text-neutral-400">Loading...</span>
            ) : statsError ? (
              <span className="text-red-500 text-xs">{statsError}</span>
            ) : (
              <p className="text-sm">
                {formatNumber(statistics?.daily_trades, 0)}
              </p>
            )}
          </div>
        </div>

        <div className="h-[25rem] mb-5">
          <TradingViewChart />
        </div>

        <div>
          <PositionsSection dataFetching={dataFetching} />
        </div>
      </div>

      <div className="flex-none w-full lg:w-[30%] pb-9">
        <div className="space-y-4">
          <OrderBook
            instrumentName={getFuturesInstrumentName(selectedPair.value)}
            selectedPair={selectedPair.value}
            liveTicker={liveTicker}
            onPriceClick={handlePriceClick}
          />
          <PositionOpenClose
            market={selectedPair}
            setMarket={setSelectedPair}
            marketOption={pairOptions}
            setDataFetching={setDataFetching}
            selectedPrice={selectedPrice}
            orderState={orderState}
            orderValidation={orderValidation}
            authState={authState}
            formErrors={formErrors}
            showValidationErrors={showValidationErrors}
            orderFeedback={orderFeedback}
            recentOrderUpdates={recentOrderUpdates}
            showOrderHistory={showOrderHistory}
            setShowOrderHistory={setShowOrderHistory}
            orderSize={orderSize}
            setOrderSize={setOrderSize}
            orderLimitPrice={orderLimitPrice}
            setOrderLimitPrice={setOrderLimitPrice}
            orderDirection={orderDirection}
            setOrderDirection={setOrderDirection}
            onOrderSubmit={handleOrderSubmit}
            onClearFeedback={() =>
              setOrderFeedback({ type: null, message: "" })
            }
            onClearValidationErrors={() => setShowValidationErrors(false)}
          />
        </div>
      </div>

      {/* Order Confirmation Dialog */}
      {showOrderConfirmation && pendingOrderData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-baseDark rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Confirm Futures Order</h3>
              <button
                onClick={() => handleOrderConfirmation(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Order Summary */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h4 className="font-medium mb-3">Order Details</h4>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Action:
                    </span>
                    <span
                      className={`font-medium ${
                        pendingOrderData.direction === "buy"
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {pendingOrderData.direction === "buy" ? "Long" : "Short"}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Instrument:
                    </span>
                    <span className="font-medium">
                      {getFuturesInstrumentName(selectedPair.value)}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Size:
                    </span>
                    <span className="font-medium">{pendingOrderData.size}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Order Type:
                    </span>
                    <span className="font-medium capitalize">
                      {pendingOrderData.orderType}
                    </span>
                  </div>

                  {pendingOrderData.orderType === "limit" && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Limit Price:
                      </span>
                      <span className="font-medium">
                        ${pendingOrderData.limitPrice}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                    <span className="text-gray-600 dark:text-gray-400">
                      Estimated Value:
                    </span>
                    <span className="font-medium">
                      ${calculateOrderValue(pendingOrderData).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Risk Warning */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                <div className="flex items-start">
                  <div className="w-4 h-4 rounded-full bg-yellow-500 mt-0.5 mr-2 flex-shrink-0"></div>
                  <div className="text-sm text-yellow-800 dark:text-yellow-200">
                    <div className="font-medium mb-1">Risk Warning</div>
                    <div>
                      Futures trading involves significant risk and leverage.
                      You may lose more than your initial investment. Please
                      ensure you understand the risks before proceeding.
                    </div>
                  </div>
                </div>
              </div>

              {/* Current Market Info */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <div className="text-sm">
                  <div className="font-medium mb-2">Current Market</div>
                  <div className="flex justify-between">
                    <span>
                      Mark Price:{" "}
                      <span className="text-blue-600 dark:text-blue-400">
                        $
                        {liveTicker?.instrument_ticker?.mark_price
                          ? Number(
                              liveTicker.instrument_ticker.mark_price,
                            ).toFixed(2)
                          : marketPrice.toFixed(2)}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => handleOrderConfirmation(false)}
                className="flex-1 py-2.5 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleOrderConfirmation(true)}
                disabled={orderState.isSubmitting}
                className={`flex-1 py-2.5 px-4 rounded-md text-white font-medium transition-colors ${
                  orderState.isSubmitting
                    ? "bg-gray-400 cursor-not-allowed"
                    : pendingOrderData.direction === "sell"
                      ? "bg-red-500 hover:bg-red-600"
                      : "bg-green-500 hover:bg-green-600"
                }`}
              >
                {orderState.isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Submitting...
                  </div>
                ) : (
                  `Confirm ${pendingOrderData.direction === "buy" ? "Long" : "Short"}`
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
