"use client";

import { useNetwork } from "@/app/context/network-context";
// import { ARBITRUM_NETWORK } from "@/app/lib/constants";
import {
  fetchOptionChainData,
  deriveAPI,
  fetchInstrumentStatistics,
  subscribeToOptionChainUpdates,
  unsubscribeFromOptionChainUpdates,
  clearOptionCache,
} from "@/app/lib/derive-api";
import FutureDropdown from "@/app/ui/future/future-dropdown";
// import OptionSlider from "@/app/ui/options/option-slider";
import PositionsSection from "@/app/ui/options/positions-section";
import { CaretDown, Plus, PlusSquare, X } from "@phosphor-icons/react";
import { TrendDown, TrendUp } from "@phosphor-icons/react/dist/ssr";
import axios from "axios";
import { useWeb3React } from "@web3-react/core";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import PriceBox from "@/app/ui/components/price-box";
import React from "react";
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

type OptionType = "All" | "Calls" | "Puts";

// Update DateOption to be dynamic string type
type DateOption = string;
type GreekOption = "Delta" | "Mark Price" | "Gamma" | "Vega" | "Theta";

// Function to parse date from instrument name (e.g., "ETH-20250718-2800-C.1000" -> "2025-07-18")
const parseInstrumentDate = (instrumentName: string): string => {
  const match = instrumentName.match(/(\d{4})(\d{2})(\d{2})/);
  if (!match) return "";
  const [_, year, month, day] = match;
  return `${year}-${month}-${day}`;
};

// Function to format date for display (e.g., "2025-07-18" -> "18 Jul")
const formatDateForDisplay = (dateStr: string): string => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { day: "2-digit", month: "short" });
};

// Helper function to determine if an option is a call or put based on instrument name
const isCallOption = (instrumentName: string): boolean => {
  return instrumentName.endsWith("C");
};

const isPutOption = (instrumentName: string): boolean => {
  return instrumentName.endsWith("P");
};

// Function to group options by strike price and separate calls/puts
const groupOptionsByStrike = (optionChainData: OptionData[]) => {
  const groupedOptions: {
    [strike: number]: { call?: OptionData; put?: OptionData };
  } = {};

  optionChainData.forEach((option) => {
    const strike = option.strike;
    const instrumentName = option.instrument?.instrument_name || "";

    if (!groupedOptions[strike]) {
      groupedOptions[strike] = {};
    }

    if (isCallOption(instrumentName)) {
      groupedOptions[strike].call = option;
    } else if (isPutOption(instrumentName)) {
      groupedOptions[strike].put = option;
    }
  });

  return groupedOptions;
};

// Function to filter grouped options based on selected option type
const filterGroupedOptions = (
  groupedOptions: { [strike: number]: { call?: OptionData; put?: OptionData } },
  selectedOption: OptionType,
) => {
  const strikes = Object.keys(groupedOptions)
    .map(Number)
    .sort((a, b) => a - b);

  return strikes
    .filter((strike) => {
      const { call, put } = groupedOptions[strike];

      switch (selectedOption) {
        case "Calls":
          return call !== undefined;
        case "Puts":
          return put !== undefined;
        case "All":
        default:
          return call !== undefined || put !== undefined;
      }
    })
    .map((strike) => ({
      strike,
      call: groupedOptions[strike].call,
      put: groupedOptions[strike].put,
    }));
};

// Function to get sorted unique dates from option chain data
const getUniqueDates = (optionChainData: OptionData[]): string[] => {
  const dates = new Set<string>();
  console.log("Processing option chain data:", optionChainData.length, "items"); // Debug log
  optionChainData.forEach((data: any, index: number) => {
    if (data.instrument?.instrument_name) {
      const date = parseInstrumentDate(data.instrument.instrument_name);
      if (date) {
        dates.add(date);
        if (index < 3)
          console.log(
            "Sample instrument:",
            data.instrument.instrument_name,
            "-> date:",
            date,
          ); // Debug log
      }
    }
  });
  const sortedDates = Array.from(dates).sort();
  console.log("Unique dates found:", sortedDates); // Debug log
  return sortedDates;
};

// Function to filter option chain data by selected date
const filterOptionsByDate = (
  optionChainData: OptionData[],
  selectedDate: string,
): OptionData[] => {
  if (!selectedDate) return optionChainData;

  return optionChainData.filter((option: any) => {
    if (option.instrument?.instrument_name) {
      const instrumentDate = parseInstrumentDate(
        option.instrument.instrument_name,
      );
      return instrumentDate === selectedDate;
    }
    return false;
  });
};

