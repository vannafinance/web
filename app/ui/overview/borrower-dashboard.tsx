/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { ArrowCircleUpRight } from "@phosphor-icons/react";
import TradingInfoPanel from "./trading-info-panel";
import { useEffect, useState } from "react";
import { useWeb3React } from "@web3-react/core";
import { useNetwork } from "@/app/context/network-context";
import {
  ARBITRUM_NETWORK,
  OPTIMISM_NETWORK,
  BASE_NETWORK,
} from "@/app/lib/constants";
import { Contract } from "ethers";
import {
  arbAddressList,
  opAddressList,
  baseAddressList,
} from "@/app/lib/web3-constants";

import { ceilWithPrecision } from "@/app/lib/helper";
import OracleFacade from "../../abi/vanna/v1/out/OracleFacade.sol/OracleFacade.json";
import ERC20 from "../../abi/vanna/v1/out/ERC20.sol/ERC20.json";
import Registry from "../../abi/vanna/v1/out/Registry.sol/Registry.json";
import RiskEngine from "../../abi/vanna/v1/out/RiskEngine.sol/RiskEngine.json";
import VEther from "../../abi/vanna/v1/out/VEther.sol/VEther.json";
import VToken from "../../abi/vanna/v1/out/VToken.sol/VToken.json";
import axios from "axios";
import { formatUSD } from "@/app/lib/number-format-helper";
import Link from "next/link";
import Loader from "../components/loader";

