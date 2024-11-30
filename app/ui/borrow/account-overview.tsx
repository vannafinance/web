/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import Image from "next/image";
import Tooltip from "../components/tooltip";
import { Info } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import {
  arbAddressList,
  baseAddressList,
  getShortenedAddress,
  opAddressList,
} from "@/app/lib/web3-constants";
import { Contract } from "ethers";
import { useWeb3React } from "@web3-react/core";
import { useNetwork } from "@/app/context/network-context";
import RiskEngine from "../../abi/vanna/v1/out/RiskEngine.sol/RiskEngine.json";
import { useSelector } from "react-redux";
import { RootState } from "@/app/store/store";
import { ceilWithPrecision } from "@/app/lib/helper";
import {
  ARBITRUM_NETWORK,
  BASE_NETWORK,
  OPTIMISM_NETWORK,
} from "@/app/lib/constants";
import axios from "axios";
import { formatUSD } from "@/app/lib/number-format-helper";
import Loader from "../components/loader";

const AccountOverview: React.FC<AccountOverviewProps> = ({
  creditToken,
  activeAccount,
}) => {
  const { library } = useWeb3React();
  const { currentNetwork } = useNetwork();

  const pools = useSelector((state: RootState) => state.pools.poolsData);

  const [loading, setLoading] = useState(false);
  const [collateral, setCollateral] = useState("0");
  const [accountValue, setAccountValue] = useState("0");
  const [debt, setDebt] = useState("0");
  const [healthFactor, setHealthFactor] = useState(0);
  const [borrowRate, setBorrowRate] = useState("-");
  const [liquidationPrice, setLiquidationPrice] = useState(0);
  const [leverageUseValue, setLeverageUseValue] = useState(0);

  const getPriceFromAssetsArray = async (tokenSymbol: string) => {
    const rsp = await axios.get("https://app.mux.network/api/liquidityAsset", {
      timeout: 10 * 1000,
    });

    const assets = rsp.data.assets;

    tokenSymbol =
      tokenSymbol === "WETH" || tokenSymbol === "WBTC"
        ? tokenSymbol.substring(1)
        : tokenSymbol;

    for (const asset of assets) {
      if (asset.symbol === tokenSymbol) {
        return asset.price;
      }
    }
    return 1;
  };

  useEffect(() => {
    const fetchValues = async () => {
      if (!currentNetwork) return;
      setLoading(true);

      try {
        const signer = library?.getSigner();

        let riskEngineContract;
        if (currentNetwork.id === ARBITRUM_NETWORK) {
          riskEngineContract = new Contract(
            arbAddressList.riskEngineContractAddress,
            RiskEngine.abi,
            signer
          );
        } else if (currentNetwork.id === OPTIMISM_NETWORK) {
          riskEngineContract = new Contract(
            opAddressList.riskEngineContractAddress,
            RiskEngine.abi,
            signer
          );
        } else if (currentNetwork.id === BASE_NETWORK) {
          riskEngineContract = new Contract(
            baseAddressList.riskEngineContractAddress,
            RiskEngine.abi,
            signer
          );
        } else {
          setLoading(false);
          return;
        }

        const currentEthPriceInDollar = await getPriceFromAssetsArray("WETH");
        let balance =
          (await riskEngineContract.callStatic.getBalance(activeAccount)) /
          1e18;
        balance = balance * currentEthPriceInDollar;

        let borrowBalance =
          (await riskEngineContract.callStatic.getBorrows(activeAccount)) /
          1e18; // total Borrow Balance
        borrowBalance = borrowBalance * currentEthPriceInDollar;

        const healthFactor1 = balance / borrowBalance;
        const liqP = (balance * 1.05) / healthFactor1;
        // TODO : @vatsal here balance & borrowBalance is in bignumber ... convert the same and then uncomment the below set statements
        const collateral = balance - borrowBalance;

        const leverageUse =
          Number(borrowBalance / 1e16) /
            (Number(balance / 1e16) - Number(borrowBalance / 1e16)) +
          1;

        setAccountValue(formatUSD(String(balance), 4));
        setCollateral(formatUSD(String(collateral), 4));
        setDebt(formatUSD(String(borrowBalance), 6));
        setHealthFactor(Number(ceilWithPrecision(String(healthFactor1), 4)));
        setLiquidationPrice(Number(ceilWithPrecision(String(liqP / 1e16), 4)));
        setLeverageUseValue(Number(ceilWithPrecision(String(leverageUse))));
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };

    fetchValues();
  }, [activeAccount, currentNetwork]);

  useEffect(() => {
    const poolValue = pools.find((pool) => pool.name === creditToken?.name);
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
            {loading ? <Loader /> : activeAccount
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
