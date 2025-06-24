"use client";

import { generateDummyData } from "@/app/lib/helper";
import FutureDropdown from "@/app/ui/future/future-dropdown";
import PositionsSection from "@/app/ui/options/positions-section";
import { CaretDown, Plus, PlusSquare, X } from "@phosphor-icons/react";
import { TrendDown, TrendUp } from "@phosphor-icons/react/dist/ssr";
import axios from "axios";
import { wsService } from "../../lib/websocket-service";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type OptionType = "All" | "Calls" | "Puts";
type DateOption =
  | "2 Sep"
  | "3 Sep"
  | "4 Sep"
  | "10 Sep"
  | "20 Sep"
  | "28 Sep"
  | "3 Oct"
  | "16 Oct";
type GreekOption = "Delta" | "Mark Price" | "Gamma" | "Vega" | "Theta";

export default function Page() {
  const pairOptions: Option[] = [
    { value: "ETH", label: "ETH/USD", icon: "/eth-icon.svg" },
    { value: "BTC", label: "BTC/USD", icon: "/btc-icon.svg" },
  ];
  const orderTypeOptions: Option[] = [
    { value: "Limit", label: "Limit" },
    { value: "RFQ", label: "RFQ" },
  ];
  const optionTypes: OptionType[] = ["All", "Calls", "Puts"];
  const dateOptions: DateOption[] = [
    "2 Sep",
    "3 Sep",
    "4 Sep",
    "10 Sep",
    "20 Sep",
    "28 Sep",
    "3 Oct",
    "16 Oct",
  ];
  const greekOptions: GreekOption[] = [
    "Delta",
    "Mark Price",
    "Gamma",
    "Vega",
    "Theta",
  ];

  const [selectedPair, setSelectedPair] = useState<Option>(pairOptions[0]);
  const selectedPairRef = useRef(selectedPair);
  const [marketPrice, setMarketPrice] = useState<number>(1);

  const [selectedOrderType, setSelectedOrderType] = useState<Option>(
    orderTypeOptions[0]
  );
  const [selectedOption, setSelectedOption] = useState<OptionType>("All");
  const [selectedDate, setSelectedDate] = useState<DateOption>("2 Sep");
  const [selectedGreeks, setSelectedGreeks] = useState<GreekOption[]>([
    "Delta",
    "Mark Price",
  ]);
  const [optionChain, setOptionChain] = useState<any[]>([]);
  const [size, setSize] = useState<string | undefined>(undefined);
  const [limitPrice, setLimitPrice] = useState<string | undefined>(undefined);

  useEffect(() => {
    wsService.connect();
    const handleOptionsData = (data: any[]) => {
  // Filter out subscription confirmation messages
  const validData = data.filter(item => item.method === "subscription" && item.params?.data?.instrument_ticker);
  
  if (validData.length === 0) return;

  const processedData = validData.map(item => {
    const ticker = item.params.data.instrument_ticker;
    return {
      instrument_name: ticker.instrument_name,
      strike_price: parseFloat(ticker.option_details?.strike || '0'),
      volume: parseFloat(ticker.stats?.contract_volume || '0'),
      iv: parseFloat(ticker.option_pricing?.iv || '0'),
      bid_price: parseFloat(ticker.best_bid_price || '0'),
      ask_price: parseFloat(ticker.best_ask_price || '0'),
      bid_size: parseFloat(ticker.best_bid_amount || '0'),
      ask_size: parseFloat(ticker.best_ask_amount || '0'),
      greeks: {
        delta: parseFloat(ticker.option_pricing?.delta || '0')
      },
      timestamp: parseInt(ticker.timestamp) || Date.now(),
      isCall: ticker.option_details?.option_type === "C"
    };
  });

setOptionChain(prev => {
  const merged = [...processedData, ...prev];

  // Remove duplicates based on instrument_name (keep latest one)
  const uniqueMap = new Map();
  merged.forEach(item => {
    uniqueMap.set(item.instrument_name, item);
  });

  const uniqueSorted = Array.from(uniqueMap.values())
    .sort((a, b) => a.strike_price - b.strike_price); // Optional: Sort by strike

  console.log('✅ Final unique sorted chain for UI:', uniqueSorted);
  return uniqueSorted;
});
};

    wsService.on("optionsData", (incoming) => {
      const data = Array.isArray(incoming) ? incoming : [incoming];
      handleOptionsData(data);
    });
    return () => {
      wsService.off("optionsData", handleOptionsData);
      wsService.disconnect();
    };
  }, []);

  const calls = optionChain
    .filter((opt) => opt.instrument_name?.includes("-C"))
    .sort((a, b) => a.strike_price - b.strike_price);

  const puts = optionChain
    .filter((opt) => opt.instrument_name?.includes("-P"))
    .sort((a, b) => a.strike_price - b.strike_price);

  useEffect(() => {
    selectedPairRef.current = selectedPair;
  }, [selectedPair]);

  useEffect(() => {
    const getAssetPrice = async () => {
      try {
        const rsp = await axios.get(
          "https://app.mux.network/api/liquidityAsset",
          {
            timeout: 10 * 1000,
          }
        );
        const assets = rsp.data.assets;
        const tokenSymbol = selectedPairRef.current.value;
        const filtered = tokenSymbol.startsWith("W")
          ? tokenSymbol.substring(1)
          : tokenSymbol;
        const asset = assets.find((a: any) => a.symbol === filtered);
        if (asset?.price) setMarketPrice(asset.price);
      } catch (err) {
        console.error("Error fetching price", err);
      }
    };

    const interval = setInterval(getAssetPrice, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleGreekChange = (greek: GreekOption) => {
    setSelectedGreeks((prev) =>
      prev.includes(greek) ? prev.filter((g) => g !== greek) : [...prev, greek]
    );
  };

  const handleDateChange = (date: DateOption) => {
    setSelectedDate(date);
  };

  const handleOptionChange = (option: OptionType) => {
    setSelectedOption(option);
  };

  const date = new Date();
  const today = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;

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
              <p className="text-sm">$2.11m</p>
            </div>
            <div className="col-span-2 my-1.5 xs:my-0">
              <p className="text-neutral-500 text-xs">
                Open Interest (45%/55%)
              </p>
              <div className="flex items-center space-x-1">
                <TrendUp size={16} color="#22c55e" />
                <span className="text-sm">$668.4k</span>&nbsp;
                <TrendDown size={15} color="#ef4444" />
                <span className="text-sm">$805.5k</span>
              </div>
            </div>
            <div className="my-1.5 xs:my-0">
              <p className="text-neutral-500 text-xs">24H Trade</p>
              <p className="text-sm">58,289.70</p>
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
            {dateOptions.map((date) => (
              <button
                key={date}
                onClick={() => handleDateChange(date)}
                className={`px-2.5 xl:px-5 ml-2.5 sm:ml-0 mt-2.5 sm:mt-0 py-2.5 rounded-md ${
                  selectedDate === date
                    ? "bg-purpleBG-lighter dark:bg-baseDarkComplementary border border-purple"
                    : "border border-neutral-300 dark:border-neutral-700"
                }`}
              >
                {date}
              </button>
            ))}
            <button className="px-2.5 py-2 ml-2.5 sm:ml-0 mt-2.5 sm:mt-0 rounded-lg text-xs font-semibold border border-neutral-300 dark:border-neutral-700 flex items-center">
              Next month <CaretDown size={16} className="ml-2" />
            </button>
          </div>
        </div>

        <div className="relative mb-2.5 w-full h-96">
          <div className="overflow-auto max-w-full 2xl:w-full max-h-full">
            <table className="bg-white dark:bg-baseDark w-full">
              <thead>
                <tr className="text-base font-medium border border-neutral-100 dark:border-neutral-700">
                  <th className="py-3 px-6 text-center" colSpan={7}>
                    Calls
                  </th>
                  <th className="py-3 text-center text-nowrap w-24" colSpan={1}>
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
                {calls.map((call, index) => {
                  const put = puts[index];

                  return (
                    <tr key={index}>
                      {/* Call Side */}
                      <td className="py-3 px-2 text-left border-b border-neutral-100 dark:border-neutral-700">
                        {Number(call?.greeks?.delta || 0).toFixed(5)}
                      </td>
                      <td className="py-3 px-2 text-left border-b border-neutral-100 dark:border-neutral-700">
                        {Number(call?.iv || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-2 text-left border-b border-neutral-100 dark:border-neutral-700">
                        {Number(call?.volume || 0).toFixed(0)}
                      </td>
                      <td className="py-3 px-2 text-left border-b border-neutral-100 dark:border-neutral-700">
                        {Number(call?.bid_size || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-2 text-left border-b border-neutral-100 dark:border-neutral-700 text-baseSuccess-300 hover:bg-baseSuccess-100">
                        <div className="flex flex-row justify-between">
                          {Number(call?.bid_price || 0).toFixed(1)}
                          <PlusSquare size={16} />
                        </div>
                      </td>
                      <td className="py-3 px-2 text-left border-b border-neutral-100 dark:border-neutral-700 text-baseSecondary-500 hover:bg-baseSecondary-300">
                        <div className="flex flex-row justify-between">
                          {Number(call?.ask_price || 0).toFixed(1)}
                          <PlusSquare size={16} />
                        </div>
                      </td>
                      <td className="py-3 px-2 text-left border-b border-neutral-100 dark:border-neutral-700">
                        {Number(call?.ask_size || 0).toFixed(2)}
                      </td>

                      {/* Strike */}
                      <td className="py-3 px-2 text-center border-x border-neutral-100 dark:border-neutral-700 font-medium w-24">
                        {call?.strike_price}
                      </td>

                      {/* Put Side */}
                      <td className="py-3 px-2 text-left border-b border-neutral-100 dark:border-neutral-700">
                        {Number(put?.bid_size || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-2 text-left border-b border-neutral-100 dark:border-neutral-700 text-baseSuccess-300 hover:bg-baseSuccess-100">
                        <div className="flex flex-row justify-between">
                          {Number(put?.bid_price || 0).toFixed(1)}
                          <PlusSquare size={16} />
                        </div>
                      </td>
                      <td className="py-3 px-2 text-left border-b border-neutral-100 dark:border-neutral-700 text-baseSecondary-500 hover:bg-baseSecondary-300">
                        <div className="flex flex-row justify-between">
                          {Number(put?.ask_price || 0).toFixed(1)}
                          <PlusSquare size={16} />
                        </div>
                      </td>
                      <td className="py-3 px-2 text-left border-b border-neutral-100 dark:border-neutral-700">
                        {Number(put?.ask_size || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-2 text-left border-b border-neutral-100 dark:border-neutral-700">
                        {Number(put?.volume || 0).toFixed(0)}
                      </td>
                      <td className="py-3 px-2 text-left border-b border-neutral-100 dark:border-neutral-700">
                        {Number(put?.iv || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-2 text-left border-b border-neutral-100 dark:border-neutral-700">
                        {Number(put?.greeks?.delta || 0).toFixed(5)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <PositionsSection />
        </div>
      </div>

      <div className="flex-none w-full lg:w-[30%] pb-9">
        <div className="bg-baseComplementary dark:bg-baseDarkComplementary p-2 px-3 pb-6 rounded-3xl w-full">
          <div className="ml-auto flex items-center justify-between py-2 mb-5">
            <div className="text-2xl font-normal">Long Call</div>
            <div className="flex flex-row items-center font-medium text-base p-2 bg-white dark:bg-baseDark rounded-md">
              <FutureDropdown
                options={orderTypeOptions}
                defaultValue={selectedOrderType}
                onChange={setSelectedOrderType}
              />
            </div>
          </div>

          <div className="bg-purple-100 rounded py-1 text-base font-semibold inline-block mb-4">
            Multiple Calls
          </div>

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

          <div className="mb-5">
            <button className="flex items-center bg-white dark:bg-baseDark mb-4 px-2 py-1 text-purple">
              <Plus size={20} />
              <span className="ml-1 text-xs font-semibold">Add Option</span>
            </button>
          </div>

          <div className="flex justify-between my-5">
            <div className="text-xs">
              <span className="text-neutral-500">Avail: </span>
              <span>0.00 USDT</span>
            </div>
          </div>

          <div className="flex w-full rounded-xl bg-white dark:bg-baseDark py-2 pl-2 mb-5">
            <input
              type="number"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              className="w-full text-baseBlack dark:text-baseWhite dark:bg-baseDark text-sm font-normal outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              placeholder="Size"
              min={0}
            />
          </div>

          <div className="flex w-full rounded-xl bg-white dark:bg-baseDark py-2 pl-2 mb-5">
            <input
              type="number"
              value={limitPrice}
              onChange={(e) => setLimitPrice(e.target.value)}
              className="w-full text-baseBlack dark:text-baseWhite dark:bg-baseDark text-sm font-normal outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              placeholder="Limit Price"
              min={0}
            />
          </div>

          <div className="flex text-xs my-5">
            <span className="text-neutral-500">Bid: </span>
            <span className="text-baseSuccess-300">$335.8</span>
            <span className="text-neutral-500 ml-1">Ask: </span>
            <span className="text-baseSecondary-500">$346.8</span>
          </div>

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
            <button className="w-full bg-baseSuccess-300 text-white py-2.5 px-5 rounded-md text-base font-semibold text-center">
              Buy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}



// "use client";

// // import { useNetwork } from "@/app/context/network-context";
// // import { ARBITRUM_NETWORK } from "@/app/lib/constants";
// import { generateDummyData } from "@/app/lib/helper";
// import FutureDropdown from "@/app/ui/future/future-dropdown";
// // import OptionSlider from "@/app/ui/options/option-slider";
// import PositionsSection from "@/app/ui/options/positions-section";
// import { CaretDown, Plus, PlusSquare, X } from "@phosphor-icons/react";
// import { TrendDown, TrendUp } from "@phosphor-icons/react/dist/ssr";
// import axios from "axios";
// // import { useWeb3React } from "@web3-react/core";
// import Image from "next/image";
// import { useEffect, useRef, useState } from "react";

// type OptionType = "All" | "Calls" | "Puts";
// type DateOption =
//   | "2 Sep"
//   | "3 Sep"
//   | "4 Sep"
//   | "10 Sep"
//   | "20 Sep"
//   | "28 Sep"
//   | "3 Oct"
//   | "16 Oct"
//   | "Next month";
// type GreekOption = "Delta" | "Mark Price" | "Gamma" | "Vega" | "Theta";

// export default function Page() {
//   // const { account, library } = useWeb3React();
//   // const { currentNetwork } = useNetwork();

//   const pairOptions: Option[] = [
//     { value: "ETH", label: "ETH/USD", icon: "/eth-icon.svg" },
//     { value: "BTC", label: "BTC/USD", icon: "/btc-icon.svg" },
//   ];

//   const [selectedOption, setSelectedOption] = useState<OptionType>("All");
//   const [selectedDate, setSelectedDate] = useState<DateOption>("2 Sep");
//   const [selectedGreeks, setSelectedGreeks] = useState<GreekOption[]>([
//     "Delta",
//     "Mark Price",
//   ]);

//   const optionTypes: OptionType[] = ["All", "Calls", "Puts"];
//   const dateOptions: DateOption[] = [
//     "2 Sep",
//     "3 Sep",
//     "4 Sep",
//     "10 Sep",
//     "20 Sep",
//     "28 Sep",
//     "3 Oct",
//     "16 Oct",
//   ];
//   const greekOptions: GreekOption[] = [
//     "Delta",
//     "Mark Price",
//     "Gamma",
//     "Vega",
//     "Theta",
//   ];

//   const orderTypeOptions: Option[] = [
//     { value: "Limit", label: "Limit" },
//     { value: "RFQ", label: "RFQ" },
//   ];

//   const [selectedPair, setSelectedPair] = useState<Option>(pairOptions[0]);
//   const selectedPairRef = useRef(selectedPair);
//   const [marketPrice, setMarketPrice] = useState<number>(1);

//   const [selectedOrderType, setSelectedOrderType] = useState<Option>(
//     orderTypeOptions[0]
//   );
//   // const [leverageValue, setLeverageValue] = useState<number>(50);

//   const handleOptionChange = (option: OptionType) => {
//     setSelectedOption(option);
//   };

//   const handleDateChange = (date: DateOption) => {
//     setSelectedDate(date);
//   };

//   const handleGreekChange = (greek: GreekOption) => {
//     setSelectedGreeks((prev) =>
//       prev.includes(greek) ? prev.filter((g) => g !== greek) : [...prev, greek]
//     );
//   };

//   const date = new Date();
//   const today =
//     date.getFullYear() +
//     "-" +
//     String(date.getMonth() + 1).padStart(2, "0") +
//     "-" +
//     String(date.getDate()).padStart(2, "0");

//   const currentPrice = 2417.75;
//   const baseStrike = Math.floor(currentPrice / 100) * 100 - 300;
//   const dummyData = generateDummyData(baseStrike, 6);

//   // const tableRef = useRef<HTMLDivElement>(null);
//   // const [labelPosition, setLabelPosition] = useState<number>(0);

//   const [size, setSize] = useState<string | undefined>(undefined);
//   const [limitPrice, setLimitPrice] = useState<string | undefined>(undefined);

//   // const updateLabelPosition = () => {
//   //   if (tableRef.current) {
//   //     const lowerStrike = Math.floor(currentPrice / 100) * 100;
//   //     const upperStrike = lowerStrike + 100;
//   //     const position =
//   //       (currentPrice - lowerStrike) / (upperStrike - lowerStrike);

//   //     const rows = tableRef.current.querySelectorAll("tbody tr");
//   //     const targetRow = Array.from(rows).find((row) => {
//   //       const strike = parseInt(row.children[7].textContent || "0", 10);
//   //       return strike <= currentPrice && currentPrice < strike + 100;
//   //     });

//   //     if (targetRow) {
//   //       const rowRect = targetRow.getBoundingClientRect();
//   //       const tableRect = tableRef.current.getBoundingClientRect();
//   //       setLabelPosition(
//   //         rowRect.top - tableRect.top + rowRect.height * position
//   //       );
//   //     }
//   //   }
//   // };

//   // useEffect(() => {
//   //   updateLabelPosition();
//   //   window.addEventListener('resize', updateLabelPosition);
//   //   return () => window.removeEventListener('resize', updateLabelPosition);
//   // }, [currentPrice]);

//   const getPriceFromAssetsArray = (
//     tokenSymbol: string,
//     assets: MuxPriceFetchingResponseObject[]
//   ) => {
//     tokenSymbol =
//       tokenSymbol === "WETH" || tokenSymbol === "WBTC"
//         ? tokenSymbol.substring(1)
//         : tokenSymbol;
//     for (const asset of assets) {
//       if (asset.symbol === tokenSymbol) {
//         return asset.price;
//       }
//     }
//     return 1;
//   };

//   const getAssetPrice = async (assetName = selectedPairRef.current.value) => {
//     const rsp = await axios.get("https://app.mux.network/api/liquidityAsset", {
//       timeout: 10 * 1000,
//     });

//     const price = getPriceFromAssetsArray(assetName, rsp.data.assets);
//     setMarketPrice(price);

//     return price;
//   };

//   useEffect(() => {
//     selectedPairRef.current = selectedPair;
//   }, [selectedPair]);

//   useEffect(() => {
//     const intervalId = setInterval(getAssetPrice, 1000); // Calls fetchData every second
//     return () => clearInterval(intervalId); // This is the cleanup function
//   }, []);

//   return (
//     <div className="flex flex-col lg:flex-row space-x-0 lg:space-x-5 text-base pt-8 px-3 xs:px-5 lg:px-6 custom-scrollbar text-baseBlack dark:text-baseWhite">
//       <div className="w-full lg:w-[70%] mx-auto mb-6">
//         <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-2 gap-4">
//           <div className="w-fit flex flex-col h-[4.5rem] border border-neutral-100 dark:border-neutral-700 rounded-xl px-2 py-2 font-semibold text-xl">
//             <div className="text-neutral-500 text-xs font-medium mb-1">
//               Select Pair
//             </div>
//             <div className="flex flex-row justify-between items-center">
//               <FutureDropdown
//                 options={pairOptions}
//                 defaultValue={selectedPair}
//                 onChange={setSelectedPair}
//               />
//               <span className="text-green-500 ml-2 font-semibold">{marketPrice}</span>
//               {/* <span className="text-sm text-green-500 ml-1">+1.09%</span> */}
//             </div>
//           </div>

//           <div className="w-full xs:h-[4.5rem] flex flex-row flex-wrap xs:flex-nowrap justify-between px-6 py-2 xs:py-4 border border-neutral-100 dark:border-neutral-700 rounded-xl font-semibold">
//             <div className="my-1.5 xs:my-0">
//               <p className="text-neutral-500 text-xs">24H Volume</p>
//               <p className="text-sm">$2.11m</p>
//             </div>
//             <div className="col-span-2 my-1.5 xs:my-0">
//               <p className="text-neutral-500 text-xs">
//                 Open Interest (45%/55%)
//               </p>
//               <div className="flex items-center space-x-1">
//                 <TrendUp size={16} color="#22c55e" />
//                 <span className="text-sm">$668.4k</span>&nbsp;
//                 <TrendDown size={15} color="#ef4444" />
//                 <span className="text-sm">$805.5k</span>
//               </div>
//             </div>
//             <div className="my-1.5 xs:my-0">
//               <p className="text-neutral-500 text-xs">24H Trade</p>
//               <p className="text-sm">58,289.70</p>
//             </div>
//           </div>
//         </div>

//         <div className="py-4 rounded-lg mb-5">
//           <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-4 space-y-3.5 xl:space-y-0">
//             <div className="flex flex-wrap gap-4 ml-1.5 text-base font-semibold">
//               {optionTypes.map((option) => (
//                 <button
//                   key={option}
//                   onClick={() => handleOptionChange(option)}
//                   className={`px-4 py-2 rounded-md ${
//                     selectedOption === option
//                       ? "bg-purpleBG-lighter dark:bg-baseDarkComplementary border border-purple"
//                       : ""
//                   }`}
//                 >
//                   {option}
//                 </button>
//               ))}
//             </div>

//             <div className="flex flex-wrap gap-4 items-center text-xs font-semibold">
//               {greekOptions.map((greek) => (
//                 <label key={greek} className="flex items-center space-x-2">
//                   <input
//                     type="checkbox"
//                     checked={selectedGreeks.includes(greek)}
//                     onChange={() => handleGreekChange(greek)}
//                     className="sr-only"
//                   />
//                   <div
//                     className={`w-5 h-5 rounded mr-2 flex items-center justify-center ${
//                       selectedGreeks.includes(greek)
//                         ? "bg-purple"
//                         : "bg-white border border-baseBlack dark:border-baseWhite"
//                     }`}
//                   >
//                     {selectedGreeks.includes(greek) && (
//                       <svg
//                         className="w-4 h-4 text-white"
//                         fill="none"
//                         strokeLinecap="round"
//                         strokeLinejoin="round"
//                         strokeWidth="2"
//                         viewBox="0 0 24 24"
//                         stroke="currentColor"
//                       >
//                         <path d="M5 13l4 4L19 7"></path>
//                       </svg>
//                     )}
//                   </div>
//                   <span>{greek}</span>
//                 </label>
//               ))}
//             </div>
//           </div>

//           <div className="flex flex-wrap sm:flex-nowrap sm:justify-between text-xs font-semibold">
//             {dateOptions.map((date) => (
//               <button
//                 key={date}
//                 onClick={() => handleDateChange(date)}
//                 className={`px-2.5 xl:px-5 ml-2.5 sm:ml-0 mt-2.5 sm:mt-0 py-2.5 rounded-md ${
//                   selectedDate === date
//                     ? "bg-purpleBG-lighter dark:bg-baseDarkComplementary border border-purple"
//                     : "border border-neutral-300 dark:border-neutral-700"
//                 }`}
//               >
//                 {date}
//               </button>
//             ))}
//             <button className="px-2.5 py-2 ml-2.5 sm:ml-0 mt-2.5 sm:mt-0 rounded-lg text-xs font-semibold border border-neutral-300 dark:border-neutral-700 flex items-center">
//               Next month <CaretDown size={16} className="ml-2" />
//             </button>
//           </div>
//         </div>

//         <div className="relative mb-2.5 w-full h-96">
//           <div className="overflow-auto max-w-full 2xl:w-full max-h-full">
//             <table className="bg-white dark:bg-baseDark w-full">
//               <thead>
//                 <tr className="text-base font-medium border border-neutral-100 dark:border-neutral-700">
//                   <th className="py-3 px-6 text-center" colSpan={7}>
//                     Calls
//                   </th>
//                   <th className="py-3 text-center text-nowrap w-24" colSpan={1}>
//                     {today}
//                   </th>
//                   <th className="py-3 px-6 text-center" colSpan={7}>
//                     Puts
//                   </th>
//                 </tr>
//                 <tr className="text-neutral-500 text-xs text-nowrap">
//                   <th className="py-3 px-2 text-left border-b border-neutral-100 dark:border-neutral-700">
//                     Delta
//                   </th>
//                   <th className="py-3 px-2 text-left border-b border-neutral-100 dark:border-neutral-700">
//                     IV
//                   </th>
//                   <th className="py-3 px-2 text-left border-b border-neutral-100 dark:border-neutral-700">
//                     Volume
//                   </th>
//                   <th className="py-3 px-2 text-left border-b border-neutral-100 dark:border-neutral-700">
//                     Bid Size
//                   </th>
//                   <th className="py-3 px-2 text-left border-b border-neutral-100 dark:border-neutral-700">
//                     Bid Price
//                   </th>
//                   <th className="py-3 px-2 text-left border-b border-neutral-100 dark:border-neutral-700">
//                     Ask Price
//                   </th>
//                   <th className="py-3 px-2 text-left border-b border-neutral-100 dark:border-neutral-700">
//                     Ask Size
//                   </th>
//                   <th className="py-3 px-5 text-center border-x border-neutral-100 dark:border-neutral-700 w-24">
//                     Strike
//                   </th>
//                   <th className="py-3 px-2 text-left border-b border-neutral-100 dark:border-neutral-700">
//                     Bid Size
//                   </th>
//                   <th className="py-3 px-2 text-left border-b border-neutral-100 dark:border-neutral-700">
//                     Bid Price
//                   </th>
//                   <th className="py-3 px-2 text-left border-b border-neutral-100 dark:border-neutral-700">
//                     Ask Price
//                   </th>
//                   <th className="py-3 px-2 text-left border-b border-neutral-100 dark:border-neutral-700">
//                     Ask Size
//                   </th>
//                   <th className="py-3 px-2 text-left border-b border-neutral-100 dark:border-neutral-700">
//                     Volume
//                   </th>
//                   <th className="py-3 px-2 text-left border-b border-neutral-100 dark:border-neutral-700">
//                     IV
//                   </th>
//                   <th className="py-3 px-2 text-left border-b border-neutral-100 dark:border-neutral-700">
//                     Delta
//                   </th>
//                 </tr>
//               </thead>
//               <tbody className="text-xs font-normal">
//                 {dummyData.map((option, index) => (
//                   <tr key={index}>
//                     <td className="py-3 px-2 text-left border-b border-neutral-100 dark:border-neutral-700">
//                       {option.delta.toFixed(5)}
//                     </td>
//                     <td className="py-3 px-2 text-left border-b border-neutral-100 dark:border-neutral-700">
//                       {option.iv.toFixed(2)}
//                     </td>
//                     <td className="py-3 px-2 text-left border-b border-neutral-100 dark:border-neutral-700">
//                       {option.volume.toFixed(0)}
//                     </td>
//                     <td className="py-3 px-2 text-left border-b border-neutral-100 dark:border-neutral-700">
//                       {option.bidSize.toFixed(2)}
//                     </td>
//                     <td className="py-3 px-2 text-left border-b border-neutral-100 dark:border-neutral-700 text-baseSuccess-300 hover:bg-baseSuccess-100">
//                       <div className=" flex flex-row justify-between">
//                         {option.bidPrice.toFixed(1)}
//                         <PlusSquare size={16} />
//                       </div>
//                     </td>
//                     <td className="py-3 px-2 text-left border-b border-neutral-100 dark:border-neutral-700 text-baseSecondary-500 hover:bg-baseSecondary-300">
//                       <div className=" flex flex-row justify-between">
//                         {option.askPrice.toFixed(1)}
//                         <PlusSquare size={16} />
//                       </div>
//                     </td>
//                     <td className="py-3 px-2 text-left border-b border-neutral-100 dark:border-neutral-700">
//                       {option.askSize.toFixed(2)}
//                     </td>
//                     <td className="py-3 px-2 text-center border-x border-neutral-100 dark:border-neutral-700 font-medium w-24">
//                       {option.strike}
//                     </td>
//                     <td className="py-3 px-2 text-left border-b border-neutral-100 dark:border-neutral-700">
//                       {option.bidSize.toFixed(2)}
//                     </td>
//                     <td className="py-3 px-2 text-left border-b border-neutral-100 dark:border-neutral-700 text-baseSuccess-300 hover:bg-baseSuccess-100">
//                       <div className=" flex flex-row justify-between">
//                         {option.bidPrice.toFixed(1)}
//                         <PlusSquare size={16} />
//                       </div>
//                     </td>
//                     <td className="py-3 px-2 text-left border-b border-neutral-100 dark:border-neutral-700 text-baseSecondary-500 hover:bg-baseSecondary-300">
//                       <div className=" flex flex-row justify-between">
//                         {option.askPrice.toFixed(1)}
//                         <PlusSquare size={16} />
//                       </div>
//                     </td>
//                     <td className="py-3 px-2 text-left border-b border-neutral-100 dark:border-neutral-700">
//                       {option.askSize.toFixed(2)}
//                     </td>
//                     <td className="py-3 px-2 text-left border-b border-neutral-100 dark:border-neutral-700">
//                       {option.volume.toFixed(0)}
//                     </td>
//                     <td className="py-3 px-2 text-left border-b border-neutral-100 dark:border-neutral-700">
//                       {option.iv.toFixed(2)}
//                     </td>
//                     <td className="py-3 px-2 text-left border-b border-neutral-100 dark:border-neutral-700">
//                       {option.delta.toFixed(5)}
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//             {/* <div
//               className="absolute left-1/2 transform -translate-x-1/2 text-white top-10"
//             >
//               <div className="relative w-20 h-8 flex items-center justify-center bg-gradient-to-r from-gradient-1 to-gradient-2 rounded-md">
//                 <span className="relative text-white font-semibold text-xs z-10">
//                   ETH {currentPrice.toFixed(1)}
//                 </span>
//               </div>
//             </div> */}
//           </div>
//         </div>

//         <div>
//           <PositionsSection />
//         </div>
//       </div>

//       <div className="flex-none w-full lg:w-[30%] pb-9">
//         <div className="bg-baseComplementary dark:bg-baseDarkComplementary p-2 px-3 pb-6 rounded-3xl w-full">
//           <div className="ml-auto flex items-center justify-between py-2 mb-5">
//             <div className="text-2xl font-normal">Long Call</div>
//             <div className="flex flex-row items-center font-medium text-base p-2 bg-white dark:bg-baseDark rounded-md">
//               <FutureDropdown
//                 options={orderTypeOptions}
//                 defaultValue={selectedOrderType}
//                 onChange={setSelectedOrderType}
//               />
//             </div>
//           </div>

//           <div className="bg-purple-100 rounded py-1 text-base font-semibold inline-block mb-4">
//             Multiple Calls
//             {/* <span className="px-2 inline-flex text-xs leading-4 font-medium rounded-md bg-purpleBG-lighter text-purple">
//                 Long
//               </span> */}
//           </div>

//           <div className="flex flex-row justify-between mb-5">
//             <div className="flex flex-row">
//               <Image
//                 src="/eth-icon.svg"
//                 width="24"
//                 height="24"
//                 alt="token"
//                 className="ml-2"
//               />
//               <div className="flex flex-col ml-2">
//                 <span className="text-xs font-semibold">
//                   BTC $53000 Call
//                 </span>
//                 <span className="text-xs font-normal text-neutral-500">
//                   Exp 13 sep
//                 </span>
//               </div>
//             </div>
//             <div className="flex flex-row mr-1">
//               <span className="text-xs font-semibold mr-2">
//                 $4990.00
//               </span>
//               <X size={14} />
//             </div>
//           </div>

//           <div className="mb-5">
//             <button className="flex items-center bg-white dark:bg-baseDark mb-4 px-2 py-1 text-purple">
//               <Plus size={20} />
//               <span className="ml-1 text-xs font-semibold">Add Option</span>
//             </button>
//           </div>

//           <div className="flex justify-between my-5">
//             <div className="text-xs">
//               <span className="text-neutral-500">Avail: </span>
//               <span>0.00 USDT</span>
//             </div>
//           </div>

//           <div className="flex w-full rounded-xl bg-white dark:bg-baseDark py-2 pl-2 mb-5">
//             <input
//               type="number"
//               value={size}
//               onChange={(e) => setSize(e.target.value)}
//               className="w-full text-baseBlack dark:text-baseWhite dark:bg-baseDark text-sm font-normal outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
//               placeholder="Size"
//               min={0}
//             />
//           </div>

//           <div className="flex w-full rounded-xl bg-white dark:bg-baseDark py-2 pl-2 mb-5">
//             <input
//               type="number"
//               value={limitPrice}
//               onChange={(e) => setLimitPrice(e.target.value)}
//               className="w-full text-baseBlack dark:text-baseWhite dark:bg-baseDark text-sm font-normal outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
//               placeholder="Limit Price"
//               min={0}
//             />
//           </div>

//           <div className="flex text-xs my-5">
//             <span className="text-neutral-500">Bid: </span>
//             <span className="text-baseSuccess-300">$335.8</span>
//             <span className="text-neutral-500 ml-1">Ask: </span>
//             <span className="text-baseSecondary-500">$346.8</span>
//           </div>

//           {/* <div className="flex justify-between items-center mb-5">
//             <OptionSlider value={leverageValue} onChange={setLeverageValue} />
//           </div> */}

//           <div className="space-y-2 text-xs font-normal py-5 px-4 mb-5 border-y border-purpleBG-lighter dark:border-neutral-700">
//             <div className="flex justify-between">
//               <span>Min Received</span>
//               <span>$215.70</span>
//             </div>
//             <div className="flex justify-between">
//               <span>Fees</span>
//               <span>-</span>
//             </div>
//             <div className="flex justify-between">
//               <span>Mark Price</span>
//               <span>$230.80</span>
//             </div>
//             <div className="flex justify-between">
//               <span>Liquidation Price</span>
//               <span>-</span>
//             </div>
//             <div className="flex justify-between">
//               <span>Margin Required</span>
//               <span>-</span>
//             </div>
//           </div>

//           <div className="flex gap-4">
//             <button className="w-full bg-baseSuccess-300 text-white py-2.5 px-5 rounded-md text-base font-semibold text-center">
//               Buy
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
