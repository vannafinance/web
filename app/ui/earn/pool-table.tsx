/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useNetwork } from "@/app/context/network-context";
import {
  ARBITRUM_NETWORK,
  BASE_NETWORK,
  // ARBITRUM_NETWORK,
  OPTIMISM_NETWORK,
} from "@/app/lib/constants";
import { poolsPlaceholder } from "@/app/lib/static-values";
import { setPoolsData } from "@/app/store/pools-slice";
import { RootState } from "@/app/store/store";
import { useWeb3React } from "@web3-react/core";
import Image from "next/image";
import Link from "next/link";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { utils, Contract } from "ethers";
import { formatUnits } from "ethers/lib/utils";

import VEther from "@/app/abi/vanna/v1/out/VEther.sol/VEther.json";
import VToken from "@/app/abi/vanna/v1/out/VToken.sol/VToken.json";
import {
  arbAddressList,
  baseAddressList,
  opAddressList,
} from "@/app/lib/web3-constants";
import DefaultRateModel from "@/app/abi/vanna/v1/out/DefaultRateModel.sol/DefaultRateModel.json";
import Multicall from "@/app/abi/vanna/v1/out/Multicall.sol/Multicall.json";
import { ceilWithPrecision, check0xHex } from "@/app/lib/helper";
import { SECS_PER_YEAR, FEES } from "@/app/lib/constants";

