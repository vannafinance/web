"use client";

import { useNetwork } from "@/app/context/network-context";
import { ARBITRUM_NETWORK } from "@/app/lib/constants";
import FutureDropdown from "@/app/ui/future/future-dropdown";
import PositionOpenClose from "@/app/ui/future/position-open-close";
import PositionsSection from "@/app/ui/future/positions-section";
import TradingViewChart from "@/app/ui/future/trading-view-chart";
import { useWeb3React } from "@web3-react/core";
import { useEffect, useState } from "react";

export default function Page() {
  const { account, library } = useWeb3React();
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

  useEffect(() => {
    setSelectedProtocol(protocolOptions[0]);
  }, [currentNetwork]);

  const cryptoData: CryptoData = {
    price: "58250.3",
    change: "+1.09%",
    indexPrice: "58,289.70",
    markPrice: "58,289.70",
    highLow: "58364/58093",
    netRatePositive: "+0.0005%",
    netRateNegative: "-0.0004%",
    openInterestPositive: "$668.4k",
    openInterestNegative: "$805.5k",
    volume: "58,289.70",
  };

  return (
    <div className="flex flex-row space-x-5 text-base pt-4 px-10">
      <div className="w-full mx-auto mb-6">
        <div className="flex justify-between items-center mb-2">
          <div className="flex flex-col border border-neutral-100 rounded-xl px-2 py-2 font-semibold text-xl">
            <div className="text-neutral-500 text-xs font-medium mb-1">
              Select Pair
            </div>
            <div className="flex flex-row justify-between items-center">
              <FutureDropdown
                options={pairOptions}
                defaultValue={selectedPair}
                onChange={setSelectedPair}
              />
              <span className="text-green-500 ml-2">58250.3</span>
              <span className="text-sm text-green-500 ml-1">+1.09%</span>
            </div>
          </div>
          <div className="ml-auto flex flex-col items-center border border-neutral-100 rounded-xl px-2 py-2">
            <div className="text-neutral-500 text-xs font-semibold mb-1">
              Chart protocol
            </div>
            <div className="flex flex-row items-center font-medium text-sm pl-1">
              <FutureDropdown
                options={protocolOptions}
                defaultValue={selectedProtocol}
                onChange={setSelectedProtocol}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-row justify-between text-sm px-6 py-4 border border-neutral-300 rounded-xl font-semibold mb-2">
          <div>
            <p className="text-neutral-500 text-xs">Index Price</p>
            <p className="text-sm">{cryptoData.indexPrice}</p>
          </div>
          <div>
            <p className="text-neutral-500 text-xs">Mark Price</p>
            <p className="text-sm">{cryptoData.markPrice}</p>
          </div>
          <div>
            <p className="text-neutral-500 text-xs">24H High/Low</p>
            <p className="text-sm">{cryptoData.highLow}</p>
          </div>
          <div className="">
            <p className="text-neutral-500 text-xs">Net Rate/1Hr</p>
            <div className="flex items-center space-x-1">
              <span className="text-green-500 text-sm">
                {cryptoData.netRatePositive}
              </span>
              <span className="text-red-500 text-sm">
                {cryptoData.netRateNegative}
              </span>
            </div>
          </div>
          <div className="">
            <p className="text-neutral-500 text-xs">Open Interest (45%/55%)</p>
            <div className="flex items-center space-x-1">
              <span className="text-green-500 text-sm">
                {cryptoData.openInterestPositive}
              </span>
              <span className="text-red-500 text-sm">
                {cryptoData.openInterestNegative}
              </span>
            </div>
          </div>
          <div>
            <p className="text-neutral-500 text-xs">24H Volume</p>
            <p className="text-sm">{cryptoData.volume}</p>
          </div>
        </div>

        <div className="h-[30rem] mb-5">
          <TradingViewChart />
        </div>

        <div>
          <PositionsSection />
        </div>
      </div>

      <div className="flex-none w-1/3">
        <PositionOpenClose market={selectedPair.value} />
      </div>
    </div>
  );
}