export default function Page() {
  const { account, library } = useWeb3React();
  const { currentNetwork } = useNetwork();

  const pairOptions: Option[] = [
    { value: "ETH", label: "ETH/USD", icon: "/eth-icon.svg" },
    { value: "BTC", label: "BTC/USD", icon: "/btc-icon.svg" },
  ];

  const [selectedOption, setSelectedOption] = useState<OptionType>("All");
  const [selectedDate, setSelectedDate] = useState<DateOption>("");
  const [availableDates, setAvailableDates] = useState<DateOption[]>([]);
  const [selectedGreeks, setSelectedGreeks] = useState<GreekOption[]>([
    "Delta",
    "Mark Price",
  ]);

  // Add state for dropdown
  const [showNextMonthDropdown, setShowNextMonthDropdown] = useState(false);
  const [filteredOptionData, setFilteredOptionData] = useState<OptionData[]>(
    [],
  );
  // Add state for grouped options by strike
  const [groupedFilteredOptions, setGroupedFilteredOptions] = useState<
    { strike: number; call?: OptionData; put?: OptionData }[]
  >([]);

  // Add state to track price box position (calculated once when data changes)
  const [priceBoxPosition, setPriceBoxPosition] = useState<{
    insertAfterIndex: number;
    insertBeforeFirst: boolean;
    price: string;
  } | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Add state for option chain data
  const [optionChainData, setOptionChainData] = useState<OptionData[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState<boolean>(true);
  const [isRefreshingData, setIsRefreshingData] = useState<boolean>(false);
  const [optionDataError, setOptionDataError] = useState<string | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [isPersistentSubscriptionActive, setIsPersistentSubscriptionActive] =
    useState(false);

  // Option subscription ref
  const currentOptionSubscription = useRef<string | null>(null);

  const optionTypes: OptionType[] = ["All", "Calls", "Puts"];
  const greekOptions: GreekOption[] = [
    "Delta",
    "Mark Price",
    "Gamma",
    "Vega",
    "Theta",
  ];

  const orderTypeOptions: Option[] = [
    { value: "Limit", label: "Limit" },
    { value: "RFQ", label: "RFQ" },
  ];

  const [selectedPair, setSelectedPair] = useState<Option>(pairOptions[0]);
  const selectedPairRef = useRef(selectedPair);
  const [marketPrice, setMarketPrice] = useState<number>(1);
  const [statistics, setStatistics] = useState<unknown>({
    daily_notional_volume: "0",
    daily_trades: 0,
    open_interest: "0",
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  const [selectedOrderType, setSelectedOrderType] = useState<Option>(
    orderTypeOptions[0],
  );
  // const [leverageValue, setLeverageValue] = useState<number>(50);

  const handleOptionChange = (option: OptionType) => {
    setSelectedOption(option);
  };

  const handleDateChange = (date: DateOption) => {
    setSelectedDate(date);
  };

  const handleGreekChange = (greek: GreekOption) => {
    setSelectedGreeks((prev) =>
      prev.includes(greek) ? prev.filter((g) => g !== greek) : [...prev, greek],
    );
  };

  // Handle clicking on bid/ask prices to update sidebar
  const handleOptionPriceClick = (
    option: OptionData,
    type: "call" | "put",
    action: "buy" | "sell",
    price: number,
  ) => {
    setSelectedOptionData({
      option,
      type,
      action,
      price,
    });

    // Pre-fill the limit price with the clicked price
    setLimitPrice(price.toFixed(1));

    // Clear any existing errors when user selects a new option
    setFormErrors({});
    setShowValidationErrors(false);
    setOrderFeedback({ type: null, message: "" });

    // Set default size if not already set
    if (!size) {
      setSize("1");
    }

    // Ensure order type is set to limit when clicking prices
    if (selectedOrderType.value !== "Limit") {
      setSelectedOrderType(orderTypeOptions[0]); // Limit is the first option
    }
  };

  const date = new Date();
  const today =
    date.getFullYear() +
    "-" +
    String(date.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(date.getDate()).padStart(2, "0");

  const currentPrice = 2417.75;

  // Function to load option chain data
  const loadOptionChainData = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setIsRefreshingData(true);
      } else {
        setIsLoadingOptions(true);
        setOptionDataError(null);
        setOptionChainData([]); // Only clear data on initial load
      }

      // Set a timeout for the entire operation
      const timeoutId = setTimeout(() => {
        if (!isRefresh) {
          setOptionDataError("Connection timeout - Please try again");
          setIsLoadingOptions(false);
        } else {
          setIsRefreshingData(false);
          console.warn("Refresh timeout - will retry in next cycle");
        }
      }, 45000); // 45 second timeout

      try {
        // Pass isRefresh to getOptionChainData
        const data = await fetchOptionChainData(selectedPair.value, isRefresh);
        clearTimeout(timeoutId);

        // Get unique dates from the data
        const dates = getUniqueDates(data);
        console.log("Available dates:", dates); // Debug log
        setAvailableDates(dates);

        // If no date is selected, select the earliest available date
        if (!selectedDate && dates.length > 0) {
          console.log("Setting selected date to:", dates[0]); // Debug log
          setSelectedDate(dates[0]);
        }

        setOptionChainData(data);
        setLastUpdateTime(new Date());

        if (data.length === 0 && !isRefresh) {
          setOptionDataError(
            `No option data available for ${selectedPair.value}`,
          );
        } else if (data.length > 0) {
          // Clear any previous errors if we successfully get data
          setOptionDataError(null);
        }
      } catch (error) {
        clearTimeout(timeoutId);
        console.error("Failed to load option chain data:", error);

        // For refresh errors, don't break the UI - just log
        if (isRefresh) {
          console.warn("Refresh failed, keeping existing data:", error);
        } else {
          // Better error messages based on error type
          let errorMessage = "Failed to connect to live data";
          if (error instanceof Error) {
            if (error.message.includes("timeout")) {
              errorMessage = "Connection timed out - please try again";
            } else if (error.message.includes("Rate limit")) {
              errorMessage = "Too many requests - please wait a moment";
            } else {
              errorMessage = error.message;
            }
          }

          setOptionDataError(errorMessage);
          setOptionChainData([]); // Ensure no stale data
        }
      } finally {
        if (isRefresh) {
          setIsRefreshingData(false);
        } else {
          setIsLoadingOptions(false);
        }
      }
    },
    [selectedPair.value, selectedDate],
  );

  const fetchStatistics = async (retryCount = 0) => {
    try {
      setIsLoadingStats(true);
      setStatsError(null);
      console.log("Fetching stats for pair:", selectedPair.value);
      const stats = await fetchInstrumentStatistics(
        "OPTION",
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
  };

  // Add useEffect to fetch statistics periodically
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const initializeStats = async () => {
      await fetchStatistics();
      // Only start periodic updates if we don't have an error
      if (!statsError) {
        intervalId = setInterval(() => fetchStatistics(), 10000);
      }
    };

    initializeStats();

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [selectedPair]);

  // const tableRef = useRef<HTMLDivElement>(null);
  // const [labelPosition, setLabelPosition] = useState<number>(0);

  const [size, setSize] = useState<string | undefined>(undefined);
  const [limitPrice, setLimitPrice] = useState<string | undefined>(undefined);

  // Selected option state for sidebar
  const [selectedOptionData, setSelectedOptionData] = useState<{
    option: OptionData;
    type: "call" | "put";
    action: "buy" | "sell";
    price: number;
  } | null>(null);

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

  // const updateLabelPosition = () => {
  //   if (tableRef.current) {
  //     const lowerStrike = Math.floor(currentPrice / 100) * 100;
  //     const upperStrike = lowerStrike + 100;
  //     const position =
  //       (currentPrice - lowerStrike) / (upperStrike - lowerStrike);

  //     const rows = tableRef.current.querySelectorAll("tbody tr");
  //     const targetRow = Array.from(rows).find((row) => {
  //       const strike = parseInt(row.children[7].textContent || "0", 10);
  //       return strike <= currentPrice && currentPrice < strike + 100;
  //     });

  //     if (targetRow) {
  //       const rowRect = targetRow.getBoundingClientRect();
  //       const tableRect = tableRef.current.getBoundingClientRect();
  //       setLabelPosition(
  //         rowRect.top - tableRect.top + rowRect.height * position
  //       );
  //     }
  //   }
  // };

  // useEffect(() => {
  //   updateLabelPosition();
  //   window.addEventListener('resize', updateLabelPosition);
  //   return () => window.removeEventListener('resize', updateLabelPosition);
  // }, [currentPrice]);

  const getPriceFromAssetsArray = (
    tokenSymbol: string,
    assets: MuxPriceFetchingResponseObject[],
  ) => {
    tokenSymbol =
      tokenSymbol === "WETH" || tokenSymbol === "WBTC"
        ? tokenSymbol.substring(1)
        : tokenSymbol;
    for (const asset of assets) {
      if (asset.symbol === tokenSymbol) {
        return asset.price;
      }
    }
    return 1;
  };

  const getAssetPrice = async (assetName = selectedPairRef.current.value) => {
    const rsp = await axios.get("https://app.mux.network/api/liquidityAsset", {
      timeout: 10 * 1000,
    });

    const price = getPriceFromAssetsArray(assetName, rsp.data.assets);
    setMarketPrice(price);

    return price;
  };

  useEffect(() => {
    selectedPairRef.current = selectedPair;
  }, [selectedPair]);

  // Asset price polling for market price updates
  useEffect(() => {
    // Initial price fetch
    getAssetPrice().catch(console.error);

    // Set up polling for price updates (less aggressive than before)
    const intervalId = setInterval(() => {
      getAssetPrice().catch(console.error);
    }, 5000); // 5 second intervals instead of 1 second

    return () => {
      clearInterval(intervalId);
    };
  }, [selectedPair.value]);

  // Load option chain data on component mount and when selected pair changes
  useEffect(() => {
    // Add a small delay before initial connection to prevent rate limiting
    const timer = setTimeout(() => {
      loadOptionChainData(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [selectedPair, loadOptionChainData]);

  // Set up persistent option data subscriptions instead of polling
  useEffect(() => {
    // Only set up persistent subscription if we have initial data and no errors
    if (
      optionChainData.length > 0 &&
      !optionDataError &&
      !isLoadingOptions &&
      !isPersistentSubscriptionActive
    ) {
      console.log("🔔 Setting up persistent option data subscription...");

      const setupPersistentSubscription = async () => {
        try {
          await subscribeToOptionChainUpdates(
            selectedPair.value,
            (data: OptionData[]) => {
              console.log(
                "📊 Received persistent option data update:",
                data.length,
                "items",
              );
              setOptionChainData(data);
              setLastUpdateTime(new Date());
            },
          );

          setIsPersistentSubscriptionActive(true);
          console.log("✅ Persistent option subscription active");
        } catch (error) {
          console.error(
            "❌ Failed to set up persistent option subscription:",
            error,
          );
          // Fallback to manual refresh if persistent subscription fails
          console.log("🔄 Falling back to manual refresh...");
        }
      };

      setupPersistentSubscription();
    }

    return () => {
      // Cleanup will be handled in the main cleanup useEffect
    };
  }, [
    optionChainData.length,
    optionDataError,
    isLoadingOptions,
    isPersistentSubscriptionActive,
    selectedPair.value,
  ]);

  // Filter option data when selected date changes
  useEffect(() => {
    const filtered = filterOptionsByDate(optionChainData, selectedDate);
    setFilteredOptionData(filtered);

    // Group options by strike and filter by selected option type
    const grouped = groupOptionsByStrike(filtered);
    const groupedAndFiltered = filterGroupedOptions(grouped, selectedOption);
    setGroupedFilteredOptions(groupedAndFiltered);

    // Calculate price box position once when data changes (not on every price update)
    if (groupedAndFiltered.length > 0 && marketPrice > 0) {
      let insertAfterIndex = -1;
      let insertBeforeFirst = false;

      // Check if market price is lower than the first strike
      if (marketPrice < groupedAndFiltered[0].strike) {
        insertBeforeFirst = true;
      } else {
        // Find the correct position between strikes
        for (let i = 0; i < groupedAndFiltered.length - 1; i++) {
          const currentStrike = groupedAndFiltered[i].strike;
          const nextStrike = groupedAndFiltered[i + 1].strike;

          if (marketPrice >= currentStrike && marketPrice < nextStrike) {
            insertAfterIndex = i;
            break;
          }
        }

        // If not found between strikes, check if it should be after the last strike
        if (
          insertAfterIndex === -1 &&
          marketPrice >=
            groupedAndFiltered[groupedAndFiltered.length - 1].strike
        ) {
          insertAfterIndex = groupedAndFiltered.length - 1;
        }
      }

      // Store position and freeze the price used for display
      setPriceBoxPosition({
        insertAfterIndex,
        insertBeforeFirst,
        price: formatNumber(marketPrice, 2),
      });
    } else {
      setPriceBoxPosition(null);
    }
  }, [optionChainData, selectedDate, selectedOption, marketPrice]);

  // Click outside handler for dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowNextMonthDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cleanup subscriptions on component unmount
  useEffect(() => {
    return () => {
      console.log("🧹 Component unmounting, cleaning up all subscriptions...");

      // Clean up option subscriptions
      if (isPersistentSubscriptionActive) {
        unsubscribeFromOptionChainUpdates().catch(console.error);
      }
    };
  }, []); // Empty dependency array - only runs on unmount

  // Handle pair changes - clean up existing subscriptions and reset state
  useEffect(() => {
    const cleanup = async () => {
      if (isPersistentSubscriptionActive) {
        console.log(
          `🔄 Pair changed to ${selectedPair.value}, cleaning up old subscriptions...`,
        );
        try {
          await unsubscribeFromOptionChainUpdates();
          setIsPersistentSubscriptionActive(false);
          currentOptionSubscription.current = null;
          console.log("✅ Old subscriptions cleaned up");
        } catch (error) {
          console.error("❌ Error cleaning up old subscriptions:", error);
        }
      }
    };

    cleanup();
  }, [selectedPair.value]);

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
          setSize(undefined);
          setLimitPrice(undefined);
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
      // Handle real-time order status updates
      if (update.status === "filled" || update.status === "completed") {
        setOrderFeedback({
          type: "success",
          message: `Order ${update.orderId} has been filled`,
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

  // Real-time form validation
  useEffect(() => {
    const validateForm = async () => {
      if (!selectedOptionData || (!size && !limitPrice)) {
        setOrderValidation({ isValid: false, errors: {} });
        return;
      }

      try {
        const orderFormData: OrderFormData = {
          size: size || "0",
          limitPrice: limitPrice || "0",
          orderType: selectedOrderType.value === "Limit" ? "limit" : "market",
          direction: selectedOptionData.action,
          selectedOption: selectedOptionData.option,
          optionType: selectedOptionData.type,
        };

        // Create a mock wallet provider for validation
        const mockWalletProvider: WalletProvider = {
          address: "0x0000000000000000000000000000000000000000",
          signer: {} as unknown,
          isConnected: authState.isAuthenticated,
        };

        const validation = await orderService.validateOrder(
          orderFormData,
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
    size,
    limitPrice,
    selectedOptionData,
    selectedOrderType,
    authState.isAuthenticated,
  ]);

  // Clear feedback messages when user starts typing
  useEffect(() => {
    if (size || limitPrice) {
      if (orderFeedback.type === "error") {
        setOrderFeedback({ type: null, message: "" });
      }
      setShowValidationErrors(false);
    }
  }, [size, limitPrice]);

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
      console.log("Submitting order...");
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
  const prepareOrderForConfirmation = (): OrderFormData | null => {
    if (!selectedOptionData || !size) {
      return null;
    }

    return {
      size,
      limitPrice: limitPrice || "0",
      orderType: selectedOrderType.value === "Limit" ? "limit" : "market",
      direction: selectedOptionData.action,
      selectedOption: selectedOptionData.option,
      optionType: selectedOptionData.type,
    };
  };

  // Calculate order value for display
  const calculateOrderValue = (orderData: OrderFormData): number => {
    const sizeNum = parseFloat(orderData.size);
    const priceNum =
      orderData.orderType === "limit"
        ? parseFloat(orderData.limitPrice)
        : selectedOptionData?.price || 0;

    return sizeNum * priceNum;
  };

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

  return (
    <div className="flex flex-col lg:flex-row space-x-0 lg:space-x-5 text-base pt-8 px-3 xs:px-5 lg:px-6 custom-scrollbar text-baseBlack dark:text-baseWhite">
      <div className="w-full lg:w-[70%] mx-auto mb-6">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-2 gap-4">
          <div className="w-fit flex flex-col h-[4.5rem] border border-neutral-100 dark:border-neutral-700 rounded-xl px-2 py-2 font-semibold text-xl">
            <div className="text-neutral-500 text-xs font-medium mb-1">
              Select Pair
            </div>
            <div className="flex flex-row justify-between items-center">
              <FutureDropdown
                options={pairOptions}
                defaultValue={selectedPair}
                onChange={setSelectedPair}
              />
              <span className="text-green-500 ml-2 font-semibold">
                {marketPrice}
              </span>
              {/* <span className="text-sm text-green-500 ml-1">+1.09%</span> */}
            </div>
          </div>

          <div className="w-full xs:h-[4.5rem] flex flex-row flex-wrap xs:flex-nowrap justify-between px-6 py-2 xs:py-4 border border-neutral-100 dark:border-neutral-700 rounded-xl font-semibold">
            <div className="my-1.5 xs:my-0">
              <p className="text-neutral-500 text-xs">24H Volume</p>
              <p className="text-sm">
                {isLoadingStats ? (
                  <span className="text-neutral-400">Loading...</span>
                ) : statsError ? (
                  <span className="text-red-500 text-xs">{statsError}</span>
                ) : (
                  formatCurrency(statistics?.daily_notional_volume)
                )}
              </p>
            </div>
            <div className="col-span-2 my-1.5 xs:my-0">
              <p className="text-neutral-500 text-xs">Open Interest</p>
              <div className="flex items-center space-x-1">
                {isLoadingStats ? (
                  <span className="text-neutral-400">Loading...</span>
                ) : statsError ? (
                  <span className="text-red-500 text-xs">{statsError}</span>
                ) : (
                  <span className="text-sm">
                    {formatCurrency(statistics?.open_interest)}
                  </span>
                )}
              </div>
            </div>
            <div className="my-1.5 xs:my-0">
              <p className="text-neutral-500 text-xs">24H Trades</p>
              <p className="text-sm">
                {isLoadingStats ? (
                  <span className="text-neutral-400">Loading...</span>
                ) : statsError ? (
                  <span className="text-red-500 text-xs">{statsError}</span>
                ) : (
                  formatNumber(statistics?.daily_trades, 0)
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="py-4 rounded-lg mb-5">
          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-4 space-y-3.5 xl:space-y-0">
            <div className="flex flex-wrap gap-4 ml-1.5 text-base font-semibold">
              {optionTypes.map((option) => (
                <button
                  key={option}
                  onClick={() => handleOptionChange(option)}
                  className={`px-4 py-2 rounded-md ${
                    selectedOption === option
                      ? "bg-purpleBG-lighter dark:bg-baseDarkComplementary border border-purple"
                      : ""
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-4 items-center text-xs font-semibold">
              {greekOptions.map((greek) => (
                <label key={greek} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedGreeks.includes(greek)}
                    onChange={() => handleGreekChange(greek)}
                    className="sr-only"
                  />
                  <div
                    className={`w-5 h-5 rounded mr-2 flex items-center justify-center ${
                      selectedGreeks.includes(greek)
                        ? "bg-purple"
                        : "bg-white border border-baseBlack dark:border-baseWhite"
                    }`}
                  >
                    {selectedGreeks.includes(greek) && (
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M5 13l4 4L19 7"></path>
                      </svg>
                    )}
                  </div>
                  <span>{greek}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap sm:justify-between text-xs font-semibold">
            {/* Show first 6-7 dates as tabs */}
            {availableDates.slice(0, 6).map((date) => (
              <button
                key={date}
                onClick={() => handleDateChange(date)}
                className={`px-2.5 xl:px-5 ml-2.5 sm:ml-0 mt-2.5 sm:mt-0 py-2.5 rounded-md ${
                  selectedDate === date
                    ? "bg-purpleBG-lighter dark:bg-baseDarkComplementary border border-purple"
                    : "border border-neutral-300 dark:border-neutral-700"
                }`}
              >
                {formatDateForDisplay(date)}
              </button>
            ))}

            {/* More dates dropdown button - show if there are more than 6 dates */}
            {availableDates.length > 6 && (
              <div className="relative" ref={dropdownRef}>
                <button
                  className="px-2.5 py-2 ml-2.5 sm:ml-0 mt-2.5 sm:mt-0 rounded-lg text-xs font-semibold border border-neutral-300 dark:border-neutral-700 flex items-center"
                  onClick={() =>
                    setShowNextMonthDropdown(!showNextMonthDropdown)
                  }
                >
                  More dates
                  <CaretDown size={16} className="ml-2" />
                </button>

                {/* Dropdown menu with all available dates */}
                {showNextMonthDropdown && (
                  <div className="absolute top-full left-0 mt-1 bg-white dark:bg-baseDark border border-neutral-300 dark:border-neutral-700 rounded-md shadow-lg z-10 min-w-[150px] max-h-60 overflow-y-auto">
                    <div className="px-3 py-1 text-xs text-neutral-500 font-medium border-b border-neutral-200 dark:border-neutral-700">
                      All Available Dates:
                    </div>
                    {availableDates.map((date) => (
                      <button
                        key={date}
                        className={`w-full px-3 py-2 text-left text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800 ${
                          selectedDate === date
                            ? "bg-purpleBG-lighter dark:bg-baseDarkComplementary text-purple"
                            : ""
                        }`}
                        onClick={() => {
                          handleDateChange(date);
                          setShowNextMonthDropdown(false);
                        }}
                      >
                        {formatDateForDisplay(date)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Show message if no dates are available */}
            {availableDates.length === 0 && (
              <div className="text-neutral-500 text-xs py-2">
                Loading dates...
              </div>
            )}
          </div>
        </div>

        <div className="relative mb-2.5 w-full h-96">
          {/* Loading state */}
          {isLoadingOptions && (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple mb-4"></div>
              <div className="text-sm text-neutral-500 text-center">
                <div className="mb-2">Connecting to live option data...</div>
                <div className="text-xs">This may take up to 30 seconds</div>
              </div>
            </div>
          )}

          {/* Error message */}
          {!isLoadingOptions && optionDataError && (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-md max-w-md">
                <div className="text-sm text-red-800 dark:text-red-200 text-center">
                  <div className="font-semibold mb-2">Connection Error</div>
                  <div>{optionDataError}</div>
                </div>
              </div>
              <button
                onClick={() => loadOptionChainData(false)}
                className="px-4 py-2 bg-purple text-white rounded-md hover:bg-purple-600 transition-colors"
              >
                Retry Connection
              </button>
            </div>
          )}

          {/* Option chain table */}
          {!isLoadingOptions &&
            !optionDataError &&
            optionChainData.length > 0 && (
              <div className="overflow-auto max-w-full 2xl:w-full max-h-full">
                {/* Live data status */}
                {/* <div className="flex items-center justify-between mb-2 px-2 py-1 bg-gray-50 dark:bg-gray-800 rounded-md text-xs">
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-green-600 dark:text-green-400 font-medium">LIVE</span>
                  </div>
                  {isRefreshingData && (
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 border border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
                      <span className="text-blue-600">Updating...</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-neutral-500">
                    {lastUpdateTime && (
                      <span>Last update: {lastUpdateTime.toLocaleTimeString()}</span>
                    )}
                  </div>
                  <button
                    onClick={() => loadOptionChainData(true)}
                    disabled={isRefreshingData}
                    className="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-200 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Refresh data now"
                  >
                    {isRefreshingData ? '⟳' : '↻'} Refresh
                  </button>
                </div>
              </div> */}

                <table className="bg-white dark:bg-baseDark w-full">
                  <thead>
                    <tr className="text-base font-medium border border-neutral-100 dark:border-neutral-700">
                      <th className="py-3 px-6 text-center" colSpan={7}>
                        Calls
                      </th>
                      <th
                        className="py-3 text-center text-nowrap w-24"
                        colSpan={1}
                      >
                        {today}
                      </th>
                      <th className="py-3 px-6 text-center" colSpan={7}>
                        Puts
                      </th>
                    </tr>
                    <tr className="text-neutral-500 text-xs text-nowrap">
                      <th className="py-3 px-2 text-left border-b border-neutral-100 dark:border-neutral-700">
                        Delta
                      </th>
                      <th className="py-3 px-2 text-left border-b border-neutral-100 dark:border-neutral-700">
                        IV
                      </th>
                      <th className="py-3 px-2 text-left border-b border-neutral-100 dark:border-neutral-700">
                        Volume
                      </th>
                      <th className="py-3 px-2 text-left border-b border-neutral-100 dark:border-neutral-700">
                        Bid Size
                      </th>
                      <th className="py-3 px-2 text-left border-b border-neutral-100 dark:border-neutral-700">
                        Bid Price
                      </th>
                      <th className="py-3 px-2 text-left border-b border-neutral-100 dark:border-neutral-700">
                        Ask Price
                      </th>
                      <th className="py-3 px-2 text-left border-b border-neutral-100 dark:border-neutral-700">
                        Ask Size
                      </th>
                      <th className="py-3 px-5 text-center border-x border-neutral-100 dark:border-neutral-700 w-24">
                        Strike
                      </th>
                      <th className="py-3 px-2 text-left border-b border-neutral-100 dark:border-neutral-700">
                        Bid Size
                      </th>
                      <th className="py-3 px-2 text-left border-b border-neutral-100 dark:border-neutral-700">
                        Bid Price
                      </th>
                      <th className="py-3 px-2 text-left border-b border-neutral-100 dark:border-neutral-700">
                        Ask Price
                      </th>
                      <th className="py-3 px-2 text-left border-b border-neutral-100 dark:border-neutral-700">
                        Ask Size
                      </th>
                      <th className="py-3 px-2 text-left border-b border-neutral-100 dark:border-neutral-700">
                        Volume
                      </th>
                      <th className="py-3 px-2 text-left border-b border-neutral-100 dark:border-neutral-700">
                        IV
                      </th>
                      <th className="py-3 px-2 text-left border-b border-neutral-100 dark:border-neutral-700">
                        Delta
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-xs font-normal">
                    {groupedFilteredOptions.map(
                      ({ strike, call, put }, index: number) => {
                        // Use pre-calculated price box position instead of calculating on each render
                        const shouldInsertPriceBox =
                          priceBoxPosition?.insertAfterIndex === index;
                        const shouldInsertPriceBoxBefore =
                          priceBoxPosition?.insertBeforeFirst && index === 0;

                        return (
                          <React.Fragment key={strike}>
                            {/* Insert price box before first row if market price is below all strikes */}
                            {shouldInsertPriceBoxBefore && (
                              <PriceBox
                                symbol={selectedPair.value}
                                price={priceBoxPosition?.price || "-"}
                              />
                            )}
                            <tr
                              key={strike}
                              className={"transition-colors duration-500"}
                            >
                              {/* Calls section */}
                              <td className="py-3 px-2 text-left border-b border-neutral-100 dark:border-neutral-700">
                                {call ? call.delta.toFixed(5) : "-"}
                              </td>
                              <td className="py-3 px-2 text-left border-b border-neutral-100 dark:border-neutral-700">
                                {call ? call.iv.toFixed(2) : "-"}
                              </td>
                              <td className="py-3 px-2 text-left border-b border-neutral-100 dark:border-neutral-700">
                                {call ? call.volume.toFixed(0) : "-"}
                              </td>
                              <td className="py-3 px-2 text-left border-b border-neutral-100 dark:border-neutral-700">
                                {call ? call.bidSize.toFixed(2) : "-"}
                              </td>
                              <td
                                className={`py-3 px-2 text-left border-b border-neutral-100 dark:border-neutral-700 ${
                                  call
                                    ? "text-baseSecondary-500 hover:bg-baseSecondary-300 cursor-pointer"
                                    : ""
                                }`}
                                onClick={() =>
                                  call &&
                                  handleOptionPriceClick(
                                    call,
                                    "call",
                                    "sell",
                                    call.bidPrice,
                                  )
                                }
                              >
                                {call ? (
                                  <div className="flex flex-row justify-between">
                                    {call.bidPrice.toFixed(1)}
                                    <PlusSquare size={16} />
                                  </div>
                                ) : (
                                  "-"
                                )}
                              </td>
                              <td
                                className={`py-3 px-2 text-left border-b border-neutral-100 dark:border-neutral-700 ${
                                  call
                                    ? "text-baseSuccess-300 hover:bg-baseSuccess-100 cursor-pointer"
                                    : ""
                                }`}
                                onClick={() =>
                                  call &&
                                  handleOptionPriceClick(
                                    call,
                                    "call",
                                    "buy",
                                    call.askPrice,
                                  )
                                }
                              >
                                {call ? (
                                  <div className="flex flex-row justify-between">
                                    {call.askPrice.toFixed(1)}
                                    <PlusSquare size={16} />
                                  </div>
                                ) : (
                                  "-"
                                )}
                              </td>
                              <td className="py-3 px-2 text-left border-b border-neutral-100 dark:border-neutral-700">
                                {call ? call.askSize.toFixed(2) : "-"}
                              </td>

                              {/* Strike column */}
                              <td className="py-3 px-2 text-center border-x border-neutral-100 dark:border-neutral-700 font-medium w-24">
                                {strike}
                              </td>

                              {/* Puts section */}
                              <td className="py-3 px-2 text-left border-b border-neutral-100 dark:border-neutral-700">
                                {put ? put.bidSize.toFixed(2) : "-"}
                              </td>
                              <td
                                className={`py-3 px-2 text-left border-b border-neutral-100 dark:border-neutral-700 ${
                                  put
                                    ? "text-baseSecondary-500 hover:bg-baseSecondary-300 cursor-pointer"
                                    : ""
                                }`}
                                onClick={() =>
                                  put &&
                                  handleOptionPriceClick(
                                    put,
                                    "put",
                                    "sell",
                                    put.bidPrice,
                                  )
                                }
                              >
                                {put ? (
                                  <div className="flex flex-row justify-between">
                                    {put.bidPrice.toFixed(1)}
                                    <PlusSquare size={16} />
                                  </div>
                                ) : (
                                  "-"
                                )}
                              </td>
                              <td
                                className={`py-3 px-2 text-left border-b border-neutral-100 dark:border-neutral-700 ${
                                  put
                                    ? "text-baseSuccess-300 hover:bg-baseSuccess-100 cursor-pointer"
                                    : ""
                                }`}
                                onClick={() =>
                                  put &&
                                  handleOptionPriceClick(
                                    put,
                                    "put",
                                    "buy",
                                    put.askPrice,
                                  )
                                }
                              >
                                {put ? (
                                  <div className="flex flex-row justify-between">
                                    {put.askPrice.toFixed(1)}
                                    <PlusSquare size={16} />
                                  </div>
                                ) : (
                                  "-"
                                )}
                              </td>
                              <td className="py-3 px-2 text-left border-b border-neutral-100 dark:border-neutral-700">
                                {put ? put.askSize.toFixed(2) : "-"}
                              </td>
                              <td className="py-3 px-2 text-left border-b border-neutral-100 dark:border-neutral-700">
                                {put ? put.volume.toFixed(0) : "-"}
                              </td>
                              <td className="py-3 px-2 text-left border-b border-neutral-100 dark:border-neutral-700">
                                {put ? put.iv.toFixed(2) : "-"}
                              </td>
                              <td className="py-3 px-2 text-left border-b border-neutral-100 dark:border-neutral-700">
                                {put ? put.delta.toFixed(5) : "-"}
                              </td>
                            </tr>
                            {shouldInsertPriceBox && (
                              <PriceBox
                                symbol={selectedPair.value}
                                price={priceBoxPosition?.price || "-"}
                              />
                            )}
                          </React.Fragment>
                        );
                      },
                    )}
                  </tbody>
                </table>
                {/* <div
              className="absolute left-1/2 transform -translate-x-1/2 text-white top-10"
            >
              <div className="relative w-20 h-8 flex items-center justify-center bg-gradient-to-r from-gradient-1 to-gradient-2 rounded-md">
                <span className="relative text-white font-semibold text-xs z-10">
                  ETH {currentPrice.toFixed(1)}
                </span>
              </div>
            </div> */}
              </div>
            )}

          {/* Show message when no data is available */}
          {!isLoadingOptions &&
            optionChainData.length === 0 &&
            !optionDataError && (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="text-sm text-neutral-500 text-center">
                  <div className="mb-2">
                    No live option data available for {selectedPair.value}
                  </div>
                  <div className="text-xs">
                    Try selecting a different asset or check back later
                  </div>
                </div>
              </div>
            )}
        </div>

        <div>
          <PositionsSection />
        </div>
      </div>

      <div className="flex-none w-full lg:w-[30%] pb-9">
        <div className="bg-baseComplementary dark:bg-baseDarkComplementary p-2 px-3 pb-6 rounded-3xl w-full">
          <div className="ml-auto flex items-center justify-between py-2 mb-5">
            <div className="text-2xl font-normal">
              {selectedOptionData
                ? `${selectedOptionData.action === "buy" ? "Long" : "Short"} ${selectedOptionData.type === "call" ? "Call" : "Put"}`
                : "Long Call"}
            </div>
            <div className="flex flex-row items-center font-medium text-base p-2 bg-white dark:bg-baseDark rounded-md">
              <FutureDropdown
                options={orderTypeOptions}
                defaultValue={selectedOrderType}
                onChange={setSelectedOrderType}
              />
            </div>
          </div>

          <div className="bg-purple-100 rounded py-1 text-base font-semibold inline-block mb-4">
            {selectedOptionData
              ? `${selectedOptionData.type === "call" ? "Call" : "Put"} Options`
              : "Multiple Calls"}
            {/* <span className="px-2 inline-flex text-xs leading-4 font-medium rounded-md bg-purpleBG-lighter text-purple">
                Long
              </span> */}
          </div>

          {selectedOptionData && (
            <div className="flex flex-row justify-between mb-5">
              <div className="flex flex-row">
                <Image
                  src={selectedPair.icon || "/eth-icon.svg"}
                  width="24"
                  height="24"
                  alt="token"
                  className="ml-2"
                />
                <div className="flex flex-col ml-2">
                  <span className="text-xs font-semibold">
                    {selectedPair.value} ${selectedOptionData.option.strike}{" "}
                    {selectedOptionData.type === "call" ? "Call" : "Put"}
                  </span>
                  <span className="text-xs font-normal text-neutral-500">
                    {formatDateForDisplay(selectedDate)}
                  </span>
                </div>
              </div>
              <div className="flex flex-row mr-1">
                <span className="text-xs font-semibold mr-2">
                  ${selectedOptionData.price.toFixed(2)}
                </span>
                <X
                  size={14}
                  className="cursor-pointer"
                  onClick={() => setSelectedOptionData(null)}
                />
              </div>
            </div>
          )}

          {!selectedOptionData && (
            <div className="flex flex-row justify-between mb-5">
              <div className="flex flex-row">
                <Image
                  src="/eth-icon.svg"
                  width="24"
                  height="24"
                  alt="token"
                  className="ml-2"
                />
                <div className="flex flex-col ml-2">
                  <span className="text-xs font-semibold">BTC $53000 Call</span>
                  <span className="text-xs font-normal text-neutral-500">
                    Exp 13 sep
                  </span>
                </div>
              </div>
              <div className="flex flex-row mr-1">
                <span className="text-xs font-semibold mr-2">$4990.00</span>
                <X size={14} />
              </div>
            </div>
          )}

          <div className="mb-5">
            <button className="flex items-center bg-white dark:bg-baseDark mb-4 px-2 py-1 text-purple">
              <Plus size={20} />
              <span className="ml-1 text-xs font-semibold">Add Option</span>
            </button>
          </div>

          {/* Order feedback messages */}
          {orderFeedback.type && (
            <div
              className={`mb-4 p-3 rounded-md text-sm ${
                orderFeedback.type === "success"
                  ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border border-green-300 dark:border-green-700"
                  : "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border border-red-300 dark:border-red-700"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div
                    className={`w-2 h-2 rounded-full mr-2 ${
                      orderFeedback.type === "success"
                        ? "bg-green-500"
                        : "bg-red-500"
                    }`}
                  ></div>
                  <span className="font-medium">
                    {orderFeedback.type === "success" ? "Success" : "Error"}
                  </span>
                </div>
                <button
                  onClick={() => setOrderFeedback({ type: null, message: "" })}
                  className="text-current opacity-70 hover:opacity-100"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="mt-1">{orderFeedback.message}</div>
              {orderFeedback.orderId && (
                <div className="mt-1 text-xs opacity-75">
                  Order ID: {orderFeedback.orderId}
                </div>
              )}
            </div>
          )}

          {/* General error display */}
          {formErrors.general && showValidationErrors && (
            <div className="mb-4 p-3 rounded-md text-sm bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 border border-yellow-300 dark:border-yellow-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full mr-2 bg-yellow-500"></div>
                  <span className="font-medium">Warning</span>
                </div>
                <button
                  onClick={() => setShowValidationErrors(false)}
                  className="text-current opacity-70 hover:opacity-100"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="mt-1">{formErrors.general}</div>
            </div>
          )}

          {/* Authentication status */}
          {!authState.isAuthenticated && !authState.isAuthenticating && (
            <div className="mb-4 p-3 rounded-md text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border border-blue-300 dark:border-blue-700">
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full mr-2 bg-blue-500"></div>
                <span className="font-medium">Connect wallet to trade</span>
              </div>
            </div>
          )}

          {authState.isAuthenticating && (
            <div className="mb-4 p-3 rounded-md text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border border-blue-300 dark:border-blue-700">
              <div className="flex items-center">
                <div className="w-3 h-3 border border-blue-300 border-t-blue-600 rounded-full animate-spin mr-2"></div>
                <span className="font-medium">Authenticating...</span>
              </div>
            </div>
          )}

          <div className="flex justify-between my-5">
            <div className="text-xs">
              <span className="text-neutral-500">Avail: </span>
              <span>0.00 USDT</span>
            </div>
            {orderState.isSubmitting && (
              <div className="text-xs text-blue-600 dark:text-blue-400 flex items-center">
                <div className="w-3 h-3 border border-blue-300 border-t-blue-600 rounded-full animate-spin mr-1"></div>
                Submitting...
              </div>
            )}
          </div>

          {/* Size input with validation */}
          <div className="mb-5">
            <div
              className={`flex w-full rounded-xl bg-white dark:bg-baseDark py-2 pl-2 ${
                formErrors.size && showValidationErrors
                  ? "border-2 border-red-300 dark:border-red-700"
                  : ""
              }`}
            >
              <input
                type="number"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="w-full text-baseBlack dark:text-baseWhite dark:bg-baseDark text-sm font-normal outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="Size"
                min={0}
                disabled={orderState.isSubmitting}
              />
            </div>
            {formErrors.size && showValidationErrors && (
              <div className="text-xs text-red-600 dark:text-red-400 mt-1 ml-2">
                {formErrors.size}
              </div>
            )}
          </div>

          {/* Limit price input with validation */}
          <div className="mb-5">
            <div
              className={`flex w-full rounded-xl bg-white dark:bg-baseDark py-2 pl-2 ${
                formErrors.limitPrice && showValidationErrors
                  ? "border-2 border-red-300 dark:border-red-700"
                  : ""
              }`}
            >
              <input
                type="number"
                value={limitPrice}
                onChange={(e) => setLimitPrice(e.target.value)}
                className="w-full text-baseBlack dark:text-baseWhite dark:bg-baseDark text-sm font-normal outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="Limit Price"
                min={0}
                disabled={
                  orderState.isSubmitting || selectedOrderType.value !== "Limit"
                }
              />
            </div>
            {formErrors.limitPrice && showValidationErrors && (
              <div className="text-xs text-red-600 dark:text-red-400 mt-1 ml-2">
                {formErrors.limitPrice}
              </div>
            )}
          </div>

          <div className="flex text-xs my-5">
            <span className="text-neutral-500">Bid: </span>
            <span className="text-baseSuccess-300">
              $
              {selectedOptionData
                ? selectedOptionData.option.bidPrice.toFixed(1)
                : "335.8"}
            </span>
            <span className="text-neutral-500 ml-1">Ask: </span>
            <span className="text-baseSecondary-500">
              $
              {selectedOptionData
                ? selectedOptionData.option.askPrice.toFixed(1)
                : "346.8"}
            </span>
          </div>

          {/* <div className="flex justify-between items-center mb-5">
            <OptionSlider value={leverageValue} onChange={setLeverageValue} />
          </div> */}

          <div className="space-y-2 text-xs font-normal py-5 px-4 mb-5 border-y border-purpleBG-lighter dark:border-neutral-700">
            <div className="flex justify-between">
              <span>Min Received</span>
              <span>$215.70</span>
            </div>
            <div className="flex justify-between">
              <span>Fees</span>
              <span>-</span>
            </div>
            <div className="flex justify-between">
              <span>Mark Price</span>
              <span>$230.80</span>
            </div>
            <div className="flex justify-between">
              <span>Liquidation Price</span>
              <span>-</span>
            </div>
            <div className="flex justify-between">
              <span>Margin Required</span>
              <span>-</span>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={async () => {
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
                const orderData = prepareOrderForConfirmation();
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
              }}
              disabled={
                !orderValidation.isValid ||
                orderState.isSubmitting ||
                !selectedOptionData ||
                authState.isAuthenticating
              }
              className={`w-full py-2.5 px-5 rounded-md text-base font-semibold text-center transition-all duration-200 ${
                !orderValidation.isValid ||
                orderState.isSubmitting ||
                !selectedOptionData ||
                authState.isAuthenticating
                  ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                  : selectedOptionData?.action === "sell"
                    ? "bg-baseSecondary-500 text-white hover:bg-baseSecondary-600"
                    : "bg-baseSuccess-300 text-white hover:bg-baseSuccess-400"
              }`}
            >
              {orderState.isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Submitting...
                </div>
              ) : authState.isAuthenticating ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Authenticating...
                </div>
              ) : !authState.isAuthenticated ? (
                "Connect Wallet"
              ) : selectedOptionData?.action === "sell" ? (
                "Sell"
              ) : (
                "Buy"
              )}
            </button>
          </div>
        </div>

        {/* Order Confirmation Dialog */}
        {showOrderConfirmation && pendingOrderData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-baseDark rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Confirm Order</h3>
                <button
                  onClick={() => handleOrderConfirmation(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X size={20} />
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
                        {pendingOrderData.direction === "buy" ? "Buy" : "Sell"}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Option:
                      </span>
                      <span className="font-medium">
                        {selectedPair.value} $
                        {selectedOptionData?.option.strike}{" "}
                        {pendingOrderData.optionType === "call"
                          ? "Call"
                          : "Put"}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Expiry:
                      </span>
                      <span className="font-medium">
                        {formatDateForDisplay(selectedDate)}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Size:
                      </span>
                      <span className="font-medium">
                        {pendingOrderData.size}
                      </span>
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
                        Options trading involves significant risk. You may lose
                        your entire investment. Please ensure you understand the
                        risks before proceeding.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Current Market Info */}
                {selectedOptionData && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <div className="text-sm">
                      <div className="font-medium mb-2">Current Market</div>
                      <div className="flex justify-between">
                        <span>
                          Bid:{" "}
                          <span className="text-green-600 dark:text-green-400">
                            $
                            {selectedOptionData.option.bidPrice?.toFixed(2) ||
                              "N/A"}
                          </span>
                        </span>
                        <span>
                          Ask:{" "}
                          <span className="text-red-600 dark:text-red-400">
                            $
                            {selectedOptionData.option.askPrice?.toFixed(2) ||
                              "N/A"}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                )}
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
                        ? "bg-baseSecondary-500 hover:bg-baseSecondary-600"
                        : "bg-baseSuccess-300 hover:bg-baseSuccess-400"
                  }`}
                >
                  {orderState.isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Submitting...
                    </div>
                  ) : (
                    `Confirm ${pendingOrderData.direction === "buy" ? "Buy" : "Sell"}`
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
