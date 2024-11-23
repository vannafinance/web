/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { utils, Contract } from "ethers";
import {
  arbAddressList,
  baseAddressList,
  opAddressList,
} from "@/app/lib/web3-constants";
import DefaultRateModel from "@/app/abi/vanna/v1/out/DefaultRateModel.sol/DefaultRateModel.json";
import Multicall from "@/app/abi/vanna/v1/out/Multicall.sol/Multicall.json";
import VEther from "@/app/abi/vanna/v1/out/VEther.sol/VEther.json";
import VToken from "@/app/abi/vanna/v1/out/VToken.sol/VToken.json";
import { ceilWithPrecision, check0xHex } from "@/app/lib/helper";
import {
  SECS_PER_YEAR,
  ARBITRUM_NETWORK,
  OPTIMISM_NETWORK,
  BASE_NETWORK,
} from "@/app/lib/constants";
import { useNetwork } from "@/app/context/network-context";
import { useWeb3React } from "@web3-react/core";
import { formatUnits } from "ethers/lib/utils";
import axios from "axios";
import { formatUSD } from "@/app/lib/number-format-helper";

const Pool: React.FC<PoolPropsLenderDashboard> = ({
  number,
  name,
  amount,
  profit,
  apy,
  percentage,
  icon,
  isLoss,
}) => (
  <div className="grid grid-cols-5 justify-between bg-white dark:bg-baseDark rounded-lg p-3 mb-2 text-center">
    <div>{number}</div>
    <div className="flex flex-row justify-between w-20">
      <Image src={icon} alt={name} width={24} height={24} /> {name}
    </div>
    <div>
      {amount} {name}
    </div>
    <div>
      {formatUSD(profit)}{" "}
      {isLoss ? (
        <span className="text-baseSecondary-500 text-xs">({percentage}%)</span>
      ) : (
        <span className="text-baseSuccess-300 text-xs">({percentage}%)</span>
      )}
    </div>
    <div>{apy}%</div>
  </div>
);

