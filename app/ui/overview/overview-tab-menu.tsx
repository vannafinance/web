"use client";

import React, { useEffect, useState } from "react";
import clsx from "clsx";
import LenderDashboard from "./lender-dashboard";
import BorrowerDashboard from "./borrower-dashboard";
import Image from "next/image";
import { useDarkMode } from "../header/use-dark-mode";
import { utils, Contract } from "ethers";
import {
  arbAddressList,
  baseAddressList,
  opAddressList,
} from "@/app/lib/web3-constants";
import ERC20 from "../../abi/vanna/v1/out/ERC20.sol/ERC20.json";
import Multicall from "@/app/abi/vanna/v1/out/Multicall.sol/Multicall.json";
import Registry from "../../abi/vanna/v1/out/Registry.sol/Registry.json";
import RiskEngine from "../../abi/vanna/v1/out/RiskEngine.sol/RiskEngine.json";
import VEther from "@/app/abi/vanna/v1/out/VEther.sol/VEther.json";
import VToken from "@/app/abi/vanna/v1/out/VToken.sol/VToken.json";
import OracleFacade from "../../abi/vanna/v1/out/OracleFacade.sol/OracleFacade.json";

import { ceilWithPrecision, check0xHex } from "@/app/lib/helper";
import {
  ARBITRUM_NETWORK,
  OPTIMISM_NETWORK,
  BASE_NETWORK,
} from "@/app/lib/constants";
import { useNetwork } from "@/app/context/network-context";
import { useWeb3React } from "@web3-react/core";
import { formatUnits } from "ethers/lib/utils";
import axios from "axios";
import { formatUSD } from "@/app/lib/number-format-helper";
import Loader from "../components/loader";

