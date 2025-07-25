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
  const { library } = useWeb3React();
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

  // Handle price click from orderbook
  const handlePriceClick = useCallback((price: number, type: "bid" | "ask") => {
    console.log(`handlePriceClick called with ${type} price: ${price}`);
    setSelectedPrice(price);
  }, []);

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
          />
        </div>
      </div>
    </div>
  );
}