const BorrowerDashboard = () => {
  const { account, library } = useWeb3React();
  const { currentNetwork } = useNetwork();

  const [activeAccount, setActiveAccount] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const [depositedAmount, setDepositedAmount] = useState<string | undefined>();
  const [repayableAmount, setRepayableAmount] = useState<string | undefined>();
  const [repayablePercentage, setRepayablePercentage] = useState<
    string | undefined
  >();
  const [borrowedAmount, setBorrowedAmount] = useState<string | undefined>();
  const [borrowedLeverage, setBorrowedLeverage] = useState<
    string | undefined
  >();
  const [withdrawableAmount, setWithdrawableAmount] = useState<
    string | undefined
  >();

  const accountCheck = async () => {
    if (
      localStorage.getItem("isWalletConnected") === "true" &&
      account &&
      currentNetwork
    ) {
      try {
        const signer = await library?.getSigner();

        let regitstryContract;
        if (currentNetwork.id === ARBITRUM_NETWORK) {
          regitstryContract = new Contract(
            arbAddressList.registryContractAddress,
            Registry.abi,
            signer
          );
        } else if (currentNetwork.id === OPTIMISM_NETWORK) {
          regitstryContract = new Contract(
            opAddressList.registryContractAddress,
            Registry.abi,
            signer
          );
        } else if (currentNetwork.id === BASE_NETWORK) {
          regitstryContract = new Contract(
            baseAddressList.registryContractAddress,
            Registry.abi,
            signer
          );
        }
        if (regitstryContract) {
          const accountsArray = await regitstryContract.accountsOwnedBy(
            account
          );
          let tempAccount;
          if (accountsArray.length > 0) {
            tempAccount = accountsArray[0];
            setActiveAccount(tempAccount);
          }
        }
      } catch (e) {
        console.error(e);
        setActiveAccount(undefined);
      }
    } else {
      setActiveAccount(undefined);
    }
    // setLoading(false);
  };

  useEffect(() => {
    accountCheck();
  }, []);

  useEffect(() => {
    accountCheck();
  }, [account, currentNetwork]);

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
      if (!currentNetwork || !activeAccount) return;

      setLoading(true);

      try {
        const signer = await library?.getSigner();

        let daiContract;
        let wethContract;
        let usdcContract;
        let usdtContract;
        let wbtcContract;
        let vEtherContract;
        let vDaiContract;
        let vUsdcContract;
        let vUsdtContract;
        let vWbtcContract;
        let tTokenOracleContract;

        if (currentNetwork.id === ARBITRUM_NETWORK) {
          daiContract = new Contract(
            arbAddressList.daiTokenAddress,
            ERC20.abi,
            signer
          );
          usdcContract = new Contract(
            arbAddressList.usdcTokenAddress,
            ERC20.abi,
            signer
          );
          usdtContract = new Contract(
            arbAddressList.usdtTokenAddress,
            ERC20.abi,
            signer
          );
          wethContract = new Contract(
            arbAddressList.wethTokenAddress,
            ERC20.abi,
            signer
          );
          wbtcContract = new Contract(
            arbAddressList.wbtcTokenAddress,
            ERC20.abi,
            signer
          );
          vEtherContract = new Contract(
            arbAddressList.vEtherContractAddress,
            VEther.abi,
            signer
          );
          vDaiContract = new Contract(
            arbAddressList.vDaiContractAddress,
            VToken.abi,
            signer
          );
          vUsdcContract = new Contract(
            arbAddressList.vUSDCContractAddress,
            VToken.abi,
            signer
          );
          vUsdtContract = new Contract(
            arbAddressList.vUSDTContractAddress,
            VToken.abi,
            signer
          );
          vWbtcContract = new Contract(
            arbAddressList.vWBTCContractAddress,
            VToken.abi,
            signer
          );
          // tTokenOracleContract = new Contract(
          //   opAddressList.OracleFacade,
          //   OracleFacade.abi,
          //   signer
          // )
        } else if (currentNetwork.id === OPTIMISM_NETWORK) {
          daiContract = new Contract(
            opAddressList.daiTokenAddress,
            ERC20.abi,
            signer
          );
          usdcContract = new Contract(
            opAddressList.usdcTokenAddress,
            ERC20.abi,
            signer
          );
          usdtContract = new Contract(
            opAddressList.usdtTokenAddress,
            ERC20.abi,
            signer
          );
          wethContract = new Contract(
            opAddressList.wethTokenAddress,
            ERC20.abi,
            signer
          );
          wbtcContract = new Contract(
            opAddressList.wbtcTokenAddress,
            ERC20.abi,
            signer
          );
          vEtherContract = new Contract(
            opAddressList.vEtherContractAddress,
            VEther.abi,
            signer
          );
          vDaiContract = new Contract(
            opAddressList.vDaiContractAddress,
            VToken.abi,
            signer
          );
          vUsdcContract = new Contract(
            opAddressList.vUSDCContractAddress,
            VToken.abi,
            signer
          );
          vUsdtContract = new Contract(
            opAddressList.vUSDTContractAddress,
            VToken.abi,
            signer
          );
          vWbtcContract = new Contract(
            opAddressList.vWBTCContractAddress,
            VToken.abi,
            signer
          );
          tTokenOracleContract = new Contract(
            opAddressList.OracleFacade,
            OracleFacade.abi,
            signer
          );
        } else if (currentNetwork.id === BASE_NETWORK) {
          // tTokenOracleContract = new Contract(
          //   opAddressList.OracleFacade,
          //   OracleFacade.abi,
          //   signer
          // )
        }

        if (
          !daiContract ||
          !wethContract ||
          !usdcContract ||
          !usdtContract ||
          !wbtcContract ||
          !vEtherContract ||
          !vDaiContract ||
          !vUsdcContract ||
          !vUsdtContract ||
          !vWbtcContract ||
          !tTokenOracleContract
        ) {
          setLoading(false);
          return;
        }
        // ETH
        let accountBalance = await library?.getBalance(activeAccount);

        const waccountBalance = await wethContract.balanceOf(activeAccount);

        accountBalance = Number(accountBalance) + Number(waccountBalance);

        let borrowedBalance = await vEtherContract.callStatic.getBorrowBalance(
          activeAccount
        );

        borrowedBalance = Number(borrowedBalance);

        let val = Number(await getPriceFromAssetsArray("ETH"));

        let balance = Number(
          (Number(accountBalance - borrowedBalance) / 1e18) * val
        );

        // USDC
        accountBalance = await usdcContract.balanceOf(activeAccount);

        borrowedBalance = await vUsdcContract.callStatic.getBorrowBalance(
          activeAccount
        );

        val = Number(await getPriceFromAssetsArray("USDC"));
        balance += (Number(accountBalance - borrowedBalance) / 1e6) * val;

        // WBTC
        accountBalance = await wbtcContract.balanceOf(activeAccount);

        borrowedBalance = await vWbtcContract.callStatic.getBorrowBalance(
          activeAccount
        );

        val = Number(await getPriceFromAssetsArray("BTC"));
        balance += (accountBalance - borrowedBalance) * val;

        //USDT
        accountBalance = await usdtContract.balanceOf(activeAccount);
        borrowedBalance = await vUsdtContract.callStatic.getBorrowBalance(
          activeAccount
        );
        val = Number(await getPriceFromAssetsArray("USDT"));
        balance += (accountBalance - borrowedBalance) * val;

        // DAI
        accountBalance = await daiContract.balanceOf(activeAccount);
        borrowedBalance = await vDaiContract.callStatic.getBorrowBalance(
          activeAccount
        );
        val = Number(await getPriceFromAssetsArray("DAI"));
        balance += (accountBalance - borrowedBalance) * val;

        // tToken
        accountBalance =
          (await tTokenOracleContract.callStatic.getPrice(
            opAddressList.tTokenAddress,
            activeAccount
          )) / 1e18;
        val = accountBalance * Number(await getPriceFromAssetsArray("WETH"));

        balance += val;

        setDepositedAmount(ceilWithPrecision(String(balance), 2));

        const riskEngineContract = new Contract(
          opAddressList.riskEngineContractAddress,
          RiskEngine.abi,
          signer
        );

        let totalbalance =
          (await riskEngineContract.callStatic.getBalance(activeAccount)) /
          1e18;
        totalbalance =
          totalbalance * Number(await getPriceFromAssetsArray("WETH"));

        let borrowBalance =
          (await riskEngineContract.callStatic.getBorrows(activeAccount)) /
          1e18;
        borrowBalance =
          borrowBalance * Number(await getPriceFromAssetsArray("WETH"));

        // @TODO ; Vatsal : currently it's not accurate but way
        // balance of each token * share to assets of that
        setBorrowedAmount(String(borrowBalance));
        setRepayableAmount(String(borrowBalance));
        setWithdrawableAmount(String(totalbalance - borrowBalance));
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };

    fetchValues();
  }, [activeAccount]);

  return (
    <div>
      <div className="grid grid-cols-2 gap-x-4 my-3 lg:my-0 text-baseBlack dark:text-baseWhite">
        <div className="bg-white dark:bg-baseDark rounded-3xl border border-purpleBG-lighter dark:border-neutral-700 p-3 lg:p-6 mb-5 lg:mb-7">
          <div className="flex justify-between items-start mb-10">
            <h2 className="text-base font-medium">Deopsited Amount</h2>
            <Link href="/borrow">
              <ArrowCircleUpRight size={24} fill="#7a45da" />
            </Link>
          </div>
          <p className="text-2xl lg:text-3xl font-semibold mb-2">
            {loading ? (
              <Loader />
            ) : depositedAmount ? (
              formatUSD(depositedAmount)
            ) : (
              "0"
            )}
          </p>
        </div>

        <div className="bg-white dark:bg-baseDark rounded-3xl border border-purpleBG-lighter dark:border-neutral-700 p-3 lg:p-6 mb-5 lg:mb-7">
          <div className="flex justify-between items-start mb-10">
            <h2 className="text-base font-medium">Repayable Amount</h2>
            <Link href="/borrow">
              <ArrowCircleUpRight size={24} fill="#7a45da" />
            </Link>
          </div>
          <p className="text-2xl lg:text-3xl font-semibold mb-2">
            {loading ? (
              <Loader />
            ) : repayableAmount ? (
              formatUSD(repayableAmount)
            ) : (
              "0"
            )}{" "}
            {!loading && repayablePercentage && (
              <span className="text-baseSuccess-300 text-base font-medium">
                {repayablePercentage}
              </span>
            )}
          </p>
        </div>

        <div className="bg-white dark:bg-baseDark rounded-3xl border border-purpleBG-lighter dark:border-neutral-700 p-3 lg:p-6 mb-5 lg:mb-7">
          <div className="flex justify-between items-start mb-10">
            <h2 className="text-base font-medium">Borrowed Amount</h2>
            <Link href="/borrow">
              <ArrowCircleUpRight size={24} fill="#7a45da" />
            </Link>
          </div>
          <p className="text-2xl lg:text-3xl font-semibold mb-2">
            {loading ? (
              <Loader />
            ) : borrowedAmount ? (
              formatUSD(borrowedAmount)
            ) : (
              "0"
            )}{" "}
            {!loading && borrowedLeverage && (
              <span className="px-2 inline-flex text-xs leading-4 font-medium rounded-md bg-purpleBG-lighter text-purple">
                {borrowedLeverage}x Leverage
              </span>
            )}
          </p>
        </div>

        <div className="bg-white dark:bg-baseDark rounded-3xl border border-purpleBG-lighter dark:border-neutral-700 p-3 lg:p-6 mb-5 lg:mb-7">
          <div className="flex justify-between items-start mb-10">
            <h2 className="text-base font-medium">Withdrawable Amount</h2>
            <Link href="/borrow">
              <ArrowCircleUpRight size={24} fill="#7a45da" />
            </Link>
          </div>
          <p className="text-2xl lg:text-3xl font-semibold mb-2">
            {loading ? (
              <Loader />
            ) : withdrawableAmount ? (
              formatUSD(withdrawableAmount)
            ) : (
              "0"
            )}
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-purpleBG-lighter dark:border-neutral-700 py-10 px-2 sm:px-5 mb-5">
        <TradingInfoPanel />
      </div>
    </div>
  );
};

export default BorrowerDashboard;
