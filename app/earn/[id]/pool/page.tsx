/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/rules-of-hooks */
"use client";

import { RootState } from "@/app/store/store";
import PoolDetailTabMenu from "@/app/ui/earn/pool-detail-tab-menu";
import SupplyWithdraw from "@/app/ui/earn/supply-withdraw";
import { useNetwork } from "@/app/context/network-context";
import { CaretLeft } from "@phosphor-icons/react";
import { useWeb3React } from "@web3-react/core";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

import { BASE_NETWORK, OPTIMISM_NETWORK } from "@/app/lib/constants";
import { Contract, utils } from "ethers";

import VEther from "../../../abi/vanna/v1/out/VEther.sol/VEther.json";
import VToken from "../../../abi/vanna/v1/out/VToken.sol/VToken.json";
import Multicall from "../../../abi/vanna/v1/out/Multicall.sol/Multicall.json";

import {
  arbAddressList,
  baseAddressList,
  opAddressList,
} from "@/app/lib/web3-constants";
import { formatUnits } from "ethers/lib/utils";
import { ceilWithPrecision } from "@/app/lib/helper";
export default function Page({ params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const pools = useSelector((state: RootState) => state.pools.poolsData);
    const [pool, setPool] = useState(
      pools.find((pool) => pool.id === Number(id))
    );
    const { account, library } = useWeb3React();
    const { currentNetwork } = useNetwork();
    const [utilizationRate, setUtilizationRate] = useState<string | undefined>(
      "-"
    );
    const [uniqueLP, setUniqueLP] = useState<string | undefined>("-");

    useEffect(() => {
      try {
        if (account) {
          if (currentNetwork.id === BASE_NETWORK) {
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

              tempData = utils.arrayify(
                iFaceEth.encodeFunctionData("totalSupply", [])
              );
              calldata.push([arbAddressList.vEtherContractAddress, tempData]);

              tempData = utils.arrayify(
                iFaceToken.encodeFunctionData("totalSupply", [])
              );

              calldata.push([arbAddressList.vWBTCContractAddress, tempData]);

              tempData = utils.arrayify(
                iFaceToken.encodeFunctionData("totalSupply", [])
              );
              calldata.push([arbAddressList.vUSDCContractAddress, tempData]);

              tempData = utils.arrayify(
                iFaceToken.encodeFunctionData("totalSupply", [])
              );
              calldata.push([arbAddressList.vUSDTContractAddress, tempData]);

              // DAI
              tempData = utils.arrayify(
                iFaceToken.encodeFunctionData("totalSupply", [])
              );
              calldata.push([arbAddressList.vDaiContractAddress, tempData]);

              const res = await MCcontract.callStatic.aggregate(calldata);

              // totalBorrow

              const ethTotalBorrow = res.returnData[0];
              const wbtcTotalBorrow = res.returnData[1];
              const usdcTotalBorrow = res.returnData[2];
              const usdtTotalBorrow = res.returnData[3];
              const daiTotalBorrow = res.returnData[4];
              // total supply
              const ethSupply = formatUnits(res.returnData[5]);
              const wbtcSupply = formatUnits(res.returnData[6]);
              const usdcSupply = formatUnits(res.returnData[7]);
              const usdtSupply = formatUnits(res.returnData[8]);
              const daiSupply = formatUnits(res.returnData[9]);

              let utilizationRate;

              //  Utilization Rate
              if (pool?.name === "WETH") {
                utilizationRate = String(
                  (Number(formatUnits(ethTotalBorrow)) / Number(ethSupply)) *
                    100
                );
                setUtilizationRate(ceilWithPrecision(utilizationRate) + "%");
                setUniqueLP("5");
              }
              if (pool?.name === "WBTC") {
                // if(wbtcSupply = "0") return setUtilizationRate("0" + "%");
                utilizationRate = String(
                  (Number(formatUnits(wbtcTotalBorrow)) / Number(wbtcSupply)) *
                    100
                );
                setUtilizationRate(ceilWithPrecision(utilizationRate) + "%");
                setUniqueLP("0");
              }
              if (pool?.name === "USDC") {
                utilizationRate = String(
                  (Number(formatUnits(usdcTotalBorrow)) / Number(usdcSupply)) *
                    100
                );
                setUtilizationRate(ceilWithPrecision(utilizationRate) + "%");
                setUniqueLP("3");
              }
              if (pool?.name === "USDT") {
                utilizationRate = String(
                  (Number(formatUnits(usdtTotalBorrow)) / Number(usdtSupply)) *
                    100
                );
                setUtilizationRate(ceilWithPrecision(utilizationRate) + "%");
                setUniqueLP("0");
              }
              if (pool?.name === "DAI") {
                utilizationRate = String(
                  (Number(formatUnits(daiTotalBorrow)) / Number(daiSupply)) *
                    100
                );
                setUtilizationRate(ceilWithPrecision(utilizationRate) + "%");
                setUniqueLP("");
              }
            };
            fetchValues();
          }
          if (currentNetwork.id === OPTIMISM_NETWORK) {
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

              const res = await MCcontract.callStatic.aggregate(calldata);

              // totalBorrow

              const ethTotalBorrow = res.returnData[10];
              const wbtcTotalBorrow = res.returnData[11];
              const usdcTotalBorrow = res.returnData[12];
              const usdtTotalBorrow = res.returnData[13];
              const daiTotalBorrow = res.returnData[14];

              //  Utilization Rate
              if (pool?.name === "WETH") {
                setUtilizationRate(
                  String(
                    parseFloat(ethTotalBorrow) /
                      parseFloat(String(pool?.supply))
                  )
                );
                setUniqueLP("5");
              }
              if (pool?.name === "WBTC") {
              }
              if (pool?.name === "WETH") {
                // const poolDetails =
                // setUtilizationRate = parseFloat(ethTotalBorrow) /parseFloat(String(pool?.supply));
              }
              if (pool?.name === "WETH") {
                // const poolDetails =
                // setUtilizationRate = parseFloat(ethTotalBorrow) /parseFloat(String(pool?.supply));
              }
              if (pool?.name === "WETH") {
                // const poolDetails =
                // setUtilizationRate = parseFloat(ethTotalBorrow) /parseFloat(String(pool?.supply));
              }
            };
            fetchValues();
          }
          if (currentNetwork.id === BASE_NETWORK) {
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

              const res = await MCcontract.callStatic.aggregate(calldata);

              // totalBorrow

              const ethTotalBorrow = res.returnData[10];
              const wbtcTotalBorrow = res.returnData[11];
              const usdcTotalBorrow = res.returnData[12];
              const usdtTotalBorrow = res.returnData[13];
              const daiTotalBorrow = res.returnData[14];

              //  Utilization Rate
              if (pool?.name === "WETH") {
                setUtilizationRate(
                  String(
                    parseFloat(ethTotalBorrow) /
                      parseFloat(String(pool?.supply))
                  )
                );
                setUniqueLP("5");
              }
              if (pool?.name === "WBTC") {
              }
              if (pool?.name === "WETH") {
                // const poolDetails =
                // setUtilizationRate = parseFloat(ethTotalBorrow) /parseFloat(String(pool?.supply));
              }
              if (pool?.name === "WETH") {
                // const poolDetails =
                // setUtilizationRate = parseFloat(ethTotalBorrow) /parseFloat(String(pool?.supply));
              }
              if (pool?.name === "WETH") {
                // const poolDetails =
                // setUtilizationRate = parseFloat(ethTotalBorrow) /parseFloat(String(pool?.supply));
              }
            };
            fetchValues();
          }
        }
      } catch (error) {
        console.error(error);
      }
    }, []);

    if (!pool) {
      notFound();
    }

    const handleTokenUpdate = (token: PoolTable) => {
      setPool(pools.find((pool) => pool.id === Number(token.id)));
    };

    return (
      <>
        <Link href="/earn" className="flex items-center mb-6">
          <CaretLeft size={20} color="#737373" />
          <span className="text-base font-medium text-neutral-500">
            Back to pools
          </span>
        </Link>

        <div className="flex items-center mb-5 space-x-2">
          <Image
            className="rounded-full shadow-md ring-1 ring-black ring-opacity-20"
            src={pool.icon}
            alt=""
            width="40"
            height="40"
          />
          <span className="text-2xl font-bold text-baseBlack">{pool.name}</span>
          {pool.version != undefined && pool.version > 0 && (
            <span className="px-2 py-0.5 inline-flex text-xs leading-4 font-medium rounded-md bg-purpleBG-lighter text-purple">
              v{pool.version}
            </span>
          )}
          {pool.isActive && (
            <span className="px-2 py-0.5 inline-flex text-xs leading-4 font-medium rounded-md bg-purpleBG-lighter text-purple">
              Active
            </span>
          )}
        </div>

        <div className="flex flex-col-reverse lg:flex-row lg:gap-5 xl:gap-10 text-base">
          <div className="bg-white pt-4 w-full lg:w-1/2 xl:w-full mx-auto mb-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-2 mb-10">
              <div className="py-5 px-4 pr-0">
                <div className="text-sm font-semibold text-neutral-500">
                  Supply
                </div>
                <div className="pt-2 text-2xl font-bold text-baseBlack">
                  {pool.supply + " "}
                  {pool.supply !== "-" && pool.name}
                </div>
              </div>
              <div className="py-5 px-4 pr-0">
                <div className="text-sm font-semibold text-neutral-500">
                  Supply APY
                </div>
                <div className="pt-2 text-2xl font-bold text-baseBlack">
                  {pool.supplyAPY}
                </div>
              </div>
              <div className="py-5 px-4 pr-0">
                <div className="text-sm font-semibold text-neutral-500">
                  Unique LP
                </div>
                <div className="pt-2 text-2xl font-bold text-baseBlack">
                  {uniqueLP}
                </div>
              </div>
              <div className="py-5 px-4 pr-0">
                <div className="text-sm font-semibold text-neutral-500">
                  Utilization rate
                </div>
                <div className="pt-2 text-2xl font-bold text-baseBlack">
                  {utilizationRate}
                </div>
              </div>
              <div className="py-5 px-4 pr-0">
                <div className="text-sm font-semibold text-neutral-500">
                  Your LP Balance
                </div>
                <div className="pt-2 text-2xl font-bold text-baseBlack">
                  {pool.yourBalance}
                </div>
              </div>
            </div>
            <PoolDetailTabMenu pool={pool} />
          </div>
          <div className="flex-none md:w-full lg:w-1/2 xl:w-2/5 pb-10 lg:pb-0">
            <SupplyWithdraw pool={pool} onTokenUpdate={handleTokenUpdate} />
          </div>
        </div>
      </>
    );
  } catch (error) {
    console.error(error);
  }
}
