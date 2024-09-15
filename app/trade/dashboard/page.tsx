"use client";

import { useNetwork } from "@/app/context/network-context";
import OptionPayoffChart from "@/app/dashboard/option-payoff-chart";
import { SimpleTableComponent } from "@/app/dashboard/simple-table";
import { calculateRemainingTime } from "@/app/lib/helper";
import FutureDropdown from "@/app/ui/future/future-dropdown";
import { CheckSquare, Square } from "@phosphor-icons/react";
import { useWeb3React } from "@web3-react/core";
import { useState } from "react";

export default function Page() {
  const { account, library } = useWeb3React();
  const { currentNetwork } = useNetwork();

  const pairOptions: Option[] = [
    { value: "ETH", label: "ETH/USD", icon: "/eth-icon.svg" },
    { value: "BTC", label: "BTC/USD", icon: "/btc-icon.svg" },
  ];

  const userData: UserData = {
    availableBalance: "$100.00",
    marginUsage: "$950.00",
    totalPnl: "+$56.00",
    healthFactor: "1.8",
    borrowRate: "50%",
  };

  const expiryOptions: Option[] = [
    { value: "2024-09-20", label: "20 September 2024" },
    { value: "2024-09-27", label: "27 September 2024" },
    { value: "2024-10-04", label: "04 October 2024" },
    { value: "2024-10-11", label: "11 October 2024" },
    { value: "2024-10-18", label: "18 October 2024" },
  ];

  const [optionPositions, setOptionPositions] = useState<OptionPosition[]>([
    {
      id: 1,
      selected: true,
      strikePrice: 44.0,
      cp: "CE",
      units: 16000,
      traded: 0.5,
      price: 0.39,
      delta: 0.5,
      iv: 43.5,
    },
    {
      id: 2,
      selected: false,
      strikePrice: 50.0,
      cp: "PE",
      units: 16000,
      traded: 0.2437,
      price: 3.37,
      delta: 0.6,
      iv: 40.5,
    },
    {
      id: 3,
      selected: false,
      strikePrice: 44.0,
      cp: "CE",
      units: 16000,
      traded: 0.5,
      price: 7.37,
      delta: 0.4,
      iv: 40.54,
    },
    {
      id: 4,
      selected: false,
      strikePrice: 44.0,
      cp: "CE",
      units: 16000,
      traded: 0.4379,
      price: 0.58,
      delta: 0.8,
      iv: 85.05,
    },
    {
      id: 5,
      selected: false,
      strikePrice: 70.0,
      cp: "PE",
      units: 16000,
      traded: 0.7916,
      price: 0.39,
      delta: 1.0,
      iv: 95.5,
    },
    {
      id: 6,
      selected: false,
      strikePrice: 83.0,
      cp: "CE",
      units: 16000,
      traded: 0.5,
      price: 0.8,
      delta: 0.2,
      iv: 43.5,
    },
  ]);

  const [futuresPositions, setFuturesPositions] = useState<FuturePosition[]>([
    {
      id: 1,
      selected: true,
      marketPrice: 0.0,
      entryPrice: 0.0,
      size: 0.0,
      leverage: 0.0,
      liqPrice: 0.0,
      delta: 0.5,
      pnl: 0.0,
    },
    {
      id: 2,
      selected: false,
      marketPrice: 0.0,
      entryPrice: 0.0,
      size: 0.0,
      leverage: 0.0,
      liqPrice: 0.0,
      delta: 0.6,
      pnl: 0.0,
    },
    {
      id: 3,
      selected: false,
      marketPrice: 0.0,
      entryPrice: 0.0,
      size: 0.0,
      leverage: 0.0,
      liqPrice: 0.0,
      delta: 0.4,
      pnl: 0.0,
    },
    {
      id: 4,
      selected: false,
      marketPrice: 0.0,
      entryPrice: 0.0,
      size: 0.0,
      leverage: 0.0,
      liqPrice: 0.0,
      delta: 0.8,
      pnl: 0.0,
    },
    {
      id: 5,
      selected: false,
      marketPrice: 0.0,
      entryPrice: 0.0,
      size: 0.0,
      leverage: 0.0,
      liqPrice: 0.0,
      delta: 1.0,
      pnl: 0.0,
    },
    {
      id: 6,
      selected: false,
      marketPrice: 0.0,
      entryPrice: 0.0,
      size: 0.0,
      leverage: 0.0,
      liqPrice: 0.0,
      delta: 0.2,
      pnl: 0.0,
    },
  ]);

  const portfolioSummary = {
    future: 80.0,
    premium: 0.0,
    option: 0.0,
    grossPnl: 0.0,
    netBal: 0.0,
    theta: 0.0,
    vega: 0.0,
    gamma: 0.0,
  };

  const options = {
    Delta: { Call: "$0.00", Put: "$0.00", Total: "$0.00" },
    Theta: { Call: "$0.00", Put: "$0.00", Total: "$0.00" },
    Vega: { Call: "$0.00", Put: "$0.00", Total: "$0.00" },
    Gamma: { Call: "$0.00", Put: "$0.00", Total: "$0.00" },
    Long: { Call: "$0.00", Put: "$0.00", Total: "$0.00" },
    Short: { Call: "$0.00", Put: "$0.00", Total: "$0.00" },
    Net: { Call: "$0.00", Put: "$0.00", Total: "$0.00" },
  };

  const futures = {
    PrevBal: { Equity: "$0.00", Future: "$0.00", Average: "$0.00" },
    Todays: { Equity: "$0.00", Future: "$0.00", Average: "$0.00" },
    Net: { Equity: "$0.00", Future: "$0.00", Average: "$0.00" },
    Traded: { Equity: "$0.00", Future: "$0.00", Average: "$0.00" },
  };

  const handleOptionPositionSelect = (id: number) => {
    setOptionPositions(
      optionPositions.map((position) =>
        position.id === id
          ? { ...position, selected: !position.selected }
          : position
      )
    );
  };

  const handleFuturePositionSelect = (id: number) => {
    setFuturesPositions((positions) =>
      positions.map((position) =>
        position.id === id
          ? { ...position, selected: !position.selected }
          : position
      )
    );
  };

  const [selectedPair, setSelectedPair] = useState<Option>(pairOptions[0]);
  const [selectedExpiry, setSelectedExpiry] = useState<Option>(
    expiryOptions[0]
  );

  const today = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="pt-4 px-10">
      <div className="flex flex-row space-x-5 text-base">
        <div className="flex flex-col w-4/12 h-[4.5rem] border border-neutral-100 rounded-xl px-2 pt-2 font-semibold text-xl">
          <div className="text-neutral-500 text-xs font-medium mb-1">
            Select Pair
          </div>
          <div className="flex flex-row items-center">
            <FutureDropdown
              options={pairOptions}
              defaultValue={selectedPair}
              onChange={setSelectedPair}
            />
            <span className="text-green-500 ml-2">58250.3</span>
            <span className="text-sm text-green-500 ml-1">+1.09%</span>
          </div>
        </div>

        <div className="w-full h-[4.5rem] flex flex-row justify-between px-6 py-4 border border-neutral-100 rounded-xl font-semibold mb-2">
          <div>
            <p className="text-neutral-500 text-xs">Available Balance</p>
            <p className="text-sm">{userData.availableBalance}</p>
          </div>
          <div>
            <p className="text-neutral-500 text-xs">Margin Usage</p>
            <p className="text-sm">{userData.marginUsage}</p>
          </div>
          <div>
            <p className="text-neutral-500 text-xs">Total P&L</p>
            <p className="text-sm">{userData.totalPnl}</p>
          </div>
          <div>
            <p className="text-neutral-500 text-xs">Health Factor</p>
            <p className="text-sm">{userData.healthFactor}</p>
          </div>
          <div>
            <p className="text-neutral-500 text-xs">Borrow Rate</p>
            <p className="text-sm">{userData.borrowRate}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-row space-x-5 text-base pt-1">
        <div className="flex-none w-2/5">
          <div className="mb-5 w-full">
            <OptionPayoffChart />
          </div>

          <div className="flex flex-row gap-2">
            <SimpleTableComponent
              title="Options"
              data={options}
              headers={["Assets", "Call", "Put", "Total"]}
            />
            <SimpleTableComponent
              title="Futures"
              data={futures}
              headers={["Assets", "Equity", "Future", "Average"]}
            />
          </div>
        </div>

        <div className="w-full">
          <div className="flex flex-row gap-4">
            <div className="flex flex-col w-full h-[4.5rem] border border-neutral-100 rounded-xl px-2 pt-2 font-semibold text-xl">
              <div className="text-neutral-500 text-xs font-medium mb-1">
                Select Pair
              </div>
              <div className="flex flex-row items-center text-lg">
                <FutureDropdown
                  options={expiryOptions}
                  defaultValue={selectedExpiry}
                  onChange={setSelectedExpiry}
                />
              </div>
            </div>

            <div className="flex-none w-2/3 h-[4.5rem] flex flex-row justify-between px-6 py-4 border border-neutral-100 rounded-xl font-semibold mb-2">
              <div>
                <p className="text-neutral-500 text-xs">Today's Date</p>
                <p className="text-sm">{today}</p>
              </div>
              <div>
                <p className="text-neutral-500 text-xs">Rem Time</p>
                <p className="text-sm">
                  {calculateRemainingTime(selectedExpiry.value)}
                </p>
              </div>
              <div>
                <p className="text-neutral-500 text-xs">CIV</p>
                <p className="text-sm">16</p>
              </div>
              <div>
                <p className="text-neutral-500 text-xs">PIV</p>
                <p className="text-sm">19</p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto bg-white border border-neutral-100 rounded-xl mb-5">
            <table className="min-w-full">
              <thead className="">
                <tr className="border-b border-neutral-100">
                  <th
                    className="py-2 px-3 text-left text-sm font-medium text-baseBlack tracking-wider"
                    colSpan={8}
                  >
                    Options-Positions
                  </th>
                </tr>
                <tr>
                  <th className="py-2 px-3 text-left text-xs font-semibold text-neutral-500 tracking-wider">
                    #
                  </th>
                  <th className="py-2 px-3 text-left text-xs font-semibold text-neutral-500 tracking-wider">
                    Strike Price
                  </th>
                  <th className="py-2 px-3 text-left text-xs font-semibold text-neutral-500 tracking-wider">
                    CP
                  </th>
                  <th className="py-2 px-3 text-left text-xs font-semibold text-neutral-500 tracking-wider">
                    Units
                  </th>
                  <th className="py-2 px-3 text-left text-xs font-semibold text-neutral-500 tracking-wider">
                    Traded
                  </th>
                  <th className="py-2 px-3 text-left text-xs font-semibold text-neutral-500 tracking-wider">
                    Price
                  </th>
                  <th className="py-2 px-3 text-left text-xs font-semibold text-neutral-500 tracking-wider">
                    Delta
                  </th>
                  <th className="py-2 px-3 text-left text-xs font-semibold text-neutral-500 tracking-wider">
                    IV
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {optionPositions.map((position) => (
                  <tr
                    key={position.id}
                    className="hover:bg-gray-50 text-sm font-normal text-baseBlack"
                  >
                    <td className="pt-1 px-3 whitespace-nowrap">
                      <button
                        onClick={() => handleOptionPositionSelect(position.id)}
                        className="text-purple hover:text-purpleBG"
                      >
                        {position.selected ? (
                          <CheckSquare size={16} />
                        ) : (
                          <Square size={16} />
                        )}
                      </button>
                    </td>
                    <td className="pt-1 px-3 whitespace-nowrap">
                      ${position.strikePrice.toFixed(2)}
                    </td>
                    <td className="pt-1 px-3 whitespace-nowrap">
                      {position.cp}
                    </td>
                    <td className="pt-1 px-3 whitespace-nowrap">
                      {position.units.toLocaleString()}
                    </td>
                    <td className="pt-1 px-3 whitespace-nowrap">
                      {position.traded.toFixed(4)}
                    </td>
                    <td className="pt-1 px-3 whitespace-nowrap">
                      {position.price.toFixed(2)}
                    </td>
                    <td className="pt-1 px-3 whitespace-nowrap">
                      {position.delta.toFixed(1)}
                    </td>
                    <td className="pt-1 px-3 whitespace-nowrap">
                      {position.iv.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="overflow-x-auto bg-white border border-neutral-100 rounded-xl mb-5">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-neutral-100">
                  <th
                    className="py-2 px-3 text-left text-sm font-medium text-baseBlack tracking-wider"
                    colSpan={8}
                  >
                    Futures-Positions
                  </th>
                </tr>
                <tr>
                  <th className="py-2 px-3 text-left text-xs font-semibold text-neutral-500 tracking-wider">
                    #
                  </th>
                  <th className="py-2 px-3 text-left text-xs font-semibold text-neutral-500 tracking-wider">
                    Market Price
                  </th>
                  <th className="py-2 px-3 text-left text-xs font-semibold text-neutral-500 tracking-wider">
                    Entry Price
                  </th>
                  <th className="py-2 px-3 text-left text-xs font-semibold text-neutral-500 tracking-wider">
                    Size
                  </th>
                  <th className="py-2 px-3 text-left text-xs font-semibold text-neutral-500 tracking-wider">
                    Leverage
                  </th>
                  <th className="py-2 px-3 text-left text-xs font-semibold text-neutral-500 tracking-wider">
                    Liq Price
                  </th>
                  <th className="py-2 px-3 text-left text-xs font-semibold text-neutral-500 tracking-wider">
                    Delta
                  </th>
                  <th className="py-2 px-3 text-left text-xs font-semibold text-neutral-500 tracking-wider">
                    P/L
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {futuresPositions.map((position) => (
                  <tr
                    key={position.id}
                    className="hover:bg-gray-50 text-sm font-normal text-baseBlack"
                  >
                    <td className="pt-1 px-3 whitespace-nowrap">
                      <button
                        onClick={() => handleFuturePositionSelect(position.id)}
                        className="text-purple hover:text-purpleBG"
                      >
                        {position.selected ? (
                          <CheckSquare size={16} />
                        ) : (
                          <Square size={16} />
                        )}
                      </button>
                    </td>
                    <td className="pt-1 px-3 whitespace-nowrap">
                      ${position.marketPrice.toFixed(2)}
                    </td>
                    <td className="pt-1 px-3 whitespace-nowrap">
                      ${position.entryPrice.toFixed(2)}
                    </td>
                    <td className="pt-1 px-3 whitespace-nowrap">
                      ${position.size.toFixed(2)}
                    </td>
                    <td className="pt-1 px-3 whitespace-nowrap">
                      ${position.leverage.toFixed(2)}
                    </td>
                    <td className="pt-1 px-3 whitespace-nowrap">
                      ${position.liqPrice.toFixed(2)}
                    </td>
                    <td className="pt-1 px-3 whitespace-nowrap">
                      {position.delta.toFixed(1)}
                    </td>
                    <td className="pt-1 px-3 whitespace-nowrap">
                      ${position.pnl.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="w-full flex flex-row justify-between px-6 py-4 border border-neutral-100 rounded-xl font-semibold mb-2 bg-white">
        <div>
          <p className="text-neutral-500 text-xs">FUTURE</p>
          <p className="text-sm">${portfolioSummary.future.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-neutral-500 text-xs">PREMIUM</p>
          <p className="text-sm">${portfolioSummary.premium.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-neutral-500 text-xs">OPTION</p>
          <p className="text-sm">${portfolioSummary.option.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-neutral-500 text-xs">GROSS PNL</p>
          <p className="text-sm">${portfolioSummary.grossPnl.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-neutral-500 text-xs">NET BAL</p>
          <p className="text-sm">${portfolioSummary.netBal.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-neutral-500 text-xs">THETA</p>
          <p className="text-sm">${portfolioSummary.theta.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-neutral-500 text-xs">VEGA</p>
          <p className="text-sm">${portfolioSummary.vega.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-neutral-500 text-xs">GAMMA</p>
          <p className="text-sm">${portfolioSummary.gamma.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}