const LenderDashboard: React.FC = () => {
  const { account, library } = useWeb3React();
  const { currentNetwork } = useNetwork();

  const market = "ETH";
  const [assetsPrice, setAssetsPrice] = useState([]);

  const [pools, setPools] = useState([
    {
      name: "WETH",
      amount: 0,
      profit: 0,
      apy: 0,
      percentage: 0,
      icon: "/eth-icon.svg",
    },
    {
      name: "WBTC",
      amount: 0,
      profit: 0,
      apy: 0,
      percentage: 0,
      icon: "/btc-icon.svg",
    },
    {
      name: "USDC",
      amount: 0,
      profit: 0,
      apy: 0,
      percentage: 0,
      icon: "/usdc-icon.svg",
    },
    {
      name: "USDT",
      amount: 0,
      profit: 0,
      apy: 0,
      percentage: 0,
      icon: "/usdt-icon.svg",
    },
    {
      name: "DAI",
      amount: 0,
      profit: 0,
      apy: 0,
      percentage: 0,
      icon: "/dai-icon.svg",
    },
  ]);

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

  const getAssetPrice = async (assetName = market) => {
    const rsp = await axios.get("https://app.mux.network/api/liquidityAsset", {
      timeout: 10 * 1000,
    });
    const price = getPriceFromAssetsArray(assetName, rsp.data.assets);
    setAssetsPrice(rsp.data.assets);

    return price;
  };

  const fetchValues = async () => {
    if (!currentNetwork || !account) return;
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

      const ethPnl = Number(ethusdcBal) - Number(ethBal);
      const ethPercentage = (ethPnl / Number(ethusdcBal)) * 100;
      const wbtcPnl = Number(wbtcusdcBal) - Number(wbtcBal);
      const wbtcPercentage = (wbtcPnl / Number(wbtcusdcBal)) * 100;
      const usdcPnl = Number(usdcusdcBal) - Number(usdcBal);
      const usdcPercentage = (usdcPnl / Number(usdcusdcBal)) * 100;
      const usdtPnl = Number(usdtusdcBal) - Number(usdtBal);
      const usdtPercentage = (usdtPnl / Number(usdtusdcBal)) * 100;
      const daiPnl = Number(daiusdcBal) - Number(daiBal);
      const daiPercentage = (daiPnl / Number(daiusdcBal)) * 100;

      calldata = [];
      tempData = null;
      // ETH
      tempData = utils.arrayify(iFaceEth.encodeFunctionData("totalSupply", []));
      calldata.push([arbAddressList.vEtherContractAddress, tempData]);

      tempData = utils.arrayify(
        iFaceEth.encodeFunctionData("balanceOf", [
          arbAddressList.vEtherContractAddress,
        ])
      );
      calldata.push([arbAddressList.wethTokenAddress, tempData]);

      // WBTC

      tempData = utils.arrayify(
        iFaceToken.encodeFunctionData("totalSupply", [])
      );

      calldata.push([arbAddressList.vWBTCContractAddress, tempData]);
      tempData = utils.arrayify(
        iFaceToken.encodeFunctionData("balanceOf", [
          arbAddressList.vWBTCContractAddress,
        ])
      );
      calldata.push([arbAddressList.wbtcTokenAddress, tempData]);

      // USDC
      tempData = utils.arrayify(
        iFaceToken.encodeFunctionData("totalSupply", [])
      );
      calldata.push([arbAddressList.vUSDCContractAddress, tempData]);

      tempData = utils.arrayify(
        iFaceToken.encodeFunctionData("balanceOf", [
          arbAddressList.vUSDCContractAddress,
        ])
      );
      calldata.push([arbAddressList.usdcTokenAddress, tempData]);

      // USDT
      tempData = utils.arrayify(
        iFaceToken.encodeFunctionData("totalSupply", [])
      );
      calldata.push([arbAddressList.vUSDTContractAddress, tempData]);

      tempData = utils.arrayify(
        iFaceToken.encodeFunctionData("balanceOf", [
          arbAddressList.vUSDTContractAddress,
        ])
      );
      calldata.push([arbAddressList.usdtTokenAddress, tempData]);

      // DAI
      tempData = utils.arrayify(
        iFaceToken.encodeFunctionData("totalSupply", [])
      );
      calldata.push([arbAddressList.vDaiContractAddress, tempData]);

      tempData = utils.arrayify(
        iFaceToken.encodeFunctionData("balanceOf", [
          arbAddressList.vDaiContractAddress,
        ])
      );
      calldata.push([arbAddressList.daiTokenAddress, tempData]);

      // totalBorrow
      //ETH
      tempData = utils.arrayify(iFaceEth.encodeFunctionData("getBorrows", []));
      calldata.push([arbAddressList.vEtherContractAddress, tempData]);

      //WBTC
      tempData = utils.arrayify(
        iFaceToken.encodeFunctionData("getBorrows", [])
      );
      calldata.push([arbAddressList.vWBTCContractAddress, tempData]);

      //USDC
      tempData = utils.arrayify(
        iFaceToken.encodeFunctionData("getBorrows", [])
      );
      calldata.push([arbAddressList.vUSDCContractAddress, tempData]);

      //USDT
      tempData = utils.arrayify(
        iFaceToken.encodeFunctionData("getBorrows", [])
      );
      calldata.push([arbAddressList.vUSDTContractAddress, tempData]);

      //DAI
      tempData = utils.arrayify(
        iFaceToken.encodeFunctionData("getBorrows", [])
      );
      calldata.push([arbAddressList.vDaiContractAddress, tempData]);

      //User assets balance

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

      const res2 = await MCcontract.callStatic.aggregate(calldata);

      //avaibaleAssetsInContract

      const avaibaleETH = check0xHex(res2.returnData[1]);
      const avaibaleBTC = check0xHex(res2.returnData[3]);
      const avaibaleUSDC = check0xHex(res2.returnData[5]);
      const avaibaleUSDT = check0xHex(res2.returnData[7]);
      const avaibaleDai = check0xHex(res2.returnData[9]);

      // totalBorrow

      const ethTotalBorrow = check0xHex(res2.returnData[10]);
      const wbtcTotalBorrow = check0xHex(res2.returnData[11]);
      const usdcTotalBorrow = check0xHex(res2.returnData[12]);
      const usdtTotalBorrow = check0xHex(res2.returnData[13]);
      const daiTotalBorrow = check0xHex(res2.returnData[14]);

      // Dependent varibale data fetching
      const calldata1 = [];
      let tempData1;
      const iFaceRateModel = new utils.Interface(DefaultRateModel.abi);

      //BorrowAPY
      //ETH
      tempData1 = utils.arrayify(
        iFaceRateModel.encodeFunctionData("getBorrowRatePerSecond", [
          avaibaleETH,
          ethTotalBorrow,
        ])
      );

      calldata1.push([arbAddressList.rateModelContractAddress, tempData1]);

      //BTC
      tempData1 = utils.arrayify(
        iFaceRateModel.encodeFunctionData("getBorrowRatePerSecond", [
          avaibaleBTC,
          wbtcTotalBorrow,
        ])
      );
      calldata1.push([arbAddressList.rateModelContractAddress, tempData1]);

      //USDC
      tempData1 = utils.arrayify(
        iFaceRateModel.encodeFunctionData("getBorrowRatePerSecond", [
          avaibaleUSDC,
          usdcTotalBorrow,
        ])
      );
      calldata1.push([arbAddressList.rateModelContractAddress, tempData1]);

      //USDT
      tempData1 = utils.arrayify(
        iFaceRateModel.encodeFunctionData("getBorrowRatePerSecond", [
          avaibaleUSDT,
          usdtTotalBorrow,
        ])
      );
      calldata1.push([arbAddressList.rateModelContractAddress, tempData1]);

      //DAI
      tempData1 = utils.arrayify(
        iFaceRateModel.encodeFunctionData("getBorrowRatePerSecond", [
          avaibaleDai,
          daiTotalBorrow,
        ])
      );
      calldata1.push([arbAddressList.rateModelContractAddress, tempData1]);

      const res3 = await MCcontract.callStatic.aggregate(calldata1);

      const ethBorrowAPY = res3.returnData[0];
      const ethBorrowApy =
        ethTotalBorrow != 0
          ? parseFloat(formatUnits(ethBorrowAPY)) * SECS_PER_YEAR * 1e3
          : 0;

      const btcBorrowAPY = res3.returnData[1];
      const wbtcBorrowApy =
        wbtcTotalBorrow != 0
          ? parseFloat(formatUnits(btcBorrowAPY)) * SECS_PER_YEAR * 1e3
          : 0;

      const usdcBorrowAPY = res3.returnData[2];
      const usdcBorrowApy =
        usdcTotalBorrow != 0
          ? parseFloat(formatUnits(usdcBorrowAPY)) * SECS_PER_YEAR * 1e3
          : 0;

      const usdtBorrowAPY = res3.returnData[3];
      const usdtBorrowApy =
        usdtTotalBorrow != 0
          ? parseFloat(formatUnits(usdtBorrowAPY)) * SECS_PER_YEAR * 1e3
          : 0;

      const daiBorrowAPY = res3.returnData[4];
      const daiBorrowApy =
        daiTotalBorrow != 0
          ? parseFloat(formatUnits(daiBorrowAPY)) * SECS_PER_YEAR * 1e3
          : 0;

      const updatedPools = pools.map((pool) => {
        if (pool.name === "WETH" && Number(ethBal) > 0) {
          return {
            ...pool,
            amount: Number(ethBal),
            profit: ethPnl,
            apy: ethBorrowApy,
            percentage: ethPercentage,
          };
        }
        if (pool.name === "WBTC" && Number(wbtcBal) > 0) {
          return {
            ...pool,
            amount: Number(wbtcBal),
            profit: wbtcPnl,
            apy: wbtcBorrowApy,
            percentage: wbtcPercentage,
          };
        }
        if (pool.name === "USDC" && Number(usdcBal) > 0) {
          return {
            ...pool,
            amount: Number(usdcBal),
            profit: usdcPnl,
            apy: usdcBorrowApy,
            percentage: usdcPercentage,
          };
        }
        if (pool.name === "USDT" && Number(usdtBal) > 0) {
          return {
            ...pool,
            amount: Number(usdtBal),
            profit: usdtPnl,
            apy: usdtBorrowApy,
            percentage: usdtPercentage,
          };
        }
        if (pool.name === "DAI" && Number(daiBal) > 0) {
          return {
            ...pool,
            amount: Number(daiBal),
            profit: daiPnl,
            apy: daiBorrowApy,
            percentage: daiPercentage,
          };
        }
        return pool;
      });

      setPools(updatedPools);
    } else if (currentNetwork.id === OPTIMISM_NETWORK) {
      const MCcontract = new Contract(
        opAddressList.multicallAddress,
        Multicall.abi,
        library
      );

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

      //ETH
      tempData = utils.arrayify(
        iFaceEth.encodeFunctionData("convertToAssets", [res.returnData[0]])
      );
      calldata.push([opAddressList.vEtherContractAddress, tempData]);

      // WBTC
      tempData = utils.arrayify(
        iFaceToken.encodeFunctionData("convertToAssets", [res.returnData[1]])
      );
      calldata.push([opAddressList.vWBTCContractAddress, tempData]);

      //USDC
      tempData = utils.arrayify(
        iFaceToken.encodeFunctionData("convertToAssets", [res.returnData[2]])
      );
      calldata.push([opAddressList.vUSDCContractAddress, tempData]);

      // USDT
      tempData = utils.arrayify(
        iFaceToken.encodeFunctionData("convertToAssets", [res.returnData[3]])
      );
      calldata.push([opAddressList.vUSDTContractAddress, tempData]);

      // DAI
      tempData = utils.arrayify(
        iFaceToken.encodeFunctionData("convertToAssets", [res.returnData[4]])
      );
      calldata.push([opAddressList.vDaiContractAddress, tempData]);

      const res1 = await MCcontract.callStatic.aggregate(calldata);

      //User actual Asset balance
      const ethusdcBal = formatUnits(check0xHex(res1.returnData[0]), 18);
      const wbtcusdcBal = formatUnits(check0xHex(res1.returnData[1]), 18);
      const usdcusdcBal = formatUnits(check0xHex(res1.returnData[2]), 6);
      const usdtusdcBal = formatUnits(check0xHex(res1.returnData[3]), 6);
      const daiusdcBal = formatUnits(check0xHex(res1.returnData[4]), 18);
      // @TEMP not able to get the actual value from the multicall that's why this way
      const vEtherContract = new Contract(
        opAddressList.vEtherContractAddress,
        VEther.abi,
        library
      );
      const vUsdcContract = new Contract(
        opAddressList.vUSDCContractAddress,
        VToken.abi,
        library
      );

      const ethbal = await vEtherContract.balanceOf(account);
      const ethusdcfetchBal =
        (await vEtherContract.convertToAssets(ethbal)) / 1;
      const usdcbal = (await vUsdcContract.balanceOf(account)) / 1;
      const UusdcfetchBal = (await vUsdcContract.convertToAssets(usdcbal)) / 1;

      // const ethusdcfetchBal = (await vEtherContract.convertToAssets(ethBal)/1e18);

      let ethPnl = (Number(ethusdcfetchBal) - Number(ethbal)) / 1e18;
      const ethPercentage = (ethPnl / Number(ethusdcfetchBal)) * 100;

      const usdcPnl = Number(UusdcfetchBal - usdcbal) / 1e6;
      const usdcPercentage = usdcPnl / Number(usdcusdcBal);
      const ethval = Number(await getPriceFromAssetsArray("WETH"));
      ethPnl = ethPnl * ethval;

      const wbtcPnl = Number(wbtcusdcBal) - Number(wbtcBal);
      const wbtcPercentage = (wbtcPnl / Number(wbtcusdcBal)) * 100;
      // const usdcPnl = Number(usdcusdcBal) - Number(usdcBal);
      // const usdcPercentage = (usdcPnl / Number(usdcusdcBal)) * 100;
      const usdtPnl = Number(usdtusdcBal) - Number(usdtBal);
      const usdtPercentage = (usdtPnl / Number(usdtusdcBal)) * 100;
      const daiPnl = Number(daiusdcBal) - Number(daiBal);
      const daiPercentage = (daiPnl / Number(daiusdcBal)) * 100;

      // ----------------- For borrow APY -----------------------

      calldata = [];
      tempData = null;
      // ETH
      tempData = utils.arrayify(iFaceEth.encodeFunctionData("totalSupply", []));
      calldata.push([opAddressList.vEtherContractAddress, tempData]);

      tempData = utils.arrayify(
        iFaceEth.encodeFunctionData("balanceOf", [
          opAddressList.vEtherContractAddress,
        ])
      );
      calldata.push([opAddressList.wethTokenAddress, tempData]);

      // WBTC

      tempData = utils.arrayify(
        iFaceToken.encodeFunctionData("totalSupply", [])
      );

      calldata.push([opAddressList.vWBTCContractAddress, tempData]);
      tempData = utils.arrayify(
        iFaceToken.encodeFunctionData("balanceOf", [
          opAddressList.vWBTCContractAddress,
        ])
      );
      calldata.push([opAddressList.wbtcTokenAddress, tempData]);

      // USDC
      tempData = utils.arrayify(
        iFaceToken.encodeFunctionData("totalSupply", [])
      );
      calldata.push([opAddressList.vUSDCContractAddress, tempData]);

      tempData = utils.arrayify(
        iFaceToken.encodeFunctionData("balanceOf", [
          opAddressList.vUSDCContractAddress,
        ])
      );
      calldata.push([opAddressList.usdcTokenAddress, tempData]);

      // USDT
      tempData = utils.arrayify(
        iFaceToken.encodeFunctionData("totalSupply", [])
      );
      calldata.push([opAddressList.vUSDTContractAddress, tempData]);

      tempData = utils.arrayify(
        iFaceToken.encodeFunctionData("balanceOf", [
          opAddressList.vUSDTContractAddress,
        ])
      );
      calldata.push([opAddressList.usdtTokenAddress, tempData]);

      // DAI
      tempData = utils.arrayify(
        iFaceToken.encodeFunctionData("totalSupply", [])
      );
      calldata.push([opAddressList.vDaiContractAddress, tempData]);

      tempData = utils.arrayify(
        iFaceToken.encodeFunctionData("balanceOf", [
          opAddressList.vDaiContractAddress,
        ])
      );
      calldata.push([opAddressList.daiTokenAddress, tempData]);

      // totalBorrow
      //ETH
      tempData = utils.arrayify(iFaceEth.encodeFunctionData("getBorrows", []));
      calldata.push([opAddressList.vEtherContractAddress, tempData]);

      //WBTC
      tempData = utils.arrayify(
        iFaceToken.encodeFunctionData("getBorrows", [])
      );
      calldata.push([opAddressList.vWBTCContractAddress, tempData]);

      //USDC
      tempData = utils.arrayify(
        iFaceToken.encodeFunctionData("getBorrows", [])
      );
      calldata.push([opAddressList.vUSDCContractAddress, tempData]);

      //USDT
      tempData = utils.arrayify(
        iFaceToken.encodeFunctionData("getBorrows", [])
      );
      calldata.push([opAddressList.vUSDTContractAddress, tempData]);

      //DAI
      tempData = utils.arrayify(
        iFaceToken.encodeFunctionData("getBorrows", [])
      );
      calldata.push([opAddressList.vDaiContractAddress, tempData]);

      //User assets balance

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

      const res2 = await MCcontract.callStatic.aggregate(calldata);

      //avaibaleAssetsInContract

      const avaibaleETH = res2.returnData[1];
      const avaibaleBTC = res2.returnData[3];
      const avaibaleUSDC = res2.returnData[5];
      const avaibaleUSDT = res2.returnData[7];
      const avaibaleDai = res2.returnData[9];

      // totalBorrow

      const ethTotalBorrow = res2.returnData[10];
      const wbtcTotalBorrow = res2.returnData[11];
      const usdcTotalBorrow = res2.returnData[12];
      const usdtTotalBorrow = res2.returnData[13];
      const daiTotalBorrow = res2.returnData[14];

      // Dependent varibale data fetching
      const calldata1 = [];
      let tempData1;

      const iFaceRateModel = new utils.Interface(DefaultRateModel.abi);

      //BorrowAPY
      //ETH
      tempData1 = utils.arrayify(
        iFaceRateModel.encodeFunctionData("getBorrowRatePerSecond", [
          avaibaleETH,
          ethTotalBorrow,
        ])
      );
      calldata1.push([opAddressList.rateModelContractAddress, tempData1]);

      //BTC
      tempData1 = utils.arrayify(
        iFaceRateModel.encodeFunctionData("getBorrowRatePerSecond", [
          avaibaleBTC,
          wbtcTotalBorrow,
        ])
      );
      calldata1.push([opAddressList.rateModelContractAddress, tempData1]);

      //USDC
      tempData1 = utils.arrayify(
        iFaceRateModel.encodeFunctionData("getBorrowRatePerSecond", [
          avaibaleUSDC,
          usdcTotalBorrow,
        ])
      );
      calldata1.push([opAddressList.rateModelContractAddress, tempData1]);

      //USDT
      tempData1 = utils.arrayify(
        iFaceRateModel.encodeFunctionData("getBorrowRatePerSecond", [
          avaibaleUSDT,
          usdtTotalBorrow,
        ])
      );
      calldata1.push([opAddressList.rateModelContractAddress, tempData1]);

      //DAI
      tempData1 = utils.arrayify(
        iFaceRateModel.encodeFunctionData("getBorrowRatePerSecond", [
          avaibaleDai,
          daiTotalBorrow,
        ])
      );
      calldata1.push([opAddressList.rateModelContractAddress, tempData1]);

      const res3 = await MCcontract.callStatic.aggregate(calldata1);

      const ethBorrowAPY = res3.returnData[0];
      const ethBorrowApy =
        ethTotalBorrow != 0
          ? parseFloat(formatUnits(ethBorrowAPY)) * SECS_PER_YEAR * 1e3
          : 0;

      const btcBorrowAPY = res3.returnData[1];
      const wbtcBorrowApy =
        wbtcTotalBorrow != 0
          ? parseFloat(formatUnits(btcBorrowAPY)) * SECS_PER_YEAR * 1e3
          : 0;

      const usdcBorrowAPY = res3.returnData[2];
      const usdcBorrowApy =
        usdcTotalBorrow != 0
          ? parseFloat(formatUnits(usdcBorrowAPY)) * SECS_PER_YEAR * 1e3
          : 0;

      const usdtBorrowAPY = res3.returnData[3];
      const usdtBorrowApy =
        usdtTotalBorrow != 0
          ? parseFloat(formatUnits(usdtBorrowAPY)) * SECS_PER_YEAR * 1e3
          : 0;

      const daiBorrowAPY = res3.returnData[4];
      const daiBorrowApy =
        daiTotalBorrow != 0
          ? parseFloat(formatUnits(daiBorrowAPY)) * SECS_PER_YEAR * 1e3
          : 0;

      const updatedPools = pools.map((pool) => {
        if (pool.name === "WETH" && Number(ethBal) > 0) {
          return {
            ...pool,
            amount: Number(ethBal),
            profit: ethPnl,
            apy: ethBorrowApy,
            percentage: ethPercentage,
          };
        }
        if (pool.name === "WBTC" && Number(wbtcBal) > 0) {
          return {
            ...pool,
            amount: Number(wbtcBal),
            profit: wbtcPnl,
            apy: wbtcBorrowApy,
            percentage: wbtcPercentage,
          };
        }
        if (pool.name === "USDC" && Number(usdcBal) > 0) {
          return {
            ...pool,
            amount: Number(usdcBal),
            profit: usdcPnl,
            apy: usdcBorrowApy,
            percentage: usdcPercentage,
          };
        }
        if (pool.name === "USDT" && Number(usdtBal) > 0) {
          return {
            ...pool,
            amount: Number(usdtBal),
            profit: usdtPnl,
            apy: usdtBorrowApy,
            percentage: usdtPercentage,
          };
        }
        if (pool.name === "DAI" && Number(daiBal) > 0) {
          return {
            ...pool,
            amount: Number(daiBal),
            profit: daiPnl,
            apy: daiBorrowApy,
            percentage: daiPercentage,
          };
        }
        return pool;
      });

      setPools(updatedPools);
    } else if (currentNetwork.id === BASE_NETWORK) {
      const MCcontract = new Contract(
        baseAddressList.multicallAddress,
        Multicall.abi,
        library
      );

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

      const ethPnl = Number(ethusdcBal) - Number(ethBal);
      const ethPercentage = (ethPnl / Number(ethusdcBal)) * 100;
      const wbtcPnl = Number(wbtcusdcBal) - Number(wbtcBal);
      const wbtcPercentage = (wbtcPnl / Number(wbtcusdcBal)) * 100;
      const usdcPnl = Number(usdcusdcBal) - Number(usdcBal);
      const usdcPercentage = (usdcPnl / Number(usdcusdcBal)) * 100;
      const usdtPnl = Number(usdtusdcBal) - Number(usdtBal);
      const usdtPercentage = (usdtPnl / Number(usdtusdcBal)) * 100;
      const daiPnl = Number(daiusdcBal) - Number(daiBal);
      const daiPercentage = (daiPnl / Number(daiusdcBal)) * 100;

      calldata = [];
      tempData = null;
      // ETH
      tempData = utils.arrayify(iFaceEth.encodeFunctionData("totalSupply", []));
      calldata.push([baseAddressList.vEtherContractAddress, tempData]);

      tempData = utils.arrayify(
        iFaceEth.encodeFunctionData("balanceOf", [
          baseAddressList.vEtherContractAddress,
        ])
      );
      calldata.push([baseAddressList.wethTokenAddress, tempData]);

      // WBTC

      tempData = utils.arrayify(
        iFaceToken.encodeFunctionData("totalSupply", [])
      );

      calldata.push([baseAddressList.vWBTCContractAddress, tempData]);
      tempData = utils.arrayify(
        iFaceToken.encodeFunctionData("balanceOf", [
          baseAddressList.vWBTCContractAddress,
        ])
      );
      calldata.push([baseAddressList.wbtcTokenAddress, tempData]);

      // USDC
      tempData = utils.arrayify(
        iFaceToken.encodeFunctionData("totalSupply", [])
      );
      calldata.push([baseAddressList.vUSDCContractAddress, tempData]);

      tempData = utils.arrayify(
        iFaceToken.encodeFunctionData("balanceOf", [
          baseAddressList.vUSDCContractAddress,
        ])
      );
      calldata.push([baseAddressList.usdcTokenAddress, tempData]);

      // USDT
      tempData = utils.arrayify(
        iFaceToken.encodeFunctionData("totalSupply", [])
      );
      calldata.push([baseAddressList.vUSDTContractAddress, tempData]);

      tempData = utils.arrayify(
        iFaceToken.encodeFunctionData("balanceOf", [
          baseAddressList.vUSDTContractAddress,
        ])
      );
      calldata.push([baseAddressList.usdtTokenAddress, tempData]);

      // DAI
      tempData = utils.arrayify(
        iFaceToken.encodeFunctionData("totalSupply", [])
      );
      calldata.push([baseAddressList.vDaiContractAddress, tempData]);

      tempData = utils.arrayify(
        iFaceToken.encodeFunctionData("balanceOf", [
          baseAddressList.vDaiContractAddress,
        ])
      );
      calldata.push([baseAddressList.daiTokenAddress, tempData]);

      // totalBorrow
      //ETH
      tempData = utils.arrayify(iFaceEth.encodeFunctionData("getBorrows", []));
      calldata.push([baseAddressList.vEtherContractAddress, tempData]);

      //WBTC
      tempData = utils.arrayify(
        iFaceToken.encodeFunctionData("getBorrows", [])
      );
      calldata.push([baseAddressList.vWBTCContractAddress, tempData]);

      //USDC
      tempData = utils.arrayify(
        iFaceToken.encodeFunctionData("getBorrows", [])
      );
      calldata.push([baseAddressList.vUSDCContractAddress, tempData]);

      //USDT
      tempData = utils.arrayify(
        iFaceToken.encodeFunctionData("getBorrows", [])
      );
      calldata.push([baseAddressList.vUSDTContractAddress, tempData]);

      //DAI
      tempData = utils.arrayify(
        iFaceToken.encodeFunctionData("getBorrows", [])
      );
      calldata.push([baseAddressList.vDaiContractAddress, tempData]);

      //User assets balance

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

      const res2 = await MCcontract.callStatic.aggregate(calldata);

      //avaibaleAssetsInContract

      const avaibaleETH = res2.returnData[1];
      const avaibaleBTC = res2.returnData[3];
      const avaibaleUSDC = res2.returnData[5];
      const avaibaleUSDT = res2.returnData[7];
      const avaibaleDai = res2.returnData[9];

      // totalBorrow

      const ethTotalBorrow = res2.returnData[10];
      const wbtcTotalBorrow = res2.returnData[11];
      const usdcTotalBorrow = res2.returnData[12];
      const usdtTotalBorrow = res2.returnData[13];
      const daiTotalBorrow = res2.returnData[14];

      // Dependent varibale data fetching
      const calldata1 = [];
      let tempData1;
      const iFaceRateModel = new utils.Interface(DefaultRateModel.abi);

      //BorrowAPY
      //ETH
      tempData1 = utils.arrayify(
        iFaceRateModel.encodeFunctionData("getBorrowRatePerSecond", [
          avaibaleETH,
          ethTotalBorrow,
        ])
      );
      calldata1.push([baseAddressList.rateModelContractAddress, tempData1]);

      //BTC
      tempData1 = utils.arrayify(
        iFaceRateModel.encodeFunctionData("getBorrowRatePerSecond", [
          avaibaleBTC,
          wbtcTotalBorrow,
        ])
      );
      calldata1.push([baseAddressList.rateModelContractAddress, tempData1]);

      //USDC
      tempData1 = utils.arrayify(
        iFaceRateModel.encodeFunctionData("getBorrowRatePerSecond", [
          avaibaleUSDC,
          usdcTotalBorrow,
        ])
      );
      calldata1.push([baseAddressList.rateModelContractAddress, tempData1]);

      //USDT
      tempData1 = utils.arrayify(
        iFaceRateModel.encodeFunctionData("getBorrowRatePerSecond", [
          avaibaleUSDT,
          usdtTotalBorrow,
        ])
      );
      calldata1.push([baseAddressList.rateModelContractAddress, tempData1]);

      //DAI
      tempData1 = utils.arrayify(
        iFaceRateModel.encodeFunctionData("getBorrowRatePerSecond", [
          avaibaleDai,
          daiTotalBorrow,
        ])
      );
      calldata1.push([baseAddressList.rateModelContractAddress, tempData1]);

      const res3 = await MCcontract.callStatic.aggregate(calldata1);

      const ethBorrowAPY = res3.returnData[0];
      const ethBorrowApy =
        ethTotalBorrow != 0
          ? parseFloat(formatUnits(ethBorrowAPY)) * SECS_PER_YEAR * 1e3
          : 0;

      const btcBorrowAPY = res3.returnData[1];
      const wbtcBorrowApy =
        wbtcTotalBorrow != 0
          ? parseFloat(formatUnits(btcBorrowAPY)) * SECS_PER_YEAR * 1e3
          : 0;

      const usdcBorrowAPY = res3.returnData[2];
      const usdcBorrowApy =
        usdcTotalBorrow != 0
          ? parseFloat(formatUnits(usdcBorrowAPY)) * SECS_PER_YEAR * 1e3
          : 0;

      const usdtBorrowAPY = res3.returnData[3];
      const usdtBorrowApy =
        usdtTotalBorrow != 0
          ? parseFloat(formatUnits(usdtBorrowAPY)) * SECS_PER_YEAR * 1e3
          : 0;

      const daiBorrowAPY = res3.returnData[4];
      const daiBorrowApy =
        daiTotalBorrow != 0
          ? parseFloat(formatUnits(daiBorrowAPY)) * SECS_PER_YEAR * 1e3
          : 0;

      const updatedPools = pools.map((pool) => {
        if (pool.name === "WETH" && Number(ethBal) > 0) {
          return {
            ...pool,
            amount: Number(ethBal),
            profit: ethPnl,
            apy: ethBorrowApy,
            percentage: ethPercentage,
          };
        }
        if (pool.name === "WBTC" && Number(wbtcBal) > 0) {
          return {
            ...pool,
            amount: Number(wbtcBal),
            profit: wbtcPnl,
            apy: wbtcBorrowApy,
            percentage: wbtcPercentage,
          };
        }
        if (pool.name === "USDC" && Number(usdcBal) > 0) {
          return {
            ...pool,
            amount: Number(usdcBal),
            profit: usdcPnl,
            apy: usdcBorrowApy,
            percentage: usdcPercentage,
          };
        }
        if (pool.name === "USDT" && Number(usdtBal) > 0) {
          return {
            ...pool,
            amount: Number(usdtBal),
            profit: usdtPnl,
            apy: usdtBorrowApy,
            percentage: usdtPercentage,
          };
        }
        if (pool.name === "DAI" && Number(daiBal) > 0) {
          return {
            ...pool,
            amount: Number(daiBal),
            profit: daiPnl,
            apy: daiBorrowApy,
            percentage: daiPercentage,
          };
        }
        return pool;
      });

      setPools(updatedPools);
    }
  };

  useEffect(() => {
    getAssetPrice();
    const intervalId = setInterval(getAssetPrice, 1000); // Calls fetchData every second
    return () => clearInterval(intervalId); // This is the cleanup function
  }, []);

  useEffect(() => {
    fetchValues();
  }, [account, currentNetwork, assetsPrice]);

  return (
    <div className="text-baseBlack dark:text-baseWhite">
      <div className="hidden xl:block bg-white dark:bg-baseDark rounded-3xl border border-purpleBG-lighter dark:border-neutral-700 px-5 py-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Positions In Pools</h2>
          <Link
            href="/earn"
            className="text-purple underline text-sm font-semibold"
          >
            Go to Earn
          </Link>
        </div>
        <div className="bg-baseComplementary dark:bg-baseDarkComplementary rounded-lg p-2 mb-2">
          <div className="grid grid-cols-5 text-sm font-medium text-center">
            <div>#</div>
            <div className="text-left">Pool</div>
            <div>In pool</div>
            <div>Profit & Loss</div>
            <div>Expected APY</div>
          </div>
        </div>
        {pools.map(
          (pool, index) =>
            pool.amount > 0 && (
              <Pool
                key={index}
                number={index + 1}
                name={pool.name}
                amount={Number(ceilWithPrecision(String(pool.amount)))}
                profit={Number(ceilWithPrecision(String(pool.profit)))}
                apy={Number(ceilWithPrecision(String(pool.apy)))}
                percentage={Number(ceilWithPrecision(String(pool.percentage)))}
                icon={pool.icon}
                isLoss={pool.percentage < 0 ? true : false}
              />
            )
        )}
      </div>

      <div className="xl:hidden">
        <div className="mt-6 lg:mt-0 mb-3">
          <h2 className="text-lg font-semibold pl-2">Positions In Pools</h2>
        </div>

        {pools.map(
          (pool, index) =>
            pool.amount > 0 && (
              <div
                key={index}
                className="bg-white dark:bg-baseDark rounded-3xl border border-purpleBG-lighter dark:border-neutral-700 p-4 mb-3"
              >
                <div className="flex items-center mb-8 text-base font-medium">
                  <span className="mr-4 text-neutral-500">{index + 1}</span>
                  <div className="relative w-6 h-6 mr-2">
                    <Image
                      src={pool.icon}
                      alt={pool.name}
                      layout="fill"
                      className="rounded-full"
                    />
                  </div>
                  <span className="font-bold text-lg">{pool.name}</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 gap-4 text-base">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">In Pool</p>
                    <p>
                      {ceilWithPrecision(String(pool.amount)) + " " + pool.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Profit & Loss</p>
                    <p>
                      {formatUSD(ceilWithPrecision(String(pool.profit)))}{" "}
                      {pool.percentage < 0 ? (
                        <span className="text-baseSecondary-500 text-xs">
                          ({ceilWithPrecision(String(pool.percentage))}%)
                        </span>
                      ) : (
                        <span className="text-baseSuccess-300 text-xs">
                          ({ceilWithPrecision(String(pool.percentage))}%)
                        </span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Expected APY</p>
                    <p>{ceilWithPrecision(String(pool.apy))}%</p>
                  </div>
                </div>
              </div>
            )
        )}
      </div>
    </div>
  );
};

export default LenderDashboard;
