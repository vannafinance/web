/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import Image from "next/image";
import Tooltip from "../components/tooltip";
import { Info } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { getShortenedAddress, opAddressList } from "@/app/lib/web3-constants";
import { Contract } from "ethers";
import { useWeb3React } from "@web3-react/core";
import { useNetwork } from "@/app/context/network-context";
import RiskEngine from "../../abi/vanna/v1/out/RiskEngine.sol/RiskEngine.json";
import { useSelector } from "react-redux";
import { RootState } from "@/app/store/store";

const AccountOverview: React.FC<AccountOverviewProps> = ({
  creditToken,
  leverageUseValue,
  activeAccount,
}) => {
  const { library } = useWeb3React();
  const { currentNetwork } = useNetwork();

  const pools = useSelector((state: RootState) => state.pools.poolsData);
  console.log("Pools: ", pools);

  const [collateral, setCollateral] = useState(0);
  const [accountValue, setAccountValue] = useState(0);
  const [debt, setDebt] = useState(0);
  const [healthFactor, setHealthFactor] = useState(0);
  const [borrowRate, setBorrowRate] = useState("-");
  const [liquidationPrice, setLiquidationPrice] = useState(0);

  useEffect(() => {
    const fetchValues = async () => {
      const signer = library?.getSigner();

      const riskEngineContract = new Contract(
        opAddressList.riskEngineContractAddress,
        RiskEngine.abi,
        signer
      );
      const balance = await riskEngineContract.callStatic.getBalance(
        activeAccount
      ); // total Balance  => AccountValue
      const borrowBalance = await riskEngineContract.callStatic.getBorrows(
        activeAccount
      ); // total Borrow Balance
      const healthFactor1 = balance / borrowBalance;
      const liqP = (balance * 1.05) / healthFactor1;
      // TODO : @vatsal here balance & borrowBalance is in bignumber ... convert the same and then uncomment the below set statements

      // setAccountValue(balance);
      // setCollateral(balance - borrowBalance);
      // setDebt(borrowBalance);
      // setHealthFactor(healthFactor1);
      // setLiquidationPrice(liqP);
    };

    fetchValues();
  }, [activeAccount]);

  useEffect(() => {
    const poolValue = pools.find((pool) => pool.name === creditToken?.name)
    if (poolValue !== undefined) setBorrowRate(poolValue.borrowAPY);
  }, [creditToken]);

  return (
    <>
      <div className="flex flex-row space-x-2">
        <Image
          src="/vanna-tilted-white-logo.svg"
          alt="Margin account logo"
          width="55"
          height="55"
        />
        <div className="flex flex-col">
          <span className="text-2xl font-semibold">Margin Account</span>
          <span className="text-base font-medium gradient-text">
            {activeAccount
              ? getShortenedAddress(activeAccount, 8, 6)
              : "Create your margin account"}
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
            <span className="font-semibold">{leverageUseValue}x</span>
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
            <span className="font-semibold text-baseSuccess-300 underline">
              {healthFactor}
            </span>
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
