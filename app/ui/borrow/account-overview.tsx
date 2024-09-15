"use client";

import Image from "next/image";
import Tooltip from "../components/tooltip";
import { CaretRight, Question } from "@phosphor-icons/react";

const AccountOverview = () => {
  return (
    <>
      <div className="text-2xl">Account Overview</div>

      <div className="bg-baseComplementary p-6 rounded-3xl mb-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <span className="mr-1">Credit Type</span>
          </div>
          <div className="flex items-center">
            <Image
              src="/usdc-icon.svg"
              alt="logo"
              className="w-6 h-6 mr-1 rounded-full"
              width={16}
              height={16}
            />
            <span className="font-semibold">USDC</span>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <span className="mr-1">Leverage Used</span>
          </div>
          <div className="flex items-center">
            <span className="font-semibold">5x</span>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <span className="mr-1">Collateral</span>
            <Tooltip content={"Collateral"}>
              <Question weight="fill" size={16} color="black" />
            </Tooltip>
          </div>
          <div className="flex items-center">
            <span className="font-semibold">2000</span>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <span className="mr-1">Exposure</span>
            <Tooltip content={"Exposure"}>
              <Question weight="fill" size={16} color="black" />
            </Tooltip>
          </div>
          <div className="flex items-center">
            <span className="font-semibold">10000</span>
          </div>
        </div>
      </div>

      <div className="bg-baseComplementary p-6 rounded-3xl mb-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <span className="mr-1">Borrow Rate</span>
            <Tooltip content={"Borrow rate"}>
              <Question weight="fill" size={16} color="black" />
            </Tooltip>
          </div>
          <div className="flex items-center">
            <span className="font-semibold">N/A</span>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <span className="mr-1">Liquidation Price</span>
            <Tooltip content={"Liquidation Price"}>
              <Question weight="fill" size={16} color="black" />
            </Tooltip>
          </div>
          <div className="flex items-center">
            <span className="font-semibold">N/A</span>
          </div>
        </div>
      </div>

      <div className="bg-baseComplementary p-6 rounded-3xl mb-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <span className="mr-1">Oravles and LTs</span>
          </div>
          <div className="flex items-center">
            <span className="font-semibold">
              <CaretRight size={16} color="black" />
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

export default AccountOverview;
