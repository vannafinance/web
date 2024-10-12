"use client";

import { useNetwork } from "@/app/context/network-context";
import { ARBITRUM_NETWORK } from "@/app/lib/constants";
import FutureDropdown from "@/app/ui/future/future-dropdown";
import PositionOpenClose from "@/app/ui/future/position-open-close";
import PositionsSection from "@/app/ui/future/positions-section";
import TradingViewChart from "@/app/ui/future/trading-view-chart";
// import { useWeb3React } from "@web3-react/core";
import { useEffect, useState } from "react";

export default function Page() {
  // const { account, library } = useWeb3React();
  const { currentNetwork } = useNetwork();

  const pairOptions: Option[] = [
    { value: "ETH", label: "ETH/USD", icon: "/eth-icon.svg" },
    { value: "BTC", label: "BTC/USD", icon: "/btc-icon.svg" },
  ];
  const protocolOptions: Option[] = [
    { value: "MUX", label: "MUX" },
    ...(currentNetwork.id === ARBITRUM_NETWORK
      ? [{ value: "dYdX", label: "dYdX" }]
      : []),
  ];

  const [selectedPair, setSelectedPair] = useState<Option>(pairOptions[0]);
  const [selectedProtocol, setSelectedProtocol] = useState<Option>(
    protocolOptions[0]
  );

  // const [price, setPrice] = useState<string | undefined>("");
  // const [change, setChange] = useState<string | undefined>("");
  const [indexPrice, setIndexPrice] = useState<string | undefined>("");
  const [markPrice, setMarkPrice] = useState<string | undefined>("");
  const [highLow, setHighLow] = useState<string | undefined>("");
  const [netRatePositive, setNetRatePositive] = useState<string | undefined>(
    ""
  );
  const [netRateNegative, setNetRateNegative] = useState<string | undefined>(
    ""
  );
  const [openInterestPositive, setOpenInterestPositive] = useState<
    string | undefined
  >("");
  const [openInterestNegative, setOpenInterestNegative] = useState<
    string | undefined
  >("");
  const [volume, setVolume] = useState<string | undefined>("");

  // TODO: delete below useEffect
  useEffect(() => {
    setIndexPrice("58,289.70");
    setMarkPrice("58,289.70");
    setHighLow("58364/58093");
    setNetRatePositive("+0.05%");
    setNetRateNegative("-0.04%");
    setOpenInterestPositive("$668.4k");
    setOpenInterestNegative("$805.5k");
    setVolume("58,289.70");
  }, []);

  useEffect(() => {
    setSelectedProtocol(protocolOptions[0]);
  }, [currentNetwork]);

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
              <span className="text-green-500 font-semibold ml-2">58250.3</span>
              <span className="text-sm text-green-500 ml-1">+1.09%</span>
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
            <p className="text-neutral-500 text-xs">Net Rate/1Hr</p>
            <div className="flex items-center space-x-1">
              <p className="text-green-500 text-sm">{netRatePositive}</p>
              <p className="text-red-500 text-sm">{netRateNegative}</p>
            </div>
          </div>
          <div className="col-span-2 sm:col-auto">
            <p className="text-neutral-500 text-xs">Open Interest (45%/55%)</p>
            <div className="flex items-center space-x-1">
              <p className="text-green-500 text-sm">{openInterestPositive}</p>
              <p className="text-red-500 text-sm">{openInterestNegative}</p>
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
          <PositionsSection />
        </div>
      </div>

      <div className="flex-none w-full lg:w-[30%] pb-9">
        <PositionOpenClose market={selectedPair.value} />
      </div>
    </div>
  );
}
