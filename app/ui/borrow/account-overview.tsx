"use client";

import Image from "next/image";
import Tooltip from "../components/tooltip";
import { Info } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { getShortenedAddress } from "@/app/lib/web3-constants";

const AccountOverview: React.FC<AccountOverviewProps> = ({
  creditToken,
  leverage,
  activeAccount,
}) => {
  const [collateral, setCollateral] = useState("-");
  const [accountValue, setAccountValue] = useState("-");
  const [debt, setDebt] = useState("-");
  const [healthFactor, setHealthFactor] = useState("-");
  const [borrowRate, setBorrowRate] = useState("-");
  const [liquidationPrice, setLiquidationPrice] = useState("-");

  // TODO: delete below useEffect
  useEffect(() => {
    setCollateral("-");
    setAccountValue("-");
    setDebt("-");
    setHealthFactor("-");
    setBorrowRate("-");
    setLiquidationPrice("-");
  }, []);

  return (
    <>
      <div className="flex flex-row space-x-2">
        <Image
          src="/vanna-tilted-white-logo.svg"
          alt="Smart account logo"
          width="55"
          height="55"
        />
        <div className="flex flex-col">
          <span className="text-2xl font-semibold">Margin Account</span>
          <span className="text-base font-medium gradient-text">
            {activeAccount
              ? getShortenedAddress(activeAccount)
              : "Create your smart account"}
          </span>
        </div>
      </div>

      <div className="bg-baseComplementary dark:bg-baseDarkComplementary p-6 rounded-3xl mb-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <span className="mr-1">Credit Type</span>
          </div>
          <div className="flex items-center">
            <Image
              src={creditToken?.icon ? creditToken?.icon : ""}
              alt={creditToken?.name + "logo"}
              className="w-6 h-6 mr-1 rounded-full"
              width={16}
              height={16}
            />
            <span className="font-semibold">{creditToken?.name}</span>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <span className="mr-1">Leverage Used</span>
          </div>
          <div className="flex items-center">
            <span className="font-semibold">{leverage}x</span>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <span className="mr-1">Collateral</span>
            <Tooltip content={"Collateral"}>
              <Info size={16} />
            </Tooltip>
          </div>
          <div className="flex items-center">
            <span className="font-semibold">{collateral}</span>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <span className="mr-1">Account Value</span>
            <Tooltip content={"Account Value"}>
              <Info size={16} />
            </Tooltip>
          </div>
          <div className="flex items-center">
            <span className="font-semibold">{accountValue}</span>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <span className="mr-1">Debt</span>
          </div>
          <div className="flex items-center">
            <span className="font-semibold">{debt}</span>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <span className="mr-1">Health Factor</span>
          </div>
          <div className="flex items-center">
            {healthFactor === "-" ? (
              healthFactor
            ) : (
              <span className="font-semibold text-baseSuccess-300 underline">
                {healthFactor}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="bg-baseComplementary dark:bg-baseDarkComplementary p-6 rounded-3xl mb-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <span className="mr-1">Borrow Rate</span>
            <Tooltip content={"Borrow rate"}>
              <Info size={16} />
            </Tooltip>
          </div>
          <div className="flex items-center">
            <span className="font-semibold">{borrowRate}</span>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <span className="mr-1">Liquidation Price</span>
            <Tooltip content={"Liquidation Price"}>
              <Info size={16} />
            </Tooltip>
          </div>
          <div className="flex items-center">
            <span className="font-semibold">{liquidationPrice}</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default AccountOverview;