const TotalHoldings: React.FC<{ activeTab: string }> = ({ activeTab }) => {
  const { isDarkMode } = useDarkMode();
  const { account, library } = useWeb3React();
  const { currentNetwork } = useNetwork();

  const market = "ETH";
  // const [marketPrice, setMarketPrice] = useState(0.0);
  const [assetsPrice, setAssetsPrice] = useState([]);
  const [loading, setLoading] = useState(false);

  const [activeAccount, setActiveAccount] = useState<string | undefined>();

  const [totalHoldings, setTotalHolding] = useState<number | undefined>();
  const [totalReturnsAmount, setTotalReturnsAmount] = useState<
    number | undefined
  >();
  const [totalReturnsPercentage, setTotalReturnsPercentage] = useState<
    number | undefined
  >();
  const [healthFactor, setHealthFactor] = useState<number | undefined>();
  const [vannaLogoWithTextSrc, setVannaLogoWithTextSrc] = useState("");

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
  };

  const getPriceFromAssetsArray = (
    tokenSymbol: string,
    assets: MuxPriceFetchingResponseObject[] = assetsPrice
  ) => {
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

  const getAssetPrice = async (
    assetName = market
    // shouldSetMarketPrice = true
  ) => {
    const rsp = await axios.get("https://app.mux.network/api/liquidityAsset", {
      timeout: 10 * 1000,
    });
    const price = getPriceFromAssetsArray(assetName, rsp.data.assets);
    setAssetsPrice(rsp.data.assets);

    // if (shouldSetMarketPrice && price) {
    //   setMarketPrice(price);
    //   marketPrice;
    // }

    return price;
  };

  useEffect(() => {
    accountCheck();
    getAssetPrice();
  }, []);

  useEffect(() => {
    accountCheck();
  }, [account, library, currentNetwork]);

  useEffect(() => {
    const intervalId = setInterval(getAssetPrice, 100000); // Calls fetchData every second
    return () => clearInterval(intervalId); // This is the cleanup function
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      setVannaLogoWithTextSrc("/vanna-white-logo-text.svg");
    } else {
      setVannaLogoWithTextSrc("/vanna-black-logo-text.svg");
    }
  }, [isDarkMode]);

  useEffect(() => {
    setTotalHolding(undefined);
    setTotalReturnsAmount(undefined);
    setTotalReturnsPercentage(undefined);
    setHealthFactor(undefined);

    if (!currentNetwork) return;

    setLoading(true);

    const fetchValues = async () => {
      try {
        if (activeTab === "Trader") {
          if (!activeAccount) return;

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
            daiContract = new Contract(
              baseAddressList.daiTokenAddress,
              ERC20.abi,
              signer
            );
            usdcContract = new Contract(
              baseAddressList.usdcTokenAddress,
              ERC20.abi,
              signer
            );
            usdtContract = new Contract(
              baseAddressList.usdtTokenAddress,
              ERC20.abi,
              signer
            );
            wethContract = new Contract(
              baseAddressList.wethTokenAddress,
              ERC20.abi,
              signer
            );
            wbtcContract = new Contract(
              baseAddressList.wbtcTokenAddress,
              ERC20.abi,
              signer
            );
            vEtherContract = new Contract(
              baseAddressList.vEtherContractAddress,
              VEther.abi,
              signer
            );
            vDaiContract = new Contract(
              baseAddressList.vDaiContractAddress,
              VToken.abi,
              signer
            );
            vUsdcContract = new Contract(
              baseAddressList.vUSDCContractAddress,
              VToken.abi,
              signer
            );
            vUsdtContract = new Contract(
              baseAddressList.vUSDTContractAddress,
              VToken.abi,
              signer
            );
            vWbtcContract = new Contract(
              baseAddressList.vWBTCContractAddress,
              VToken.abi,
              signer
            );
          } else {
            return;
          }

          // ETH
          let accountBalance = await library?.getBalance(activeAccount);
          const waccountBalance = await wethContract.balanceOf(activeAccount);

          accountBalance = Number(accountBalance) + Number(waccountBalance);

          let borrowedBalance =
            await vEtherContract.callStatic.getBorrowBalance(activeAccount);
          borrowedBalance = Number(borrowedBalance);

          let val = Number(getPriceFromAssetsArray("ETH"));

          let balance = Number(
            (Number(accountBalance - borrowedBalance) / 1e18) * val
          );

          // USDC
          accountBalance = await usdcContract.balanceOf(activeAccount);

          borrowedBalance = await vUsdcContract.callStatic.getBorrowBalance(
            activeAccount
          );

          val = Number(getPriceFromAssetsArray("USDC"));
          balance += (Number(accountBalance - borrowedBalance) / 1e6) * val;

          // WBTC
          accountBalance = await wbtcContract.balanceOf(activeAccount);

          borrowedBalance = await vWbtcContract.callStatic.getBorrowBalance(
            activeAccount
          );

          val = Number(getPriceFromAssetsArray("BTC"));
          balance += (accountBalance - borrowedBalance) * val;

          //USDT
          accountBalance = await usdtContract.balanceOf(activeAccount);
          borrowedBalance = await vUsdtContract.callStatic.getBorrowBalance(
            activeAccount
          );
          val = Number(getPriceFromAssetsArray("USDT"));
          balance += (accountBalance - borrowedBalance) * val;

          // DAI
          accountBalance = await daiContract.balanceOf(activeAccount);
          borrowedBalance = await vDaiContract.callStatic.getBorrowBalance(
            activeAccount
          );
          val = Number(getPriceFromAssetsArray("DAI"));
          balance += (accountBalance - borrowedBalance) * val;

          //@TODO: currently we are fetchign the currnt balance with PNL
          // need to subtract the PNL
          // tToken
          if (tTokenOracleContract !== undefined) {
            accountBalance =
              (await tTokenOracleContract.callStatic.getPrice(
                opAddressList.tTokenAddress,
                activeAccount
              )) / 1e18;
            val =
              accountBalance * Number(await getPriceFromAssetsArray("WETH"));
          }

          balance += val;
          // totalHoldings = balance;
          
          const riskEngineContract = new Contract(
            opAddressList.riskEngineContractAddress,
            RiskEngine.abi,
            signer
          );
          //TODO: vatsal rework on this getBalance varibale till the assigne you have to rework for fetching the data
          let totalbalance =
            (await riskEngineContract.callStatic.getBalance(activeAccount)) /
            1e18;

          totalbalance = totalbalance * Number(getPriceFromAssetsArray("WETH"));

          let totalBorrowBalance =
            (await riskEngineContract.callStatic.getBorrows(activeAccount)) /
            1e18;

          totalBorrowBalance =
            totalBorrowBalance * Number(getPriceFromAssetsArray("WETH"));

          let balanceWithoutReapy;
          if (tTokenOracleContract !== undefined) {
            balanceWithoutReapy =
              (await tTokenOracleContract.callStatic.getPrice(
                opAddressList.tTokenAddress,
                activeAccount
              )) / 1e18;
          }
          // @TODO: hardcorded things need to work
          // D = Deposit Amount 
          // B = Borrow Amount
          // P = Profit and Loss (PNL)
          // L = Total Leverage
          // TotalBalance=D+B+P
          // L×D=B+D
          // B=D(L−1)
          // P = TotalBalance − B ( 1 / (L - 1) + 1)
          const totalReturnsAmount = Number(balanceWithoutReapy);
          const totalReturnsPercentage = (totalReturnsAmount / balance) * 100;
          // add color while showing this
          const healthFactor = totalbalance / Number(totalBorrowBalance);
          
          // if healther < 1.5 the color red else green

          setTotalHolding(balance);
          setTotalReturnsAmount(totalReturnsAmount / 1e1);
          setTotalReturnsPercentage(totalReturnsPercentage / 1e1);
          setHealthFactor(healthFactor);
        } else {
          if (!account) return;
          const iFaceEth = new utils.Interface(VEther.abi);
          const iFaceToken = new utils.Interface(VToken.abi);
          let calldata = [];
          let tempData;
          //User assets balance

          if (currentNetwork.id === ARBITRUM_NETWORK) {
            const MCcontract = new Contract(
              arbAddressList.multicallAddress,
              Multicall.abi,
              library
            );
            calldata = [];
            tempData = null;

            //ETH
            tempData = utils.arrayify(
              iFaceEth.encodeFunctionData("balanceOf", [account])
            );
            calldata.push([arbAddressList.vEtherContractAddress, tempData]);

            //WBTC
            tempData = utils.arrayify(
              iFaceToken.encodeFunctionData("balanceOf", [account])
            );
            calldata.push([arbAddressList.vWBTCContractAddress, tempData]);

            //USDC
            tempData = utils.arrayify(
              iFaceToken.encodeFunctionData("balanceOf", [account])
            );
            calldata.push([arbAddressList.vUSDCContractAddress, tempData]);

            //USDT
            tempData = utils.arrayify(
              iFaceToken.encodeFunctionData("balanceOf", [account])
            );
            calldata.push([arbAddressList.vUSDTContractAddress, tempData]);

            //DAI
            tempData = utils.arrayify(
              iFaceToken.encodeFunctionData("balanceOf", [account])
            );
            calldata.push([arbAddressList.vDaiContractAddress, tempData]);

            const res = await MCcontract.callStatic.aggregate(calldata);

            //User v token Asset balance
            const ethBal = formatUnits(check0xHex(res.returnData[0]), 18);
            const wbtcBal = formatUnits(check0xHex(res.returnData[1]), 18);
            const usdcBal = formatUnits(check0xHex(res.returnData[2]), 6);
            const usdtBal = formatUnits(check0xHex(res.returnData[3]), 6);
            const daiBal = formatUnits(check0xHex(res.returnData[4]), 18);

            // convertSharesToAssets

            calldata = [];
            //ETH
            tempData = utils.arrayify(
              iFaceEth.encodeFunctionData("convertToAssets", [ethBal])
            );
            calldata.push([arbAddressList.vEtherContractAddress, tempData]);

            // WBTC
            tempData = utils.arrayify(
              iFaceToken.encodeFunctionData("convertToAssets", [wbtcBal])
            );
            calldata.push([arbAddressList.vWBTCContractAddress, tempData]);

            //USDC
            tempData = utils.arrayify(
              iFaceToken.encodeFunctionData("convertToAssets", [usdcBal])
            );
            calldata.push([arbAddressList.vUSDCContractAddress, tempData]);

            // USDT
            tempData = utils.arrayify(
              iFaceToken.encodeFunctionData("convertToAssets", [usdtBal])
            );
            calldata.push([arbAddressList.vUSDTContractAddress, tempData]);

            // DAI
            tempData = utils.arrayify(
              iFaceToken.encodeFunctionData("convertToAssets", [daiBal])
            );
            calldata.push([arbAddressList.vDaiContractAddress, tempData]);

            const res1 = await MCcontract.callStatic.aggregate(calldata);

            //User actual Asset balance
            const ethusdcBal = formatUnits(check0xHex(res1.returnData[0]), 18);
            const wbtcusdcBal = formatUnits(check0xHex(res1.returnData[1]), 18);
            const usdcusdcBal = formatUnits(check0xHex(res1.returnData[2]), 6);
            const usdtusdcBal = formatUnits(check0xHex(res1.returnData[3]), 6);
            const daiusdcBal = formatUnits(check0xHex(res1.returnData[4]), 18);

            let val = Number(getPriceFromAssetsArray("ETH"));
            let totalHoldings = Number(ethusdcBal) * val;
            let initialLending = Number(ethBal) * val;

            val = Number(getPriceFromAssetsArray("BTC"));
            totalHoldings += Number(wbtcusdcBal) * val;
            initialLending += Number(wbtcBal) * val;

            val = Number(getPriceFromAssetsArray("USDC"));
            totalHoldings += Number(usdcusdcBal) * val;
            initialLending += Number(usdcBal) * val;

            val = Number(getPriceFromAssetsArray("USDT"));
            totalHoldings += Number(usdtusdcBal) * val;
            initialLending += Number(usdtBal) * val;

            val = Number(getPriceFromAssetsArray("DAI"));
            totalHoldings += Number(daiusdcBal) * val;
            initialLending += Number(daiBal) * val;

            const totalReturnsAmount = totalHoldings - initialLending;
            const percentageGainLoss =
              (totalReturnsAmount / initialLending) * 100;

            setTotalHolding(totalHoldings);
            setTotalReturnsAmount(totalReturnsAmount);
            setTotalReturnsPercentage(percentageGainLoss);
          } else if (currentNetwork.id === OPTIMISM_NETWORK) {
            const MCcontract = new Contract(
              opAddressList.multicallAddress,
              Multicall.abi,
              library
            );
            calldata = [];
            tempData = null;
            //ETH
            tempData = utils.arrayify(
              iFaceEth.encodeFunctionData("balanceOf", [account])
            );
            calldata.push([opAddressList.vEtherContractAddress, tempData]);

            //WBTC
            tempData = utils.arrayify(
              iFaceToken.encodeFunctionData("balanceOf", [account])
            );
            calldata.push([opAddressList.vWBTCContractAddress, tempData]);

            //USDC
            tempData = utils.arrayify(
              iFaceToken.encodeFunctionData("balanceOf", [account])
            );
            calldata.push([opAddressList.vUSDCContractAddress, tempData]);

            //USDT
            tempData = utils.arrayify(
              iFaceToken.encodeFunctionData("balanceOf", [account])
            );
            calldata.push([opAddressList.vUSDTContractAddress, tempData]);

            //DAI
            tempData = utils.arrayify(
              iFaceToken.encodeFunctionData("balanceOf", [account])
            );
            calldata.push([opAddressList.vDaiContractAddress, tempData]);

            const res = await MCcontract.callStatic.aggregate(calldata);

            //User v token Asset balance
            const ethBal = formatUnits(check0xHex(res.returnData[0]), 18);
            const wbtcBal = formatUnits(check0xHex(res.returnData[1]), 18);
            const usdcBal = formatUnits(check0xHex(res.returnData[2]), 6);
            const usdtBal = formatUnits(check0xHex(res.returnData[3]), 6);
            const daiBal = formatUnits(check0xHex(res.returnData[4]), 18);

            // convertSharesToAssets

            calldata = [];
            //ETH
            tempData = utils.arrayify(
              iFaceEth.encodeFunctionData("convertToAssets", [
                res.returnData[0],
              ])
            );
            calldata.push([opAddressList.vEtherContractAddress, tempData]);
            // WBTC
            tempData = utils.arrayify(
              iFaceToken.encodeFunctionData("convertToAssets", [
                res.returnData[1],
              ])
            );
            calldata.push([opAddressList.vWBTCContractAddress, tempData]);

            //USDC
            tempData = utils.arrayify(
              iFaceToken.encodeFunctionData("convertToAssets", [
                res.returnData[2],
              ])
            );
            calldata.push([opAddressList.vUSDCContractAddress, tempData]);

            // USDT
            tempData = utils.arrayify(
              iFaceToken.encodeFunctionData("convertToAssets", [
                res.returnData[3],
              ])
            );
            calldata.push([opAddressList.vUSDTContractAddress, tempData]);

            // DAI
            tempData = utils.arrayify(
              iFaceToken.encodeFunctionData("convertToAssets", [
                res.returnData[4],
              ])
            );
            calldata.push([opAddressList.vDaiContractAddress, tempData]);

            const res1 = await MCcontract.callStatic.aggregate(calldata);

            //User actual Asset balance
            const ethusdcBal = formatUnits(check0xHex(res1.returnData[0]), 18);
            const wbtcusdcBal = formatUnits(check0xHex(res1.returnData[1]), 18);
            const usdcusdcBal = formatUnits(check0xHex(res1.returnData[2]), 6);
            const usdtusdcBal = formatUnits(check0xHex(res1.returnData[3]), 6);
            const daiusdcBal = formatUnits(check0xHex(res1.returnData[4]), 18);

            let val = Number(getPriceFromAssetsArray("ETH"));
            let totalHoldings = Number(ethusdcBal) * val;
            let initialLending = Number(ethBal) * val;

            val = Number(getPriceFromAssetsArray("BTC"));
            totalHoldings += Number(wbtcusdcBal) * val;
            initialLending += Number(wbtcBal) * val;

            val = Number(getPriceFromAssetsArray("USDC"));
            totalHoldings += Number(usdcusdcBal) * val;
            initialLending += Number(usdcBal) * val;

            val = Number(getPriceFromAssetsArray("USDT"));
            totalHoldings += Number(usdtusdcBal) * val;
            initialLending += Number(usdtBal) * val;

            val = Number(getPriceFromAssetsArray("DAI"));
            totalHoldings += Number(daiusdcBal) * val;
            initialLending += Number(daiBal) * val;

            const totalReturnsAmount = totalHoldings - initialLending;
            const percentageGainLoss =
              (totalReturnsAmount / initialLending) * 100;

            setTotalHolding(totalHoldings);
            setTotalReturnsAmount(totalReturnsAmount);
            setTotalReturnsPercentage(percentageGainLoss);
          } else if (currentNetwork.id === BASE_NETWORK) {
            const MCcontract = new Contract(
              baseAddressList.multicallAddress,
              Multicall.abi,
              library
            );
            calldata = [];
            tempData = null;

            //ETH
            tempData = utils.arrayify(
              iFaceEth.encodeFunctionData("balanceOf", [account])
            );
            calldata.push([baseAddressList.vEtherContractAddress, tempData]);

            //WBTC
            tempData = utils.arrayify(
              iFaceToken.encodeFunctionData("balanceOf", [account])
            );
            calldata.push([baseAddressList.vWBTCContractAddress, tempData]);

            //USDC
            tempData = utils.arrayify(
              iFaceToken.encodeFunctionData("balanceOf", [account])
            );
            calldata.push([baseAddressList.vUSDCContractAddress, tempData]);

            //USDT
            tempData = utils.arrayify(
              iFaceToken.encodeFunctionData("balanceOf", [account])
            );
            calldata.push([baseAddressList.vUSDTContractAddress, tempData]);

            //DAI
            tempData = utils.arrayify(
              iFaceToken.encodeFunctionData("balanceOf", [account])
            );
            calldata.push([baseAddressList.vDaiContractAddress, tempData]);

            const res = await MCcontract.callStatic.aggregate(calldata);

            //User v token Asset balance
            const ethBal = formatUnits(check0xHex(res.returnData[0]), 18);
            const wbtcBal = formatUnits(check0xHex(res.returnData[1]), 18);
            const usdcBal = formatUnits(check0xHex(res.returnData[2]), 6);
            const usdtBal = formatUnits(check0xHex(res.returnData[3]), 6);
            const daiBal = formatUnits(check0xHex(res.returnData[4]), 18);

            // convertSharesToAssets
            calldata = [];

            //ETH
            tempData = utils.arrayify(
              iFaceEth.encodeFunctionData("convertToAssets", [ethBal])
            );
            calldata.push([baseAddressList.vEtherContractAddress, tempData]);

            // WBTC
            tempData = utils.arrayify(
              iFaceToken.encodeFunctionData("convertToAssets", [wbtcBal])
            );
            calldata.push([baseAddressList.vWBTCContractAddress, tempData]);

            //USDC
            tempData = utils.arrayify(
              iFaceToken.encodeFunctionData("convertToAssets", [usdcBal])
            );
            calldata.push([baseAddressList.vUSDCContractAddress, tempData]);

            // USDT
            tempData = utils.arrayify(
              iFaceToken.encodeFunctionData("convertToAssets", [usdtBal])
            );
            calldata.push([baseAddressList.vUSDTContractAddress, tempData]);

            // DAI
            tempData = utils.arrayify(
              iFaceToken.encodeFunctionData("convertToAssets", [daiBal])
            );
            calldata.push([baseAddressList.vDaiContractAddress, tempData]);

            const res1 = await MCcontract.callStatic.aggregate(calldata);

            //User actual Asset balance
            const ethusdcBal = formatUnits(check0xHex(res1.returnData[0]), 18);
            const wbtcusdcBal = formatUnits(check0xHex(res1.returnData[1]), 18);
            const usdcusdcBal = formatUnits(check0xHex(res1.returnData[2]), 6);
            const usdtusdcBal = formatUnits(check0xHex(res1.returnData[3]), 6);
            const daiusdcBal = formatUnits(check0xHex(res1.returnData[4]), 18);

            let val = Number(getPriceFromAssetsArray("ETH"));
            let totalHoldings = Number(ethusdcBal) * val;
            let initialLending = Number(ethBal) * val;

            val = Number(getPriceFromAssetsArray("BTC"));
            totalHoldings += Number(wbtcusdcBal) * val;
            initialLending += Number(wbtcBal) * val;

            val = Number(getPriceFromAssetsArray("USDC"));
            totalHoldings += Number(usdcusdcBal) * val;
            initialLending += Number(usdcBal) * val;

            val = Number(getPriceFromAssetsArray("USDT"));
            totalHoldings += Number(usdtusdcBal) * val;
            initialLending += Number(usdtBal) * val;

            val = Number(getPriceFromAssetsArray("DAI"));
            totalHoldings += Number(daiusdcBal) * val;
            initialLending += Number(daiBal) * val;

            const totalReturnsAmount = totalHoldings - initialLending;
            const percentageGainLoss =
              (totalReturnsAmount / initialLending) * 100;

            setTotalHolding(totalHoldings);
            setTotalReturnsAmount(totalReturnsAmount);
            setTotalReturnsPercentage(percentageGainLoss);
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchValues();

    setLoading(false);
  }, [activeTab, currentNetwork, activeAccount, account, assetsPrice, library]);

  return (
    <div className="bg-white dark:bg-baseDark rounded-3xl border border-purpleBG-lighter dark:border-neutral-700 p-4 lg:p-7 mb-7">
      <div className="flex justify-between items-start mb-10">
        <div>
          <h2 className="text-base font-medium text-neutral-500">
            {activeTab === "Trader" ? "Initial Margin" : "Total Holdings"}
          </h2>
          <p className="text-3xl font-semibold mb-2">
            {loading ? (
              <Loader />
            ) : totalHoldings ? (
              formatUSD(ceilWithPrecision(String(totalHoldings), 2))
            ) : (
              "0"
            )}
          </p>
        </div>
        <Image src={vannaLogoWithTextSrc} width="92" height="28" alt="Vanna" />
      </div>
      <div
        className={clsx(
          "flex items-start",
          activeTab === "Trader" ? "justify-between" : "justify-start"
        )}
      >
        <div>
          <p
            className={clsx(
              "text-3xl font-semibold",
              totalReturnsAmount && totalReturnsPercentage
                ? totalReturnsPercentage > 0
                  ? "text-baseSuccess-300"
                  : "text-baseSecondary-500"
                : "text-baseBlack dark:text-baseWhite"
            )}
          >
            {loading ? (
              <Loader />
            ) : totalReturnsAmount ? (
              formatUSD(ceilWithPrecision(String(totalReturnsAmount), 2))
            ) : (
              "0"
            )}
            {!loading && totalReturnsAmount && totalReturnsAmount > 0 && totalReturnsPercentage ? (
              <span className="text-sm font-medium">
                ({ceilWithPrecision(String(totalReturnsPercentage), 2)}%)
              </span>
            ) : ""}
          </p>
          <p className="text-sm text-gray-500">Total Returns</p>
        </div>
        {activeTab === "Trader" && (
          <div>
            <p
              className={clsx(
                "text-2xl font-semibold",
                healthFactor && healthFactor < 1.5
                  ? "text-baseSecondary-500"
                  : "text-baseSuccess-300"
              )}
            >
              {loading ? (
                <Loader />
              ) : healthFactor ? (
                ceilWithPrecision(String(healthFactor), 2)
              ) : (
                "0"
              )}
            </p>
            <p className="text-sm text-gray-500">Health Factor</p>
          </div>
        )}
      </div>
    </div>
  );
};

const Rewards: React.FC = () => (
  <div className="bg-white dark:bg-baseDark rounded-3xl border border-purpleBG-lighter dark:border-neutral-700 p-4 xl:p-10 mt-4">
    <h2 className="text-xl font-semibold mb-9">Rewards</h2>
    <div className="bg-baseComplementary dark:bg-baseDarkComplementary rounded-lg p-2 mb-4">
      <div className="flex justify-between text-base font-medium mb-2">
        <span>Activity</span>
        <span>Your Allocation</span>
        <span>Claim</span>
      </div>
    </div>
    <div className="px-2 lg:px-4">
      {["WETH", "USDC", "WBTC"].map((pool, index) => (
        <div
          key={index}
          className="flex justify-between text-base font-medium items-center mb-2 py-2"
        >
          <span>{pool}</span>
          <span>{(index + 1) * 10} points</span>
          <button className="relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm font-semibold rounded-md group bg-gradient-to-br from-gradient-1 to-gradient-2 group-hover:from-gradient-1 group-hover:to-gradient-2 hover:text-white focus:ring-4 focus:outline-none">
            <span className="relative px-2 py-1.5 transition-all ease-in duration-75 bg-white dark:bg-baseDark rounded-md group-hover:bg-opacity-0">
              Claim
            </span>
          </button>
        </div>
      ))}
    </div>
  </div>
);

const OverviewTabMenu = () => {
  const [activeTab, setActiveTab] = useState("Lender");

  const renderTabContent = () => {
    switch (activeTab) {
      case "Lender":
        return <LenderDashboard />;
      case "Trader":
        return <BorrowerDashboard />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white dark:bg-baseDark mt-6 rounded-lg text-baseBlack dark:text-baseWhite">
      <div className="flex space-x-6 mb-6 border-b border-neutral-100 dark:border-neutral-700 pb-2 text-xl">
        {["Lender", "Trader"].map((tab) => (
          <div
            key={tab}
            className={clsx(
              "pb-2 relative font-semibold cursor-pointer flex flex-row text-neutral-500",
              activeTab === tab &&
                "after:content-[''] after:absolute after:-bottom-1/3 after:left-0 after:w-full after:h-[3px] after:bg-gradient-to-r after:from-gradient-1 after:to-gradient-2"
            )}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </div>
        ))}
      </div>

      <div className="container mx-auto pt-2">
        <div className="flex flex-col lg:flex-row">
          <div className="w-full lg:w-1/2 xl:w-1/3 pr-0 lg:pr-4 mb-4 lg:mb-0">
            <TotalHoldings activeTab={activeTab} />
            <Rewards />
          </div>
          <div className="w-full lg:w-1/2 xl:w-2/3">{renderTabContent()}</div>
        </div>
      </div>
    </div>
  );
};

export default OverviewTabMenu;
