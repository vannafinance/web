'use client';

import { useNetwork } from "@/app/context/network-context";
import { poolsPlaceholder } from "@/app/lib/static-values";
import { setPoolsData } from "@/app/store/pools-slice";
import { RootState } from "@/app/store/store";
import { useWeb3React } from "@web3-react/core";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

const PoolsTable = () => {
  const { account, library } = useWeb3React();
  const { currentNetwork } = useNetwork();
  const dispatch = useDispatch();
  const [pools, setPools] = useState(useSelector((state: RootState) => state.pools.poolsData));

  // useEffect(() => {
  //   try {
  //     if (account) {
  //       const fetchValues = async () => {
  //         let iFaceEth = new utils.Interface(VEther.abi);
  //         let iFaceToken = new utils.Interface(VToken.abi);

  //         const MCcontract = new Contract(
  //           addressList.multicallAddress,
  //           Multicall.abi,
  //           library
  //         );

  //         //totalSupply
  //         let calldata = [];
  //         let tempData;
  //         // ETH
  //         tempData = utils.arrayify(
  //           iFaceEth.encodeFunctionData("totalSupply", [])
  //         );
  //         calldata.push([addressList.vEtherContractAddress, tempData]);

  //         tempData = utils.arrayify(
  //           iFaceEth.encodeFunctionData("balanceOf", [
  //             addressList.vEtherContractAddress,
  //           ])
  //         );
  //         calldata.push([addressList.wethTokenAddress, tempData]);

  //         // WBTC
  //         tempData = utils.arrayify(
  //           iFaceToken.encodeFunctionData("totalSupply", [])
  //         );
  //         calldata.push([addressList.vWBTCContractAddress, tempData]);
  //         tempData = utils.arrayify(
  //           iFaceToken.encodeFunctionData("balanceOf", [
  //             addressList.vWBTCContractAddress,
  //           ])
  //         );
  //         calldata.push([addressList.wbtcTokenAddress, tempData]);

  //         // USDC
  //         tempData = utils.arrayify(
  //           iFaceToken.encodeFunctionData("totalSupply", [])
  //         );
  //         calldata.push([addressList.vUSDCContractAddress, tempData]);
  //         tempData = utils.arrayify(
  //           iFaceToken.encodeFunctionData("balanceOf", [
  //             addressList.vUSDCContractAddress,
  //           ])
  //         );
  //         calldata.push([addressList.usdcTokenAddress, tempData]);

  //         // USDT
  //         tempData = utils.arrayify(
  //           iFaceToken.encodeFunctionData("totalSupply", [])
  //         );
  //         calldata.push([addressList.vUSDTContractAddress, tempData]);
  //         tempData = utils.arrayify(
  //           iFaceToken.encodeFunctionData("balanceOf", [
  //             addressList.vUSDTContractAddress,
  //           ])
  //         );
  //         calldata.push([addressList.usdtTokenAddress, tempData]);
  //         // DAI
  //         tempData = utils.arrayify(
  //           iFaceToken.encodeFunctionData("totalSupply", [])
  //         );
  //         calldata.push([addressList.vDaiContractAddress, tempData]);
  //         tempData = utils.arrayify(
  //           iFaceToken.encodeFunctionData("balanceOf", [
  //             addressList.vDaiContractAddress,
  //           ])
  //         );
  //         calldata.push([addressList.daiTokenAddress, tempData]);

  //         // totalBorrow

  //         tempData = utils.arrayify(
  //           iFaceEth.encodeFunctionData("getBorrows", [])
  //         );
  //         calldata.push([addressList.vEtherContractAddress, tempData]);

  //         tempData = utils.arrayify(
  //           iFaceToken.encodeFunctionData("getBorrows", [])
  //         );
  //         calldata.push([addressList.vWBTCContractAddress, tempData]);

  //         tempData = utils.arrayify(
  //           iFaceToken.encodeFunctionData("getBorrows", [])
  //         );
  //         calldata.push([addressList.vUSDCContractAddress, tempData]);

  //         tempData = utils.arrayify(
  //           iFaceToken.encodeFunctionData("getBorrows", [])
  //         );
  //         calldata.push([addressList.vUSDTContractAddress, tempData]);

  //         tempData = utils.arrayify(
  //           iFaceToken.encodeFunctionData("getBorrows", [])
  //         );
  //         calldata.push([addressList.vDaiContractAddress, tempData]);

  //         //User assets balance

  //         tempData = utils.arrayify(
  //           iFaceEth.encodeFunctionData("balanceOf", [account])
  //         );
  //         calldata.push([addressList.vEtherContractAddress, tempData]);

  //         tempData = utils.arrayify(
  //           iFaceToken.encodeFunctionData("balanceOf", [account])
  //         );
  //         calldata.push([addressList.vWBTCContractAddress, tempData]);

  //         tempData = utils.arrayify(
  //           iFaceToken.encodeFunctionData("balanceOf", [account])
  //         );
  //         calldata.push([addressList.vUSDCContractAddress, tempData]);

  //         tempData = utils.arrayify(
  //           iFaceToken.encodeFunctionData("balanceOf", [account])
  //         );
  //         calldata.push([addressList.vUSDTContractAddress, tempData]);

  //         tempData = utils.arrayify(
  //           iFaceToken.encodeFunctionData("balanceOf", [account])
  //         );
  //         calldata.push([addressList.vDaiContractAddress, tempData]);

  //         var res = await MCcontract.callStatic.aggregate(calldata);
  //         console.log(res);

  //         let ethSupply = formatUnits(res.returnData[0]);
  //         ethSupply = ethSupply * (await getAssetPrice("WETH"));

  //         let wbtcSupply = formatUnits(res.returnData[2]);
  //         wbtcSupply = wbtcSupply * (await getAssetPrice("WBTC"));

  //         let usdcSupply = formatUnits(res.returnData[4], 6);
  //         usdcSupply = usdcSupply * (await getAssetPrice("USDC"));

  //         let usdtSupply = formatUnits(res.returnData[6], 6);
  //         usdtSupply = usdtSupply * (await getAssetPrice("USDT"));

  //         let daiSupply = formatUnits(res.returnData[8]);
  //         daiSupply = daiSupply * (await getAssetPrice("DAI"));

  //         //avaibaleAssetsInContract
  //         let avaibaleETH = res.returnData[1];
  //         let avaibaleBTC = res.returnData[3];
  //         let avaibaleUSDC = res.returnData[5];
  //         let avaibaleUSDT = res.returnData[7];
  //         let avaibaleDai = res.returnData[9];

  //         // totalBorrow

  //         let ethTotalBorrow = res.returnData[10];
  //         let wbtcTotalBorrow = res.returnData[11];
  //         let usdcTotalBorrow = res.returnData[12];
  //         let usdtTotalBorrow = res.returnData[13];
  //         let daiTotalBorrow = res.returnData[14];

  //         //User Asset balance
  //         const ethBal = formatUnits(res.returnData[15], 18) * 1;
  //         const wbtcBal = formatUnits(res.returnData[16], 18) * 1;
  //         const usdcBal = formatUnits(res.returnData[17], 18) * 1;
  //         const usdtBal = formatUnits(res.returnData[18], 18) * 1;
  //         const daiBal = formatUnits(res.returnData[19], 18) * 1;

  //         // Dependent varibale data fetching
  //         let calldata1 = [];
  //         let tempData1;
  //         let iFaceRateModel = new utils.Interface(DefaultRateModel.abi);

  //         //BorrowAPY
  //         //ETH
  //         tempData1 = utils.arrayify(
  //           iFaceRateModel.encodeFunctionData("getBorrowRatePerSecond", [
  //             avaibaleETH,
  //             ethTotalBorrow,
  //           ])
  //         );
  //         calldata1.push([addressList.rateModelContractAddress, tempData1]);
  //         //BTC
  //         tempData1 = utils.arrayify(
  //           iFaceRateModel.encodeFunctionData("getBorrowRatePerSecond", [
  //             avaibaleBTC,
  //             wbtcTotalBorrow,
  //           ])
  //         );
  //         calldata1.push([addressList.rateModelContractAddress, tempData1]);
  //         //USDC
  //         tempData1 = utils.arrayify(
  //           iFaceRateModel.encodeFunctionData("getBorrowRatePerSecond", [
  //             avaibaleUSDC,
  //             usdcTotalBorrow,
  //           ])
  //         );
  //         calldata1.push([addressList.rateModelContractAddress, tempData1]);
  //         //USDT
  //         tempData1 = utils.arrayify(
  //           iFaceRateModel.encodeFunctionData("getBorrowRatePerSecond", [
  //             avaibaleUSDT,
  //             usdtTotalBorrow,
  //           ])
  //         );
  //         calldata1.push([addressList.rateModelContractAddress, tempData1]);

  //         //DAI
  //         tempData1 = utils.arrayify(
  //           iFaceRateModel.encodeFunctionData("getBorrowRatePerSecond", [
  //             avaibaleDai,
  //             daiTotalBorrow,
  //           ])
  //         );
  //         calldata1.push([addressList.rateModelContractAddress, tempData1]);

  //         var res1 = await MCcontract.callStatic.aggregate(calldata1);
  //         console.log(res1);

  //         const ethBorrowAPY = res1.returnData[0];
  //         const ethBorrowApy =
  //           ethTotalBorrow != 0
  //             ? formatUnits(ethBorrowAPY) * secsPerYear * 1e3
  //             : 0;
  //         const ethSupplyApy = ethBorrowApy - ethBorrowApy * fees;

  //         const btcBorrowAPY = res1.returnData[1];
  //         const wbtcBorrowApy =
  //           wbtcTotalBorrow != 0
  //             ? formatUnits(btcBorrowAPY) * secsPerYear * 1e3
  //             : 0;
  //         const wbtcSupplyApy = wbtcBorrowApy - wbtcBorrowApy * fees;

  //         const usdcBorrowAPY = res1.returnData[2];
  //         const usdcBorrowApy =
  //           usdcTotalBorrow != 0
  //             ? formatUnits(usdcBorrowAPY) * secsPerYear * 1e3
  //             : 0;
  //         const usdcSupplyApy = usdcBorrowApy - usdcBorrowApy * fees;

  //         const usdtBorrowAPY = res1.returnData[3];
  //         const usdtBorrowApy =
  //           usdtTotalBorrow != 0
  //             ? formatUnits(usdtBorrowAPY) * secsPerYear * 1e3
  //             : 0;
  //         const usdtSupplyApy = usdtBorrowAPY - usdtBorrowAPY * fees;

  //         const daiBorrowAPY = res1.returnData[4];
  //         const daiBorrowApy =
  //           daiTotalBorrow != 0
  //             ? formatUnits(daiBorrowAPY) * secsPerYear * 1e3
  //             : 0;
  //         const daiSupplyApy = daiBorrowApy - daiBorrowApy * fees;

          // const updatedPools = pools.map((pool) => {
          //   if (pool.name === "WETH") {
          //     return {
          //       ...pool,
          //       supply: "$" + ceilWithPrecision6(ethSupply),
          //       supplyAPY: ceilWithPrecision(ethBorrowApy) + "%",
          //       borrowAPY: ceilWithPrecision(ethSupplyApy) + "%",
          //       yourBalance: ceilWithPrecision6(ethBal),
          //     };
          //   }
          //   if (pool.name === "WBTC") {
          //     return {
          //       ...pool,
          //       supply: "$" + ceilWithPrecision6(wbtcSupply),
          //       supplyAPY: ceilWithPrecision(wbtcBorrowApy) + "%",
          //       borrowAPY: ceilWithPrecision(wbtcSupplyApy) + "%",
          //       yourBalance: ceilWithPrecision6(wbtcBal),
          //     };
          //   }
          //   if (pool.name === "USDC") {
          //     return {
          //       ...pool,
          //       supply: "$" + ceilWithPrecision6(usdcSupply),
          //       supplyAPY: ceilWithPrecision(usdcBorrowApy) + "%",
          //       borrowAPY: ceilWithPrecision(usdcSupplyApy) + "%",
          //       yourBalance: ceilWithPrecision6(usdcBal),
          //     };
          //   }
          //   if (pool.name === "USDT") {
          //     return {
          //       ...pool,
          //       supply: "$" + ceilWithPrecision6(usdtSupply),
          //       supplyAPY: ceilWithPrecision(usdtBorrowApy) + "%",
          //       borrowAPY: ceilWithPrecision(usdtSupplyApy) + "%",
          //       yourBalance: ceilWithPrecision6(usdtBal),
          //     };
          //   }
          //   if (pool.name === "DAI") {
          //     return {
          //       ...pool,
          //       supply: "$" + ceilWithPrecision6(daiSupply),
          //       supplyAPY: ceilWithPrecision(daiBorrowApy) + "%",
          //       borrowAPY: ceilWithPrecision(daiSupplyApy) + "%",
          //       yourBalance: ceilWithPrecision6(daiBal),
          //     };
          //   }
          //   return pool;
          // });
          
          // setPools(updatedPools);
          // dispatch(setPoolsData(updatedPools));
  //       };

  //       fetchValues();
  //     } else {
  //       setPools(poolsPlaceholder);
  //     }
  //   } catch (error) {
  //     console.error(error);
  //   }
  // }, [account]);

  return (
    <div className="mt-4 overflow-x-auto">
      <div className="min-w-full text-base font-medium text-baseBlack">
        {/* Header */}
        <div className="bg-baseComplementary grid grid-cols-7 rounded-xl px-6 py-3 font-semibold">
          <div className="text-center">#</div>
          <div className="col-span-2">Pool</div>
          <div>Supply</div>
          <div>Supply APY</div>
          <div>Borrow APY</div>
          <div>Your Balance</div>
        </div>

        {/* Body */}
        <div className="bg-white text-center pt-6">
          {pools.map((pool: PoolTable) => (
            <Link
              href={`/earn/${pool.id}/pool`}
              key={pool.id}
              className="block group"
            >
              <div className="relative grid grid-cols-7 px-6 py-3 whitespace-nowrap transition-all duration-200 ease-in-out rounded-xl">
                <div className="z-10">{pool.id}</div>
                <div className="z-10 col-span-2">
                  <div className="flex items-center">
                    <Image
                      className="rounded-full shadow-md ring-1 ring-black ring-opacity-20"
                      src={pool.icon1}
                      alt=""
                      width="24"
                      height="24"
                    />
                    {pool.icon2 && (
                      <Image
                        className="rounded-full shadow-md ring-1 ring-black ring-opacity-20 -ml-2"
                        src={pool.icon2}
                        alt=""
                        width="24"
                        height="24"
                      />
                    )}
                    <div className="ml-4 flex items-center space-x-2">
                      <div className="font-medium text-gray-900">
                        {pool.name}
                      </div>
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
                <div className="z-10">{pool.supply}</div>
                <div className="z-10">{pool.supplyAPY}</div>
                <div className="z-10">{pool.borrowAPY}</div>
                <div className="z-10">{pool.yourBalance}</div>
                <div className="absolute inset-0 rounded-xl bg-transparent z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-in-out pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-r from-gradient-1 to-gradient-2 rounded-xl"></div>
                  <div className="absolute inset-[1px] bg-white rounded-xl"></div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PoolsTable;
