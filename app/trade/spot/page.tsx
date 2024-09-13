"use client";

import TokenDropdown from "@/app/ui/components/token-dropdown";
import { CaretDown, CaretUp, Lightning } from "@phosphor-icons/react";
import Image from "next/image";
import { useState } from "react";

export default function Page() {
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = () => setIsOpen(!isOpen);

  const handleFromSelect = (token: PoolTable) => {
    console.log("Selected token:", token);
  };

  const handleToSelect = (token: PoolTable) => {
    console.log("Selected token:", token);
  };

  return (
    <div className="w-full md:w-[40rem] mx-auto">
      <p className="text-4xl font-bold mb-8">Spot</p>

      <div className="bg-baseComplementary rounded-3xl p-4 relative mb-4">
        <div className="bg-white rounded-2xl p-4 mb-1">
          <div className="text-baseBlack text-lg">From</div>
          <div className="flex justify-between mb-2">
            <div className="flex flex-col">
              <input
                type="number"
                value={fromAmount}
                onChange={(e) => setFromAmount(e.target.value)}
                className="w-full text-baseBlack text-[2.5rem] font-medium outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="0"
              />
            </div>
            <div className="flex">
              <TokenDropdown
                onSelect={handleFromSelect}
              />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-medium">$30.12</div>
          </div>
        </div>

        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="w-16 h-16 bg-baseComplementary rounded-full flex items-center justify-center p-1">
            <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
              <Image src="/vanna-logo.svg" width={26} height={24} alt="Vanna" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4">
          <div className="text-baseBlack text-lg">To</div>
          <div className="flex justify-between mb-2">
            <div className="flex flex-col">
              <input
                type="number"
                value={toAmount}
                onChange={(e) => setToAmount(e.target.value)}
                className="w-full text-baseBlack text-[2.5rem] font-medium outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="0"
              />
            </div>
            <div className="flex">
              <TokenDropdown
                onSelect={handleToSelect}
              />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-medium">$30.12</div>
          </div>
        </div>
      </div>

      <button className="w-full bg-purple text-white py-3 rounded-2xl font-semibold text-xl mb-2">
        Swap
      </button>

      <div className="w-full max-w-md mx-auto bg-white rounded-lg p-4">
        <div
          className="flex justify-between items-center cursor-pointer"
          onClick={toggleOpen}
        >
          <span className="text-base font-medium">
            1 USDC ≈ 0.00042 WETH ($1.00)
          </span>
          {isOpen ? <CaretUp size={20} /> : <CaretDown size={20} />}
        </div>

        {isOpen && (
          <div className="mt-4 space-y-2 text-sm text-neutral-500">
            <div className="flex justify-between">
              <span>Max Slippage</span>
              <span>0.5%</span>
            </div>
            <div className="flex justify-between">
              <span>Receive at least</span>
              <span>1150 USDC</span>
            </div>
            <div className="flex justify-between">
              <span>Fee</span>
              <span>$2.300</span>
            </div>
            <div className="flex justify-between">
              <span>Network cost</span>
              <span className="flex items-center">
                <Lightning size={16} className="text-purple-500 mr-1" />
                $0.10
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Order routing</span>
              <span>5x</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
