"use client";

import React, { useEffect, useState } from "react";
import clsx from "clsx";
import LenderDashboard from "./lender-dashboard";
import BorrowerDashboard from "./borrower-dashboard";
import Image from "next/image";
import { useDarkMode } from "../header/use-dark-mode";
import { utils, Contract } from "ethers";
import VEther from "@/app/abi/vanna/v1/out/VEther.sol/VEther.json";
import VToken from "@/app/abi/vanna/v1/out/VToken.sol/VToken.json";
import {
  arbAddressList,
  baseAddressList,
  opAddressList,
} from "@/app/lib/web3-constants";
import DefaultRateModel from "@/app/abi/vanna/v1/out/DefaultRateModel.sol/DefaultRateModel.json";
import Multicall from "@/app/abi/vanna/v1/out/Multicall.sol/Multicall.json";
import {
  ceilWithPrecision6,
  ceilWithPrecision,
  check0xHex,
} from "@/app/lib/helper";
import { SECS_PER_YEAR, FEES } from "@/app/lib/constants";
import { useNetwork } from "@/app/context/network-context";
import { useWeb3React } from "@web3-react/core";
import { formatUnits } from "ethers/lib/utils";


const TotalHoldings: React.FC<{ activeTab: string }> = ({ activeTab }) => {
  const { isDarkMode } = useDarkMode();
  const { account, library } = useWeb3React();
  const { currentNetwork } = useNetwork();
  const [totalHoldings, setTotalHolding] = useState();
  const [totalReturnsAmount, setTotalReturnsAmount] = useState();
  const [totalReturnsPercentage, setTotalReturnsPercentage] = useState();
  const [healthFactor, setHealthFactor] = useState();
  const [vannaLogoWithTextSrc, setVannaLogoWithTextSrc] = useState("");

  // TODO: delete below useEffect
  useEffect(() => {
    // const fetchValues = async () => {
    //   const iFaceEth = new utils.Interface(VEther.abi);
    //   const iFaceToken = new utils.Interface(VToken.abi);
    //   const MCcontract = new Contract(
    //     arbAddressList.multicallAddress,
    //     Multicall.abi,
    //     library
    //   );
    //   const calldata = [];
    //   let tempData;
    //   //User assets balance

    //   //ETH
    //   tempData = utils.arrayify(
    //     iFaceEth.encodeFunctionData("balanceOf", [account])
    //   );
    //   calldata.push([opAddressList.vEtherContractAddress, tempData]);

    //   //WBTC
    //   tempData = utils.arrayify(
    //     iFaceToken.encodeFunctionData("balanceOf", [account])
    //   );
    //   calldata.push([opAddressList.vWBTCContractAddress, tempData]);

    //   //USDC
    //   tempData = utils.arrayify(
    //     iFaceToken.encodeFunctionData("balanceOf", [account])
    //   );
    //   calldata.push([opAddressList.vUSDCContractAddress, tempData]);

    //   //USDT
    //   tempData = utils.arrayify(
    //     iFaceToken.encodeFunctionData("balanceOf", [account])
    //   );
    //   calldata.push([opAddressList.vUSDTContractAddress, tempData]);

    //   //DAI
    //   tempData = utils.arrayify(
    //     iFaceToken.encodeFunctionData("balanceOf", [account])
    //   );
    //   calldata.push([opAddressList.vDaiContractAddress, tempData]);

    
       

    //   const res = await MCcontract.callStatic.aggregate(calldata);
    //   console.log("res",res);



    //   //User Asset balance
    //   const ethBal = formatUnits(check0xHex(res.returnData[0]), 18);
    //   const wbtcBal = formatUnits(check0xHex(res.returnData[1]), 18);
    //   const usdcBal = formatUnits(check0xHex(res.returnData[2]), 6);
    //   const usdtBal = formatUnits(check0xHex(res.returnData[3]), 6);
    //   const daiBal = formatUnits(check0xHex(res.returnData[4]), 18);

    //     // convertSharesToAssets

    //   //ETH
    //   tempData = utils.arrayify(
    //     iFaceEth.encodeFunctionData("convertToAssets",[ethBal]) 
    //   );
    //   calldata.push([opAddressList.vEtherContractAddress, tempData]);
      
    //   // WBTC
    //   tempData = utils.arrayify(
    //     iFaceToken.encodeFunctionData("convertToAssets",[wbtcBal]) 
    //   );
    //   calldata.push([opAddressList.vWBTCContractAddress, tempData]);

    //   //USDC
    //   tempData = utils.arrayify(
    //     iFaceToken.encodeFunctionData("convertToAssets",[usdcBal]) 
    //   );
    //   calldata.push([opAddressList.vUSDCContractAddress, tempData]);

    //   // USDT
    //   tempData = utils.arrayify(
    //     iFaceToken.encodeFunctionData("convertToAssets",[usdtBal]) 
    //   );
    //   calldata.push([opAddressList.vUSDTContractAddress, tempData]);
      
    //   // DAI
    //   tempData = utils.arrayify(
    //     iFaceToken.encodeFunctionData("convertToAssets",[daiBal]) 
    //   );
    //   calldata.push([opAddressList.vDaiContractAddress, tempData]);

    //   const res1 = await MCcontract.callStatic.aggregate(calldata);
      

    //   //User Asset balance
    //   const ethusdcBal = formatUnits(check0xHex(res1.returnData[0]), 18);
    //   const wbtcusdcBal = formatUnits(check0xHex(res1.returnData[1]), 18);
    //   const usdcusdcBal = formatUnits(check0xHex(res1.returnData[2]), 6);
    //   const usdtusdcBal = formatUnits(check0xHex(res1.returnData[3]), 6);
    //   const daiusdcBal = formatUnits(check0xHex(res1.returnData[4]), 18);




    //   totalHoldings = ethusdcBal * etherum_price +
    //                   wbtcusdcBal * btcprice + 
    //                   usdcusdcBal * usdcPrice +
    //                   usdtusdcBal * usdtPrice +
    //                   daiusdcBal * daiPrice

    // };  
    // InitialLending = ethBal* etherum_price + 
    //                         wbtcBal * btcprice +
    //                         usdcBal * usdcPrice + 
    //                         usdtBal * usdtPrice + 
    //                         daiBal * daiPrice

    // TotalReturnsAmount = totalHoldings - InitialLending;


    // borrow DATA
     // const getwithdrawBalance = async() => {
  //   const signer = await library?.getSigner();
  //   const vEtherContract = new Contract(
  //     opAddressList.vEtherContractAddress,
  //     VEther.abi,
  //     signer
  //   );
  //   const vDaiContract = new Contract(
  //     opAddressList.vDaiContractAddress,
  //     VToken.abi,
  //     signer
  //   );
  //   const vUsdcContract = new Contract(
  //     opAddressList.vUSDCContractAddress,
  //     VToken.abi,
  //     signer
  //   );
  //   const vUsdtContract = new Contract(
  //     opAddressList.vUSDTContractAddress,
  //     VToken.abi,
  //     signer
  //   );
  //   const vWbtcContract = new Contract(
  //     opAddressList.vWBTCContractAddress,
  //     VToken.abi,
  //     signer
  //   );
  //   // @Withdraw balance 
  //   let accountBalance = await library?.getBalance(activeAccount)
  //   accountBalance = accountBalance/1e18;
  //   let borrowedBalance = await vEtherContract.callStatic.getBorrowBalance(activeAccount);
  //   borrowedBalance = borrowedBalance/1e18;
  //   let balance =  (accountBalance - borrowedBalance) * ether price

  //   // USDC 
  //   let accountBalance = erc20conatract(USDC).balanceOf(activeAccount)
  //   let borrowedBalance = await vUsdcContract.callStatic.getBorrowBalance(activeAccount);
    // balance += (accountBalance-borrowedBalance)USDC price

  // WBTC 
  //  accountBalance = erc20conatract(WBTC).balanceOf(activeAccount)
  // let borrowedBalance = await vWBTCContract.callStatic.getBorrowBalance(activeAccount);

  // //USDT
  // let accountBalance = erc20conatract(USDT).balanceOf(activeAccount)
  // let borrowedBalance = await vUSDTcontracr.callStatic.getBorrowBalance(activeAccount);

  // // DAI
  // let accountBalance = erc20conatract(DAI).balanceOf(activeAccount)
  // let borrowedBalance = await vDAIcontract.callStatic.getBorrowBalance(activeAccount);



  // totalHoldings = balance;
   // const riskEngineContract = new Contract(
      //   opAddressList.riskEngineContractAddress,
      //   RiskEngine.abi,
      //   signer
      // );
      // const totalbalance = await riskEngineContract.callStatic.getBalance(activeAccount);
      // TotalReturnsAmount = totalbalance - balance;
      // const borrowBalance = await riskEngineContract.callStatic.getBorrows(activeAccount);
      // let healthFactor1 = balance/borrowBalance
      // TotalReturnsPercentage = TotalReturnsAmount / balance


      


    
    if(activeTab === "Borrower")  {
      setTotalHolding(undefined);
      setTotalReturnsAmount(undefined);
      setTotalReturnsPercentage(undefined);
      setHealthFactor(undefined);
    }
    else {
      setTotalHolding(undefined);
      setTotalReturnsAmount(undefined);
      setTotalReturnsPercentage(undefined);
    }
  }, []);


  useEffect(() => {
    if (isDarkMode) {
      setVannaLogoWithTextSrc("/vanna-white-logo-text.svg");
    } else {
      setVannaLogoWithTextSrc("/vanna-black-logo-text.svg");
    }
  }, [isDarkMode]);

  return (
    <div className="bg-white dark:bg-baseDark rounded-3xl border border-purpleBG-lighter dark:border-neutral-700 p-4 lg:p-7 mb-7">
      <div className="flex justify-between items-start mb-10">
        <div>
          <h2 className="text-base font-medium text-neutral-500">
            Total Holdings
          </h2>
          <p className="text-3xl font-semibold mb-2">
            {totalHoldings ? totalHoldings : "-"}
          </p>
        </div>
        <Image src={vannaLogoWithTextSrc} width="92" height="28" alt="Vanna" />
      </div>
      <div
        className={clsx(
          "flex items-start",
          activeTab === "Borrower" ? "justify-between" : "justify-start"
        )}
      >
        <div>
          <p
            className={clsx(
              "text-3xl font-semibold",
              totalReturnsAmount
                ? "text-baseSuccess-300"
                : "text-baseBlack dark:text-baseWhite"
            )}
          >
            {totalReturnsAmount ? totalReturnsAmount : "-"}
            {totalReturnsPercentage && (
              <span className="text-sm font-medium">
                ({totalReturnsPercentage})
              </span>
            )}
          </p>
          <p className="text-sm text-gray-500">Total Returns</p>
        </div>
        {activeTab === "Borrower" && (
          <div>
            <p className="text-2xl font-semibold">
              {healthFactor ? healthFactor : "-"}
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
      case "Borrower":
        return <BorrowerDashboard />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white dark:bg-baseDark mt-6 rounded-lg text-baseBlack dark:text-baseWhite">
      <div className="flex space-x-6 mb-6 border-b border-neutral-100 dark:border-neutral-700 pb-2 text-xl">
        {["Lender", "Borrower"].map((tab) => (
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