const PoolsTable = () => {
  const { account, library } = useWeb3React();
  const { currentNetwork } = useNetwork();

  const dispatch = useDispatch();
  const [pools, setPools] = useState(
    useSelector((state: RootState) => state.pools.poolsData)
  );

  useEffect(() => {
    try {
      if (account && currentNetwork) {
        if (currentNetwork.id === ARBITRUM_NETWORK) {
          const fetchValues = async () => {
            const iFaceEth = new utils.Interface(VEther.abi);
            const iFaceToken = new utils.Interface(VToken.abi);

            const MCcontract = new Contract(
              arbAddressList.multicallAddress,
              Multicall.abi,
              library
            );
            const calldata = [];
            let tempData;
            // ETH
            tempData = utils.arrayify(
              iFaceEth.encodeFunctionData("totalSupply", [])
            );
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
            tempData = utils.arrayify(
              iFaceEth.encodeFunctionData("getBorrows", [])
            );
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

            const res = await MCcontract.callStatic.aggregate(calldata);

            // assigne value
            //supply

            const ethSupply = formatUnits(check0xHex(res.returnData[0]));
            const wbtcSupply = formatUnits(check0xHex(res.returnData[2]));
            const usdcSupply = formatUnits(check0xHex(res.returnData[4]), 6);
            const usdtSupply = formatUnits(check0xHex(res.returnData[6]), 6);
            const daiSupply = formatUnits(check0xHex(res.returnData[8]));

            //avaibaleAssetsInContract

            const avaibaleETH = check0xHex(res.returnData[1]);
            const avaibaleBTC = check0xHex(res.returnData[3]);
            const avaibaleUSDC = check0xHex(res.returnData[5]);
            const avaibaleUSDT = check0xHex(res.returnData[7]);
            const avaibaleDai = check0xHex(res.returnData[9]);

            // totalBorrow

            const ethTotalBorrow = check0xHex(res.returnData[10]);
            const wbtcTotalBorrow = check0xHex(res.returnData[11]);
            const usdcTotalBorrow = check0xHex(res.returnData[12]);
            const usdtTotalBorrow = check0xHex(res.returnData[13]);
            const daiTotalBorrow = check0xHex(res.returnData[14]);

            //User Asset balance
            const ethBal = formatUnits(check0xHex(res.returnData[15]), 18);
            const wbtcBal = formatUnits(check0xHex(res.returnData[16]), 18);
            const usdcBal = formatUnits(check0xHex(res.returnData[17]), 6);
            const usdtBal = formatUnits(check0xHex(res.returnData[18]), 6);
            const daiBal = formatUnits(check0xHex(res.returnData[19]), 18);

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

            calldata1.push([
              arbAddressList.rateModelContractAddress,
              tempData1,
            ]);

            //BTC
            tempData1 = utils.arrayify(
              iFaceRateModel.encodeFunctionData("getBorrowRatePerSecond", [
                avaibaleBTC,
                wbtcTotalBorrow,
              ])
            );
            calldata1.push([
              arbAddressList.rateModelContractAddress,
              tempData1,
            ]);

            //USDC
            tempData1 = utils.arrayify(
              iFaceRateModel.encodeFunctionData("getBorrowRatePerSecond", [
                avaibaleUSDC,
                usdcTotalBorrow,
              ])
            );
            calldata1.push([
              arbAddressList.rateModelContractAddress,
              tempData1,
            ]);

            //USDT
            tempData1 = utils.arrayify(
              iFaceRateModel.encodeFunctionData("getBorrowRatePerSecond", [
                avaibaleUSDT,
                usdtTotalBorrow,
              ])
            );
            calldata1.push([
              arbAddressList.rateModelContractAddress,
              tempData1,
            ]);

            //DAI
            tempData1 = utils.arrayify(
              iFaceRateModel.encodeFunctionData("getBorrowRatePerSecond", [
                avaibaleDai,
                daiTotalBorrow,
              ])
            );
            calldata1.push([
              arbAddressList.rateModelContractAddress,
              tempData1,
            ]);

            const res1 = await MCcontract.callStatic.aggregate(calldata1);

            const ethBorrowAPY = res1.returnData[0];
            const ethBorrowApy =
              ethTotalBorrow != 0
                ? parseFloat(formatUnits(ethBorrowAPY)) * SECS_PER_YEAR * 1e2
                : 0;
            const ethSupplyApy = ethBorrowApy - ethBorrowApy * FEES;

            const btcBorrowAPY = res1.returnData[1];
            const wbtcBorrowApy =
              wbtcTotalBorrow != 0
                ? parseFloat(formatUnits(btcBorrowAPY)) * SECS_PER_YEAR * 1e2
                : 0;
            const wbtcSupplyApy = wbtcBorrowApy - wbtcBorrowApy * FEES;

            const usdcBorrowAPY = res1.returnData[2];
            const usdcBorrowApy =
              usdcTotalBorrow != 0
                ? parseFloat(formatUnits(usdcBorrowAPY)) * SECS_PER_YEAR * 1e2
                : 0;
            const usdcSupplyApy = usdcBorrowApy - usdcBorrowApy * FEES;

            const usdtBorrowAPY = res1.returnData[3];
            const usdtBorrowApy =
              usdtTotalBorrow != 0
                ? parseFloat(formatUnits(usdtBorrowAPY)) * SECS_PER_YEAR * 1e2
                : 0;
            const usdtSupplyApy = usdtBorrowAPY - usdtBorrowAPY * FEES;

            const daiBorrowAPY = res1.returnData[4];
            const daiBorrowApy =
              daiTotalBorrow != 0
                ? parseFloat(formatUnits(daiBorrowAPY)) * SECS_PER_YEAR * 1e2
                : 0;
            const daiSupplyApy = daiBorrowApy - daiBorrowApy * FEES;

            const updatedPools = pools.map((pool) => {
              if (pool.name === "WETH") {
                return {
                  ...pool,
                  supply: ceilWithPrecision(ethSupply),
                  supplyAPY: ceilWithPrecision(String(ethSupplyApy)) + "%",
                  borrowAPY: ceilWithPrecision(String(ethBorrowApy)) + "%",
                  yourBalance: ceilWithPrecision(ethBal),
                };
              }
              if (pool.name === "WBTC") {
                return {
                  ...pool,
                  supply: ceilWithPrecision(wbtcSupply),
                  supplyAPY: ceilWithPrecision(String(wbtcSupplyApy)) + "%",
                  borrowAPY: ceilWithPrecision(String(wbtcBorrowApy)) + "%",
                  yourBalance: ceilWithPrecision(wbtcBal),
                };
              }
              if (pool.name === "USDC") {
                return {
                  ...pool,
                  supply: ceilWithPrecision(usdcSupply),
                  supplyAPY: ceilWithPrecision(String(usdcSupplyApy)) + "%",
                  borrowAPY: ceilWithPrecision(String(usdcBorrowApy)) + "%",
                  yourBalance: ceilWithPrecision(usdcBal),
                };
              }
              if (pool.name === "USDT") {
                return {
                  ...pool,
                  supply: ceilWithPrecision(usdtSupply),
                  supplyAPY: ceilWithPrecision(String(usdtSupplyApy)) + "%",
                  borrowAPY: ceilWithPrecision(String(usdtBorrowApy)) + "%",
                  yourBalance: ceilWithPrecision(usdtBal),
                };
              }
              if (pool.name === "DAI") {
                return {
                  ...pool,
                  supply: ceilWithPrecision(daiSupply),
                  supplyAPY: ceilWithPrecision(String(daiSupplyApy)) + "%",
                  borrowAPY: ceilWithPrecision(String(daiBorrowApy)) + "%",
                  yourBalance: ceilWithPrecision(daiBal),
                };
              }
              return pool;
            });

            setPools(updatedPools);
            dispatch(setPoolsData(updatedPools));
          };
          fetchValues();
        } else if (currentNetwork.id === OPTIMISM_NETWORK) {
          const fetchValues = async () => {
            const iFaceEth = new utils.Interface(VEther.abi);
            const iFaceToken = new utils.Interface(VToken.abi);

            const MCcontract = new Contract(
              opAddressList.multicallAddress,
              Multicall.abi,
              library
            );
            const calldata = [];
            let tempData;
            // ETH
            tempData = utils.arrayify(
              iFaceEth.encodeFunctionData("totalSupply", [])
            );
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
            tempData = utils.arrayify(
              iFaceEth.encodeFunctionData("getBorrows", [])
            );
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

            const res = await MCcontract.callStatic.aggregate(calldata);

            // assigne value
            //supply

            const ethSupply = formatUnits(check0xHex(res.returnData[0]));
            const wbtcSupply = formatUnits(check0xHex(res.returnData[2]));
            const usdcSupply = formatUnits(check0xHex(res.returnData[4]), 6);
            const usdtSupply = formatUnits(check0xHex(res.returnData[6]), 6);
            const daiSupply = formatUnits(check0xHex(res.returnData[8]));

            //avaibaleAssetsInContract

            const avaibaleETH = check0xHex(res.returnData[1]);
            const avaibaleBTC = check0xHex(res.returnData[3]);
            const avaibaleUSDC = check0xHex(res.returnData[5]);
            const avaibaleUSDT = check0xHex(res.returnData[7]);
            const avaibaleDai = check0xHex(res.returnData[9]);

            // totalBorrow

            const ethTotalBorrow = check0xHex(res.returnData[10]);
            const wbtcTotalBorrow = check0xHex(res.returnData[11]);
            const usdcTotalBorrow = check0xHex(res.returnData[12]);
            const usdtTotalBorrow = check0xHex(res.returnData[13]);
            const daiTotalBorrow = check0xHex(res.returnData[14]);

            //User Asset balance
            const ethBal = formatUnits(check0xHex(res.returnData[15]), 18);
            const wbtcBal = formatUnits(check0xHex(res.returnData[16]), 18);
            const usdcBal = formatUnits(check0xHex(res.returnData[17]), 6);
            const usdtBal = formatUnits(check0xHex(res.returnData[18]), 6);
            const daiBal = formatUnits(check0xHex(res.returnData[19]), 18);
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

            const res1 = await MCcontract.callStatic.aggregate(calldata1);

            const ethBorrowAPY = res1.returnData[0];
            const ethBorrowApy =
              ethTotalBorrow != 0
                ? parseFloat(formatUnits(ethBorrowAPY)) * SECS_PER_YEAR * 1e2
                : 0;
            const ethSupplyApy = ethBorrowApy - ethBorrowApy * FEES;

            const btcBorrowAPY = res1.returnData[1];
            const wbtcBorrowApy =
              wbtcTotalBorrow != 0
                ? parseFloat(formatUnits(btcBorrowAPY)) * SECS_PER_YEAR * 1e2
                : 0;
            const wbtcSupplyApy = wbtcBorrowApy - wbtcBorrowApy * FEES;

            const usdcBorrowAPY = res1.returnData[2];
            const usdcBorrowApy =
              usdcTotalBorrow != 0
                ? parseFloat(formatUnits(usdcBorrowAPY)) * SECS_PER_YEAR * 1e2
                : 0;
            const usdcSupplyApy = usdcBorrowApy - usdcBorrowApy * FEES;

            const usdtBorrowAPY = res1.returnData[3];
            const usdtBorrowApy =
              usdtTotalBorrow != 0
                ? parseFloat(formatUnits(usdtBorrowAPY)) * SECS_PER_YEAR * 1e2
                : 0;
            const usdtSupplyApy = usdtBorrowAPY - usdtBorrowAPY * FEES;

            const daiBorrowAPY = res1.returnData[4];
            const daiBorrowApy =
              daiTotalBorrow != 0
                ? parseFloat(formatUnits(daiBorrowAPY)) * SECS_PER_YEAR * 1e2
                : 0;
            const daiSupplyApy = daiBorrowApy - daiBorrowApy * FEES;

            const updatedPools = pools.map((pool) => {
              if (pool.name === "WETH") {
                return {
                  ...pool,
                  supply: ceilWithPrecision(ethSupply),
                  supplyAPY: ceilWithPrecision(String(ethSupplyApy)) + "%",
                  borrowAPY: ceilWithPrecision(String(ethBorrowApy)) + "%",
                  yourBalance: ceilWithPrecision(ethBal),
                };
              }
              if (pool.name === "WBTC") {
                return {
                  ...pool,
                  supply: ceilWithPrecision(wbtcSupply),
                  supplyAPY: ceilWithPrecision(String(wbtcSupplyApy)) + "%",
                  borrowAPY: ceilWithPrecision(String(wbtcBorrowApy)) + "%",
                  yourBalance: ceilWithPrecision(wbtcBal),
                };
              }
              if (pool.name === "USDC") {
                return {
                  ...pool,
                  supply: ceilWithPrecision(usdcSupply),
                  supplyAPY: ceilWithPrecision(String(usdcSupplyApy)) + "%",
                  borrowAPY: ceilWithPrecision(String(usdcBorrowApy)) + "%",
                  yourBalance: ceilWithPrecision(usdcBal),
                };
              }
              if (pool.name === "USDT") {
                return {
                  ...pool,
                  supply: ceilWithPrecision(usdtSupply),
                  supplyAPY: ceilWithPrecision(String(usdtSupplyApy)) + "%",
                  borrowAPY: ceilWithPrecision(String(usdtBorrowApy)) + "%",
                  yourBalance: ceilWithPrecision(usdtBal),
                };
              }
              if (pool.name === "DAI") {
                return {
                  ...pool,
                  supply: ceilWithPrecision(daiSupply),
                  supplyAPY: ceilWithPrecision(String(daiSupplyApy)) + "%",
                  borrowAPY: ceilWithPrecision(String(daiBorrowApy)) + "%",
                  yourBalance: ceilWithPrecision(daiBal),
                };
              }
              return pool;
            });

            setPools(updatedPools);
            dispatch(setPoolsData(updatedPools));
          };
          fetchValues();
        } else if (currentNetwork.id === BASE_NETWORK) {
          const fetchValues = async () => {
            const iFaceEth = new utils.Interface(VEther.abi);
            const iFaceToken = new utils.Interface(VToken.abi);

            const MCcontract = new Contract(
              baseAddressList.multicallAddress,
              Multicall.abi,
              library
            );
            const calldata = [];
            let tempData;
            // ETH
            tempData = utils.arrayify(
              iFaceEth.encodeFunctionData("totalSupply", [])
            );
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
            tempData = utils.arrayify(
              iFaceEth.encodeFunctionData("getBorrows", [])
            );
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

            const res = await MCcontract.callStatic.aggregate(calldata);

            // assigne value
            //supply

            const ethSupply = formatUnits(res.returnData[0]);
            const wbtcSupply = formatUnits(res.returnData[2]);
            const usdcSupply = formatUnits(res.returnData[4], 6);
            const usdtSupply = formatUnits(res.returnData[6], 6);
            const daiSupply = formatUnits(res.returnData[8]);

            //avaibaleAssetsInContract

            const avaibaleETH = res.returnData[1];
            const avaibaleBTC = res.returnData[3];
            const avaibaleUSDC = res.returnData[5];
            const avaibaleUSDT = res.returnData[7];
            const avaibaleDai = res.returnData[9];

            // totalBorrow

            const ethTotalBorrow = res.returnData[10];
            const wbtcTotalBorrow = res.returnData[11];
            const usdcTotalBorrow = res.returnData[12];
            const usdtTotalBorrow = res.returnData[13];
            const daiTotalBorrow = res.returnData[14];

            //User Asset balance
            const ethBal = formatUnits(res.returnData[15], 18);
            const wbtcBal = formatUnits(res.returnData[16], 18);
            const usdcBal = formatUnits(res.returnData[17], 6);
            const usdtBal = formatUnits(res.returnData[18], 6);
            const daiBal = formatUnits(res.returnData[19], 18);

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
            calldata1.push([
              baseAddressList.rateModelContractAddress,
              tempData1,
            ]);

            //BTC
            tempData1 = utils.arrayify(
              iFaceRateModel.encodeFunctionData("getBorrowRatePerSecond", [
                avaibaleBTC,
                wbtcTotalBorrow,
              ])
            );
            calldata1.push([
              baseAddressList.rateModelContractAddress,
              tempData1,
            ]);

            //USDC
            tempData1 = utils.arrayify(
              iFaceRateModel.encodeFunctionData("getBorrowRatePerSecond", [
                avaibaleUSDC,
                usdcTotalBorrow,
              ])
            );
            calldata1.push([
              baseAddressList.rateModelContractAddress,
              tempData1,
            ]);

            //USDT
            tempData1 = utils.arrayify(
              iFaceRateModel.encodeFunctionData("getBorrowRatePerSecond", [
                avaibaleUSDT,
                usdtTotalBorrow,
              ])
            );
            calldata1.push([
              baseAddressList.rateModelContractAddress,
              tempData1,
            ]);

            //DAI
            tempData1 = utils.arrayify(
              iFaceRateModel.encodeFunctionData("getBorrowRatePerSecond", [
                avaibaleDai,
                daiTotalBorrow,
              ])
            );
            calldata1.push([
              baseAddressList.rateModelContractAddress,
              tempData1,
            ]);

            const res1 = await MCcontract.callStatic.aggregate(calldata1);

            const ethBorrowAPY = res1.returnData[0];
            const ethBorrowApy =
              ethTotalBorrow != 0
                ? parseFloat(formatUnits(ethBorrowAPY)) * SECS_PER_YEAR * 1e2
                : 0;
            const ethSupplyApy = ethBorrowApy - ethBorrowApy * FEES;

            const btcBorrowAPY = res1.returnData[1];
            const wbtcBorrowApy =
              wbtcTotalBorrow != 0
                ? parseFloat(formatUnits(btcBorrowAPY)) * SECS_PER_YEAR * 1e2
                : 0;
            const wbtcSupplyApy = wbtcBorrowApy - wbtcBorrowApy * FEES;

            const usdcBorrowAPY = res1.returnData[2];
            const usdcBorrowApy =
              usdcTotalBorrow != 0
                ? parseFloat(formatUnits(usdcBorrowAPY)) * SECS_PER_YEAR * 1e2
                : 0;
            const usdcSupplyApy = usdcBorrowApy - usdcBorrowApy * FEES;

            const usdtBorrowAPY = res1.returnData[3];
            const usdtBorrowApy =
              usdtTotalBorrow != 0
                ? parseFloat(formatUnits(usdtBorrowAPY)) * SECS_PER_YEAR * 1e2
                : 0;
            const usdtSupplyApy = usdtBorrowAPY - usdtBorrowAPY * FEES;

            const daiBorrowAPY = res1.returnData[4];
            const daiBorrowApy =
              daiTotalBorrow != 0
                ? parseFloat(formatUnits(daiBorrowAPY)) * SECS_PER_YEAR * 1e2
                : 0;
            const daiSupplyApy = daiBorrowApy - daiBorrowApy * FEES;

            const updatedPools = pools.map((pool) => {
              if (pool.name === "WETH") {
                return {
                  ...pool,
                  supply: ceilWithPrecision(ethSupply),
                  supplyAPY: ceilWithPrecision(String(ethSupplyApy)) + "%",
                  borrowAPY: ceilWithPrecision(String(ethBorrowApy)) + "%",
                  yourBalance: ceilWithPrecision(ethBal),
                };
              }
              if (pool.name === "WBTC") {
                return {
                  ...pool,
                  supply: ceilWithPrecision(wbtcSupply),
                  supplyAPY: ceilWithPrecision(String(wbtcSupplyApy)) + "%",
                  borrowAPY: ceilWithPrecision(String(wbtcBorrowApy)) + "%",
                  yourBalance: ceilWithPrecision(wbtcBal),
                };
              }
              if (pool.name === "USDC") {
                return {
                  ...pool,
                  supply: ceilWithPrecision(usdcSupply),
                  supplyAPY: ceilWithPrecision(String(usdcSupplyApy)) + "%",
                  borrowAPY: ceilWithPrecision(String(usdcBorrowApy)) + "%",
                  yourBalance: ceilWithPrecision(usdcBal),
                };
              }
              if (pool.name === "USDT") {
                return {
                  ...pool,
                  supply: ceilWithPrecision(usdtSupply),
                  supplyAPY: ceilWithPrecision(String(usdtSupplyApy)) + "%",
                  borrowAPY: ceilWithPrecision(String(usdtBorrowApy)) + "%",
                  yourBalance: ceilWithPrecision(usdtBal),
                };
              }
              if (pool.name === "DAI") {
                return {
                  ...pool,
                  supply: ceilWithPrecision(daiSupply),
                  supplyAPY: ceilWithPrecision(String(daiSupplyApy)) + "%",
                  borrowAPY: ceilWithPrecision(String(daiBorrowApy)) + "%",
                  yourBalance: ceilWithPrecision(daiBal),
                };
              }
              return pool;
            });

            setPools(updatedPools);
            dispatch(setPoolsData(updatedPools));
          };
          fetchValues();
        } else {
          setPools(poolsPlaceholder);
        }
      }
    } catch (error) {
      console.error(error);
      setPools(poolsPlaceholder);
    }
  }, [account, currentNetwork]);

  return (
    <div className="mt-4 overflow-x-auto">
      <div className="hidden sm:block min-w-full text-base font-medium text-baseBlack dark:text-baseWhite text-center">
        {/* Header */}
        <div className="bg-baseComplementary dark:bg-baseDarkComplementary grid grid-cols-6 rounded-xl px-3 py-1.5 md:px-6 md:py-4 font-semibold text-left">
          <div className="text-center">#</div>
          <div>Pool</div>
          <div>Supply</div>
          <div className="text-center">Supply APY</div>
          <div className="text-center">Borrow APY</div>
          <div className="text-center">In Pool</div>
        </div>

        {/* Body */}
        <div className="bg-white dark:bg-baseDark text-center pt-6 text-base font-medium">
          {pools.map((pool: PoolTable) => (
            <Link
              href={`/earn/${pool.id}/pool`}
              key={pool.id}
              className="block group"
            >
              <div className="relative grid grid-cols-6 px-3 py-1.5 md:px-6 md:py-4 whitespace-nowrap transition-all duration-200 ease-in-out rounded-xl">
                <div className="z-10">{pool.id}</div>
                <div className="z-10">
                  <div className="flex items-center">
                    <Image src={pool.icon} alt="" width="24" height="24" />
                    <div className="ml-4 flex items-center space-x-2">
                      <div className="font-medium">{pool.name}</div>
                      {pool.version != undefined && pool.version > 0 && (
                        <span className="px-2 inline-flex text-xs leading-4 font-medium rounded-md bg-purpleBG-lighter text-purple">
                          v{pool.version}
                        </span>
                      )}
                      {pool.isActive && (
                        <span className="px-2 inline-flex text-xs leading-4 font-medium rounded-md bg-purpleBG-lighter text-purple">
                          Active
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="z-10 text-left">
                  {pool.supply} {pool.name}
                </div>
                <div className="z-10 text-center">{pool.supplyAPY}</div>
                <div className="z-10 text-center">{pool.borrowAPY}</div>
                <div className="z-10 text-center">
                  {pool.yourBalance} {pool.name}
                </div>
                <div className="absolute inset-0 rounded-xl bg-transparent z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-in-out pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-r from-gradient-1 to-gradient-2 rounded-xl"></div>
                  <div className="absolute inset-[1px] bg-white dark:bg-baseDark rounded-xl"></div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="sm:hidden">
        {pools.map((pool: PoolTable) => (
          <Link
            href={`/earn/${pool.id}/pool`}
            key={pool.id}
            className="block group"
          >
            <div className="relative bg-white dark:bg-baseDark rounded-3xl border border-purpleBG-lighter text-baseBlack dark:text-baseWhite p-4 mb-2">
              <div className="flex items-center mb-4 text-base font-medium">
                <span className="mr-2 text-neutral-500 px-4">{pool.id}</span>
                <div className="relative w-6 h-6 mr-2">
                  <Image
                    src={pool.icon}
                    alt={pool.name}
                    layout="fill"
                    className="rounded-full"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-lg">{pool.name}</span>
                  {pool.version != undefined && pool.version > 0 && (
                    <span className="px-2 inline-flex text-xs leading-4 font-medium rounded-md bg-purpleBG-lighter text-purple">
                      v{pool.version}
                    </span>
                  )}
                  {pool.isActive && (
                    <span className="px-2 inline-flex text-xs leading-4 font-medium rounded-md bg-purpleBG-lighter text-purple">
                      Active
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-base">
                <div className="px-2 py-3">
                  <p className="text-sm text-gray-500 mb-1">Supply</p>
                  <p>{pool.supply}</p>
                </div>
                <div className="px-2 py-3">
                  <p className="text-sm text-gray-500 mb-1">Supply APY</p>
                  <p>{pool.supplyAPY}</p>
                </div>
                <div className="px-2 py-3">
                  <p className="text-sm text-gray-500 mb-1">Borrow APY</p>
                  <p>{pool.borrowAPY}</p>
                </div>
                <div className="px-2 py-3">
                  <p className="text-sm text-gray-500 mb-1">In Pool</p>
                  <p>{pool.yourBalance}</p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default PoolsTable;
