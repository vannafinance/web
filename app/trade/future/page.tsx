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
import axios from "axios";
import { Contract } from "ethers";
import { useWeb3React } from "@web3-react/core";
import { useEffect, useRef, useState } from "react";
import { opAddressList } from "@/app/lib/web3-constants";
import OpMarkPrice from "../../abi/vanna/v1/out/OpMarkPrice.sol/OpMarkPrice.json";
import OpIndexPrice from "../../abi/vanna/v1/out/OpIndexPrice.sol/OpIndexPrice.json";
import { ceilWithPrecision } from "@/app/lib/helper";

export default function Page() {
  const { library } = useWeb3React();
  const { currentNetwork } = useNetwork();

  const pairOptions: Option[] = [
    { value: "ETH", label: "ETH", icon: "/eth-icon.svg" },
    { value: "BTC", label: "BTC", icon: "/btc-icon.svg" },
  ];

  const networkOptionsMap: { [key: string]: Option[] } = {
    [BASE_NETWORK]: [{ value: "Avantisfi", label: "Avantisfi" }],
    [ARBITRUM_NETWORK]: [{ value: "MUX", label: "MUX" }],
    [OPTIMISM_NETWORK]: [{ value: "Perp", label: "Perp" }],
  };

  const [dataFetching, setDataFetching] = useState(false);
  const [selectedPair, setSelectedPair] = useState<Option>(pairOptions[0]);
  const selectedPairRef = useRef(selectedPair);
  const [protocolOptions, setProtocolOptions] = useState<Option[]>([
    { value: "Avantisfi", label: "Avantisfi" },
  ]);
  const [selectedProtocol, setSelectedProtocol] = useState<Option>(
    protocolOptions[0]
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

  const fetchValues = async () => {
    if (!currentNetwork) return;
    const signer = await library?.getSigner();

    let indexPriceContract;
    let markPriceContract;
    if (currentNetwork.id === ARBITRUM_NETWORK) {
    } else if (currentNetwork.id === OPTIMISM_NETWORK) {
      indexPriceContract = new Contract(
        opAddressList.indexPriceContractAddress,
        OpIndexPrice.abi,
        signer
      );
      markPriceContract = new Contract(
        opAddressList.markPriceContractAddress,
        OpMarkPrice.abi,
        signer
      );
    } else if (currentNetwork.id === BASE_NETWORK) {
    }

    if (!indexPriceContract || !markPriceContract) {
      return;
    }
    const rsp = await axios.get("https://app.mux.network/api/liquidityAsset");
    const asset = getAssetFromAssetsArray(
      selectedPairRef.current.value,
      rsp.data.assets
    );
    setMarketPrice(asset.price);

    // const indexPrice = await indexPriceContract.getIndexPrice();
    // const markPrice = await markPriceContract.getMarkPrice();
    // const fundingRate =
    //   ((markPrice / 1e18 - indexPrice / 1e8) / (indexPrice / 1e8) / 3) * 100;
    const pointOne = (asset.price * 0.1) / 100;
    const indexPrice = Number(asset.price) - Number(pointOne);
    const markPrice = Number(asset.price);
    const fundingRate = ((markPrice - indexPrice) / (indexPrice / 3)) * 100;

    // setIndexPrice(ceilWithPrecision(String(Number(formatUnits(indexPrice,8))), 2));
    // setMarkPrice(ceilWithPrecision(String(Number(formatUnits(markPrice))), 2));
    // setFundingRate(ceilWithPrecision(String(fundingRate), 3) + "%");
    setIndexPrice(ceilWithPrecision(String(indexPrice), 2));
    setMarkPrice(ceilWithPrecision(String(markPrice), 2));
    setFundingRate(ceilWithPrecision(String(fundingRate)) + "%");
    setVolume("80,005.6");
  };

  useEffect(() => {
    fetchValues();
  }, [library, currentNetwork]);

  useEffect(() => {
    const protocol = networkOptionsMap[currentNetwork?.id || ""] || [
      { value: "Avantisfi", label: "Avantisfi" },
    ];
    setProtocolOptions(protocol);
    setSelectedProtocol(protocol[0]);
  }, [currentNetwork]);

  const getAssetPrice = async () => {
    const rsp = await axios.get("https://app.mux.network/api/liquidityAsset");
    const asset = getAssetFromAssetsArray(
      selectedPairRef.current.value,
      rsp.data.assets
    );
    setMarketPrice(asset.price);
    const fourPercent = (asset.price * 4) / 100;
    const high = Number(asset.price) + Number(fourPercent);
    const low = asset.price - fourPercent;
    setHighLow(
      ceilWithPrecision(String(high), 2) +
        "/" +
        ceilWithPrecision(String(low), 2)
    );
    setOpenInterestPositive(
      ceilWithPrecision(String(asset.availableForLong), 1)
    );
    setOpenInterestNegative(
      ceilWithPrecision(String(asset.availableForShort), 1)
    );
    const longPercent = Math.ceil((asset.availableForLong / asset.price) * 100);
    const shortPercent = Math.ceil(
      (asset.availableForShort / asset.price) * 100
    );
    setOpenInterestInPercentage(
      "(" + String(shortPercent) + "%/" + String(longPercent) + "%)"
    );

    return asset.price;
  };

  const getAssetFromAssetsArray = (
    tokenSymbol: string,
    assets: MuxPriceFetchingResponseObject[]
  ) => {
    tokenSymbol =
      tokenSymbol === "WETH" || tokenSymbol === "WBTC"
        ? tokenSymbol.substring(1)
        : tokenSymbol;
    for (const asset of assets) {
      if (asset.symbol === tokenSymbol) {
        return asset;
      }
    }
    return { symbol: "", price: 1, availableForLong: 1, availableForShort: 1 };
  };

  useEffect(() => {
    selectedPairRef.current = selectedPair;
  }, [selectedPair]);

  useEffect(() => {
    getAssetPrice();
    fetchValues();
    const intervalId = setInterval(getAssetPrice, 1000); // Calls fetchData every second
    const fetchValueIntervalId = setInterval(fetchValues, 3000);
    return () => {
      clearInterval(intervalId);
      clearInterval(fetchValueIntervalId);
    }; // This is the cleanup function
  }, []);

  return (
    <div className="flex flex-col lg:flex-row space-x-0 lg:space-x-5 text-base pt-4 px-2.5 md:px-5 lg:px-7 xl:px-10 text-baseBlack dark:text-baseWhite">
      <div className="w-full mx-auto mb-6">
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
                {marketPrice}
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
            <p className="text-neutral-500 text-xs">Index Price</p>
            <p className="text-sm">{indexPrice}</p>
          </div>
          <div>
            <p className="text-neutral-500 text-xs">Mark Price</p>
            <p className="text-sm">{markPrice}</p>
          </div>
          <div>
            <p className="text-neutral-500 text-xs">24H High/Low</p>
            <p className="text-sm">{highLow}</p>
          </div>
          <div className="col-span-2 sm:col-auto">
            <p className="text-neutral-500 text-xs">Funding Rate (8H)</p>
            <div className="flex items-center space-x-1">
              <p className="text=sm">{fundingRate}</p>
              {/* <p className="text-green-500 text-sm">{netRatePositive}</p>
              <p className="text-red-500 text-sm">{netRateNegative}</p> */}
            </div>
          </div>
          <div className="col-span-2 sm:col-auto">
            <p className="text-neutral-500 text-xs">
              Open Interest {openInterestInPercentage}
            </p>
            <div className="flex items-center space-x-1">
              <p className="text-green-500 text-sm">
                {" "}
                {"$"} {openInterestNegative} {"K"} {"/"}
              </p>
              <p className="text-red-500 text-sm">
                {"$"} {openInterestPositive} {"K"}
              </p>
            </div>
          </div>
          <div>
            <p className="text-neutral-500 text-xs">24H Volume</p>
            <p className="text-sm">{volume}</p>
          </div>
        </div>

        <div className="h-[30rem] mb-5">
          <TradingViewChart />
        </div>

        <div>
          <PositionsSection dataFetching={dataFetching} />
        </div>
      </div>

      <div className="flex-none w-full lg:w-[30%] pb-9">
        <PositionOpenClose
          market={selectedPair}
          setMarket={setSelectedPair}
          marketOption={pairOptions}
          setDataFetching={setDataFetching}
        />
      </div>
    </div>
  );
}
