/* eslint-disable no-var */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { poolDetailsPlaceholder } from "@/app/lib/static-values";
import { Copy, Info } from "@phosphor-icons/react";
import Tooltip from "../components/tooltip";
import { useWeb3React } from "@web3-react/core";
import { useNetwork } from "@/app/context/network-context";
import { getShortenedAddress } from "@/app/lib/web3-constants";
import { useEffect, useState } from "react";
import { BASE_NETWORK } from "@/app/lib/constants"; 
import { ethers, utils , Contract} from "ethers";
import { formatUnits, parseUnits } from "ethers/lib/utils";

import VEther from "../../abi/vanna/v1/out/VEther.sol/VEther.json"
import VToken from "../../abi/vanna/v1/out/VToken.sol/VToken.json"
import { addressList } from "@/app/lib/web3-constants";

import DefaultRateModel from "../../abi/vanna/v1/out/DefaultRateModel.sol/DefaultRateModel.json";
import Multicall from "../../abi/vanna/v1/out/Multicall.sol/Multicall.json";
import { ceilWithPrecision6, ceilWithPrecision } from "@/app/lib/helper";
import { SECS_PER_YEAR , FEES} from "@/app/lib/constants";


const PoolDetails = ({ pool }: { pool: PoolTable }) => {
  const { account, library } = useWeb3React();
  const { currentNetwork } = useNetwork();
  const [details, setDetails] = useState(poolDetailsPlaceholder);
  const [poolAddress, setPoolAddress] = useState("-");


  useEffect(()=> {
    if (currentNetwork.name === BASE_NETWORK) {
      try{
        if (account) {
          const fetchValues = async () => {
            const iFaceEth = new utils.Interface(VEther.abi);
            const iFaceToken = new utils.Interface(VToken.abi);

            const MCcontract = new Contract(
              addressList.multicallAddress,
              Multicall.abi,
              library
            );

            const calldata = [];
            let tempData;

            tempData = utils.arrayify(
                        iFaceEth.encodeFunctionData("balanceOf",
                          [addressList.vEtherContractAddress]
                        )
            )
            calldata.push([addressList.wethTokenAddress, tempData]);
            
            tempData = utils.arrayify(
                        iFaceToken.encodeFunctionData("balanceOf",
                          [addressList.vWBTCContractAddress]
                        )
            )
            calldata.push([addressList.wbtcTokenAddress, tempData]);
            
            tempData = utils.arrayify(
                        iFaceToken.encodeFunctionData("balanceOf",
                          [addressList.vUSDCContractAddress]
                        )
            )
            calldata.push([addressList.usdcTokenAddress, tempData]);
            
            tempData = utils.arrayify(
                        iFaceToken.encodeFunctionData("balanceOf",
                          [addressList.vUSDTContractAddress]
                        )
            )
            calldata.push([addressList.usdtTokenAddress, tempData]);

            tempData = utils.arrayify(
                        iFaceToken.encodeFunctionData("balanceOf",
                          [addressList.vDaiContractAddress]
                        )
            )
            calldata.push([addressList.daiTokenAddress, tempData]);

            // totalBorrow 
            //ETH
            tempData = utils.arrayify(
              iFaceEth.encodeFunctionData("getBorrows",
                []
              )
            )
            calldata.push([addressList.vEtherContractAddress, tempData]);

            //WBTC
            tempData = utils.arrayify(
                        iFaceToken.encodeFunctionData("getBorrows",
                          []
                        )
            )
            calldata.push([addressList.vWBTCContractAddress, tempData]);

            //USDC
            tempData = utils.arrayify(
                        iFaceToken.encodeFunctionData("getBorrows",
                          []
                        )
            )
            calldata.push([addressList.vUSDCContractAddress, tempData]);

            //USDT
            tempData = utils.arrayify(
                        iFaceToken.encodeFunctionData("getBorrows",
                          []
                        )
            )
            calldata.push([addressList.vUSDTContractAddress, tempData]);

            //DAI
            tempData = utils.arrayify(
                        iFaceToken.encodeFunctionData("getBorrows",
                          []
                        )
            )
            calldata.push([addressList.vDaiContractAddress, tempData]);

            tempData = utils.arrayify(
                        iFaceToken.encodeFunctionData("convertToAssets",
                          [parseUnits("1",18)]
                        )
            )
            calldata.push([addressList.vEtherContractAddress, tempData])

            tempData = utils.arrayify(
                        iFaceToken.encodeFunctionData("convertToAssets",
                          [parseUnits("1",18)]
                        )
            )
            calldata.push([addressList.vWBTCContractAddress, tempData])

            tempData = utils.arrayify(
                        iFaceToken.encodeFunctionData("convertToAssets",
                          [parseUnits("1",18)]
                        )
            )
            calldata.push([addressList.vUSDCContractAddress, tempData])

            tempData = utils.arrayify(
                        iFaceToken.encodeFunctionData("convertToAssets",
                          [parseUnits("1",18)]
                        )
            )
            calldata.push([addressList.vUSDTContractAddress, tempData])

            tempData = utils.arrayify(
                        iFaceToken.encodeFunctionData("convertToAssets",
                          [parseUnits("1",18)]
                        )
            )
            calldata.push([addressList.vDaiContractAddress, tempData])
            

            var res = await MCcontract.callStatic.aggregate(calldata);

            //avaibaleAssetsInContract 

            const avaibaleETH = res.returnData[0];
            const avaibaleBTC = res.returnData[1];
            const avaibaleUSDC = res.returnData[2];
            const avaibaleUSDT = res.returnData[3];
            const avaibaleDai = res.returnData[4];

          
            // totalBorrow 

            const ethTotalBorrow = res.returnData[5];
            const wbtcTotalBorrow = res.returnData[6];
            const usdcTotalBorrow = res.returnData[7];
            const usdtTotalBorrow = res.returnData[8];
            const daiTotalBorrow = res.returnData[9];

            // Token to vTOken 
            const ethToVeth = res.returnData[10];
            const btcToVbtc = res.returnData[11];
            const usdcToVusdc = res.returnData[12];
            const usdtToVusdt = res.returnData[13];
            const daiToVdai = res.returnData[14];

            // utilazation rate 
            // let ethUtilization = ethTotalBorrow/parseFloat(formatUnits(pool.supply));

            if(pool.name === "WETH") {
              const updatedPoolDetails = details.map((detail)=>{
                if(detail.label === "SUPPLY APY") {
                  return {
                    ...detail,
                    value: pool.supplyAPY
                  }
                }
                if(detail.label === "BORROW APY") {
                  return {
                    ...detail,
                    value: pool.borrowAPY
                  }
                }
                if(detail.label === "VTOKEN RATE") {
                  return {
                    ...detail,
                    value: String(ceilWithPrecision(formatUnits(ethToVeth)))
                  }
                }
                if(detail.label === "TOTAL LIQUIDITY") {
                  return {
                    ...detail,
                    value: pool.supply + " " + pool.name
                  }
                }
                if(detail.label === "LIQUIDITY IN DOLLAR") {
                  return {
                    ...detail,
                    // TODO: add logic of mux price 
                    value: pool.supply + " " + pool.name
                  }
                }
              
                if(detail.label === "TOTAL BORROWED") {
                  return {
                    ...detail,
                    value: ceilWithPrecision6(formatUnits(ethTotalBorrow)) 
                  }
                }
  
                if(detail.label === "AVAILABLE LIQUIDITY") {
                  return {
                    ...detail,
                    value: ceilWithPrecision6(formatUnits(avaibaleETH)) +  " " + pool.name
                  }
                }
                if(detail.label === "UNIQUE USERS") {
                  return {
                    ...detail,
                    value: pool.supplyAPY
                  }
                }
                if(detail.label === "WITHDRAWAL FEES") {
                  return {
                    ...detail,
                    value: "0.00 %"
                  }
                }
                return detail;
              })
              setDetails(updatedPoolDetails);
            }
            if(pool.name === "WBTC") {
              const updatedPoolDetails = details.map((detail)=>{
                if(detail.label === "SUPPLY APY") {
                  return {
                    ...detail,
                    value: pool.supplyAPY
                  }
                }
                if(detail.label === "BORROW APY") {
                  return {
                    ...detail,
                    value: pool.borrowAPY
                  }
                }
                if(detail.label === "VTOKEN RATE") {
                  return {
                    ...detail,
                    value: String(ceilWithPrecision(formatUnits(btcToVbtc)))
                  }
                }
                if(detail.label === "TOTAL LIQUIDITY") {
                  return {
                    ...detail,
                    value: pool.supply + " " + pool.name
                  }
                }
                if(detail.label === "LIQUIDITY IN DOLLAR") {
                  return {
                    ...detail,
                    // TODO: add logic of mux price 
                    value: pool.supply + " " + pool.name
                  }
                }
              
                if(detail.label === "TOTAL BORROWED") {
                  return {
                    ...detail,
                    value: ceilWithPrecision6(formatUnits(wbtcTotalBorrow)) 
                  }
                }
  
                if(detail.label === "AVAILABLE LIQUIDITY") {
                  return {
                    ...detail,
                    value: ceilWithPrecision6(formatUnits(avaibaleBTC)) +  " " + pool.name
                  }
                }
                if(detail.label === "UNIQUE USERS") {
                  return {
                    ...detail,
                    value: pool.supplyAPY
                  }
                }
                if(detail.label === "WITHDRAWAL FEES") {
                  return {
                    ...detail,
                    value: "0.00 %"
                  }
                }
                return detail;
              })
              setDetails(updatedPoolDetails);
            }
            if(pool.name === "USDC") {
              const updatedPoolDetails = details.map((detail)=>{
                if(detail.label === "SUPPLY APY") {
                  return {
                    ...detail,
                    value: pool.supplyAPY
                  }
                }
                if(detail.label === "BORROW APY") {
                  return {
                    ...detail,
                    value: pool.borrowAPY
                  }
                }
                if(detail.label === "VTOKEN RATE") {
                  return {
                    ...detail,
                    value: String(ceilWithPrecision(formatUnits(usdcToVusdc)))
                  }
                }
                if(detail.label === "TOTAL LIQUIDITY") {
                  return {
                    ...detail,
                    value: pool.supply + " " + pool.name
                  }
                }
                if(detail.label === "LIQUIDITY IN DOLLAR") {
                  return {
                    ...detail,
                    // TODO: add logic of mux price 
                    value: pool.supply + " " + pool.name
                  }
                }
              
                if(detail.label === "TOTAL BORROWED") {
                  return {
                    ...detail,
                    value: ceilWithPrecision6(formatUnits(usdcTotalBorrow)) 
                  }
                }
  
                if(detail.label === "AVAILABLE LIQUIDITY") {
                  return {
                    ...detail,
                    value: ceilWithPrecision6(formatUnits(avaibaleUSDC)) +  " " + pool.name
                  }
                }
                if(detail.label === "UNIQUE USERS") {
                  return {
                    ...detail,
                    value: pool.supplyAPY
                  }
                }
                if(detail.label === "WITHDRAWAL FEES") {
                  return {
                    ...detail,
                    value: "0.00 %"
                  }
                }
                return detail;
              })
              setDetails(updatedPoolDetails);
            }
            if(pool.name === "USDT") {
              const updatedPoolDetails = details.map((detail)=>{
                if(detail.label === "SUPPLY APY") {
                  return {
                    ...detail,
                    value: pool.supplyAPY
                  }
                }
                if(detail.label === "BORROW APY") {
                  return {
                    ...detail,
                    value: pool.borrowAPY
                  }
                }
                if(detail.label === "VTOKEN RATE") {
                  return {
                    ...detail,
                    value: String(ceilWithPrecision(formatUnits(usdtToVusdt)))
                  }
                }
                if(detail.label === "TOTAL LIQUIDITY") {
                  return {
                    ...detail,
                    value: pool.supply + " " + pool.name
                  }
                }
                if(detail.label === "LIQUIDITY IN DOLLAR") {
                  return {
                    ...detail,
                    // TODO: add logic of mux price 
                    value: pool.supply + " " + pool.name
                  }
                }
              
                if(detail.label === "TOTAL BORROWED") {
                  return {
                    ...detail,
                    value: ceilWithPrecision6(formatUnits(usdtTotalBorrow)) 
                  }
                }
  
                if(detail.label === "AVAILABLE LIQUIDITY") {
                  return {
                    ...detail,
                    value: ceilWithPrecision6(formatUnits(avaibaleUSDT)) +  " " + pool.name
                  }
                }
                if(detail.label === "UNIQUE USERS") {
                  return {
                    ...detail,
                    value: pool.supplyAPY
                  }
                }
                if(detail.label === "WITHDRAWAL FEES") {
                  return {
                    ...detail,
                    value: "0.00 %"
                  }
                }
                return detail;
              })
              setDetails(updatedPoolDetails);
            }
            if(pool.name === "DAI") {
              const updatedPoolDetails = details.map((detail)=>{
                if(detail.label === "SUPPLY APY") {
                  return {
                    ...detail,
                    value: pool.supplyAPY
                  }
                }
                if(detail.label === "BORROW APY") {
                  return {
                    ...detail,
                    value: pool.borrowAPY
                  }
                }
                if(detail.label === "VTOKEN RATE") {
                  return {
                    ...detail,
                    value: String(ceilWithPrecision(formatUnits(daiToVdai)))
                  }
                }
                if(detail.label === "TOTAL LIQUIDITY") {
                  return {
                    ...detail,
                    value: pool.supply + " " + pool.name
                  }
                }
                if(detail.label === "LIQUIDITY IN DOLLAR") {
                  return {
                    ...detail,
                    // TODO: add logic of mux price 
                    value: pool.supply + " " + pool.name
                  }
                }
              
                if(detail.label === "TOTAL BORROWED") {
                  return {
                    ...detail,
                    value: ceilWithPrecision6(formatUnits(daiTotalBorrow)) 
                  }
                }
  
                if(detail.label === "AVAILABLE LIQUIDITY") {
                  return {
                    ...detail,
                    value: ceilWithPrecision6(formatUnits(avaibaleDai)) +  " " + pool.name
                  }
                }
                if(detail.label === "UNIQUE USERS") {
                  return {
                    ...detail,
                    value: pool.supplyAPY
                  }
                }
                if(detail.label === "WITHDRAWAL FEES") {
                  return {
                    ...detail,
                    value: "0.00 %"
                  }
                }
                return detail;
              })
              setDetails(updatedPoolDetails);
            }
          }
          fetchValues();
 
        }
        // if(work) {
        //     let iFaceEth = new utils.Interface(VEther.abi);
        //     let iFaceToken = new utils.Interface(VToken.abi);
        //     const MCcontract = new Contract(
        //       addressList.multicallAddress,
        //       Multicall.abi,
        //       library
        //     );
        //     let calldata = [];
        //     let tempData;
        //     // ETH 
        //     tempData = utils.arrayify(
        //       iFaceEth.encodeFunctionData("totalSupply",
        //       [])
        //     );
        //     calldata.push([addressList.vEtherContractAddress, tempData]);

        //     tempData = utils.arrayify(
        //                 iFaceEth.encodeFunctionData("balanceOf",
        //                   [addressList.vEtherContractAddress]
        //                 )
        //     )
        //     calldata.push([addressList.wethTokenAddress, tempData]);

        //     // WBTC

        //     tempData = utils.arrayify(
        //       iFaceToken.encodeFunctionData("totalSupply",
        //       [])
        //     );
            
        //     calldata.push([addressList.vWBTCContractAddress, tempData]);
        //     tempData = utils.arrayify(
        //                 iFaceToken.encodeFunctionData("balanceOf",
        //                   [addressList.vWBTCContractAddress]
        //                 )
        //     )
        //     calldata.push([addressList.wbtcTokenAddress, tempData]);
            
        //     console.log("works");
        //     // USDC
        //     tempData = utils.arrayify(
        //                 iFaceToken.encodeFunctionData("totalSupply",
        //                 [])
        //               );
        //     calldata.push([addressList.vUSDCContractAddress, tempData]);

        //     tempData = utils.arrayify(
        //                 iFaceToken.encodeFunctionData("balanceOf",
        //                   [addressList.vUSDCContractAddress]
        //                 )
        //     )
        //     calldata.push([addressList.usdcTokenAddress, tempData]);
            
        //     // USDT
        //     tempData = utils.arrayify(
        //                 iFaceToken.encodeFunctionData("totalSupply",
        //                 [])
        //               );
        //     calldata.push([addressList.vUSDTContractAddress, tempData]);

        //     tempData = utils.arrayify(
        //                 iFaceToken.encodeFunctionData("balanceOf",
        //                   [addressList.vUSDTContractAddress]
        //                 )
        //     )
        //     calldata.push([addressList.usdtTokenAddress, tempData]);

        //     // DAI 
        //     tempData = utils.arrayify(
        //                 iFaceToken.encodeFunctionData("totalSupply",
        //                 [])
        //               );
        //     calldata.push([addressList.vDaiContractAddress, tempData]);

        //     tempData = utils.arrayify(
        //                 iFaceToken.encodeFunctionData("balanceOf",
        //                   [addressList.vDaiContractAddress]
        //                 )
        //     )
        //     calldata.push([addressList.daiTokenAddress, tempData]);

        //     // totalBorrow 
        //     //ETH
        //     tempData = utils.arrayify(
        //       iFaceEth.encodeFunctionData("getBorrows",
        //         []
        //       )
        //     )
        //     calldata.push([addressList.vEtherContractAddress, tempData]);

        //     //WBTC
        //     tempData = utils.arrayify(
        //                 iFaceToken.encodeFunctionData("getBorrows",
        //                   []
        //                 )
        //     )
        //     calldata.push([addressList.vWBTCContractAddress, tempData]);

        //     //USDC
        //     tempData = utils.arrayify(
        //                 iFaceToken.encodeFunctionData("getBorrows",
        //                   []
        //                 )
        //     )
        //     calldata.push([addressList.vUSDCContractAddress, tempData]);

        //     //USDT
        //     tempData = utils.arrayify(
        //                 iFaceToken.encodeFunctionData("getBorrows",
        //                   []
        //                 )
        //     )
        //     calldata.push([addressList.vUSDTContractAddress, tempData]);

        //     //DAI
        //     tempData = utils.arrayify(
        //                 iFaceToken.encodeFunctionData("getBorrows",
        //                   []
        //                 )
        //     )
        //     calldata.push([addressList.vDaiContractAddress, tempData]);
            
        //     //User assets balance

        //     //ETH
        //     tempData = utils.arrayify(
        //                 iFaceEth.encodeFunctionData("balanceOf",
        //                   [account]
        //                 )
        //     )
        //     calldata.push([addressList.vEtherContractAddress, tempData]);

        //     //WBTC
        //     tempData = utils.arrayify(
        //                 iFaceToken.encodeFunctionData("balanceOf",
        //                   [account]
        //                 )
        //     )
        //     calldata.push([addressList.vWBTCContractAddress, tempData]);

        //     //USDC
        //     tempData = utils.arrayify(
        //                 iFaceToken.encodeFunctionData("balanceOf",
        //                   [account]
        //                 )
        //     )
        //     calldata.push([addressList.vUSDCContractAddress, tempData]);

        //     //USDT
        //     tempData = utils.arrayify(
        //                 iFaceToken.encodeFunctionData("balanceOf",
        //                   [account]
        //                 )
        //     )
        //     calldata.push([addressList.vUSDTContractAddress, tempData]);

        //     //DAI
        //     tempData = utils.arrayify(
        //                 iFaceToken.encodeFunctionData("balanceOf",
        //                   [account]
        //                 )
        //     )
        //     calldata.push([addressList.vDaiContractAddress, tempData]);

        //     var res = await MCcontract.callStatic.aggregate(calldata);
            
        //     // assigne value
        //     //supply 

        //     let ethSupply = formatUnits(res.returnData[0]);
        //     let wbtcSupply = formatUnits(res.returnData[1]);
        //     let usdcSupply = formatUnits(res.returnData[2],6);
        //     let usdtSupply = formatUnits(res.returnData[3],6);
        //     let daiSupply = formatUnits(res.returnData[4]);

        //     //avaibaleAssetsInContract 

        //     let avaibaleETH = res.returnData[1];
        //     let avaibaleBTC = res.returnData[3];
        //     let avaibaleUSDC = res.returnData[5];
        //     let avaibaleUSDT = res.returnData[7];
        //     let avaibaleDai = res.returnData[9];

        //     console.log("avaibaleETH",avaibaleETH);

        //      // totalBorrow 

        //      let ethTotalBorrow = res.returnData[10];
        //      let wbtcTotalBorrow = res.returnData[11];
        //      let usdcTotalBorrow = res.returnData[12];
        //      let usdtTotalBorrow = res.returnData[13];
        //      let daiTotalBorrow = res.returnData[14];

        //      console.log("ethTotalBorrow",ethTotalBorrow);
        //      console.log("f-ethTotalBorrow",formatUnits(ethTotalBorrow));
        //      console.log("P-ethTotalBorrow",ethTotalBorrow);


        //     // Utilization Rate 

        //     let ethUtilization = parseFloat(ethTotalBorrow) /parseFloat(ethSupply) ;
        //     let wbtcUtilization = parseFloat(wbtcTotalBorrow)/ parseFloat(wbtcSupply);
        //     let usdcUtilization = parseFloat(usdcTotalBorrow)/parseFloat(usdcSupply);
        //     let usdtUtilization = parseFloat(usdtTotalBorrow)/parseFloat(usdtSupply);
        //     let daiUtilization = parseFloat(daiTotalBorrow)/parseFloat(daiSupply);
        //     console.log("ethUtilization",ethUtilization);

        //     // Your Balance 
        //     const ethBal = formatUnits(res.returnData[15], 18); 
        //     const wbtcBal = formatUnits(res.returnData[16], 18);
        //     const usdcBal = formatUnits(res.returnData[17], 18);
        //     const usdtBal = formatUnits(res.returnData[18], 18);
        //     const daiBal = formatUnits(res.returnData[19], 18);

        //     console.log("ethBal",ethBal);

        //     // Dependent varibale data fetching 
        //     let calldata1 = [];
        //     let tempData1;
        //     let iFaceRateModel = new utils.Interface(DefaultRateModel.abi);
            

        //     //BorrowAPY
        //     //ETH
        //     tempData1 = utils.arrayify(
        //                   iFaceRateModel.encodeFunctionData("getBorrowRatePerSecond",
        //                   [avaibaleETH,ethTotalBorrow]
        //                 )
        //               );
        //     calldata1.push([addressList.rateModelContractAddress, tempData1]);

        //     //BTC
        //     tempData1 = utils.arrayify(
        //                   iFaceRateModel.encodeFunctionData("getBorrowRatePerSecond",
        //                   [avaibaleBTC,wbtcTotalBorrow]
        //                   )
        //                 );
        //     calldata1.push([addressList.rateModelContractAddress, tempData1]);

        //     //USDC
        //     tempData1 = utils.arrayify(
        //                 iFaceRateModel.encodeFunctionData("getBorrowRatePerSecond",
        //                 [avaibaleUSDC,usdcTotalBorrow]
        //               )
        //             );
        //     calldata1.push([addressList.rateModelContractAddress, tempData1]);
            
        //     //USDT
        //     tempData1 = utils.arrayify(
        //                 iFaceRateModel.encodeFunctionData("getBorrowRatePerSecond",
        //                 [avaibaleUSDT,usdtTotalBorrow]
        //               )
        //             );
        //     calldata1.push([addressList.rateModelContractAddress, tempData1]);
    
        //     //DAI
        //     tempData1 = utils.arrayify(
        //                   iFaceRateModel.encodeFunctionData("getBorrowRatePerSecond",
        //                   [avaibaleDai,daiTotalBorrow]
        //                 )
        //               );
        //     calldata1.push([addressList.rateModelContractAddress, tempData1]);

        //     var res1 = await MCcontract.callStatic.aggregate(calldata1);

        //     // console.log(res1);

        //     const ethBorrowAPY = res1.returnData[0];
        //     const ethBorrowApy = ethTotalBorrow != 0 ? parseFloat(formatUnits(ethBorrowAPY)) * SECS_PER_YEAR * 1e3 : 0;
        //     const ethSupplyApy = ethBorrowApy - ethBorrowApy * FEES;
        //     // const ethSupplyApy7D = (ethSupplyApy / 52);
            
        //     const btcBorrowAPY = res1.returnData[1];
        //     const wbtcBorrowApy =wbtcTotalBorrow != 0 ? parseFloat(formatUnits(btcBorrowAPY)) * SECS_PER_YEAR *1e3 : 0;
        //     const wbtcSupplyApy = wbtcBorrowApy - wbtcBorrowApy * FEES;
            
        //     const usdcBorrowAPY = res1.returnData[2];
        //     const usdcBorrowApy = usdcTotalBorrow != 0 ? parseFloat(formatUnits(usdcBorrowAPY))* SECS_PER_YEAR *1e3 : 0;
        //     const usdcSupplyApy = usdcBorrowApy - usdcBorrowApy * FEES;
            
        //     const usdtBorrowAPY = res1.returnData[3];
        //     const usdtBorrowApy = usdtTotalBorrow != 0 ? parseFloat(formatUnits(usdtBorrowAPY)) * SECS_PER_YEAR *1e3 : 0;
        //     const usdtSupplyApy = usdtBorrowAPY - usdtBorrowApy * FEES;
            
        //     const daiBorrowAPY = res1.returnData[4];
        //     const daiBorrowApy = daiTotalBorrow != 0 ? parseFloat(formatUnits(daiBorrowAPY)) * SECS_PER_YEAR *1e3 : 0;
        //     const daiSupplyApy = daiBorrowApy - daiBorrowApy * FEES;


        //     const availableETHLiq = parseFloat(formatUnits(ethSupply)) - parseFloat(formatUnits(ethTotalBorrow));
        //     const availableWBTCLiq = parseFloat(formatUnits(wbtcSupply)) - parseFloat(formatUnits(wbtcTotalBorrow));
        //     const availableUSDCLiq = parseFloat(formatUnits(usdcSupply)) - parseFloat(formatUnits(usdcTotalBorrow));
        //     const availableUSDTLiq = parseFloat(formatUnits(usdtSupply)) - parseFloat(formatUnits(usdtTotalBorrow));
        //     const availableDAILiq = parseFloat(formatUnits(daiSupply)) - parseFloat(formatUnits(daiTotalBorrow));
          
        //   }
            

      
      
      }
      catch (error) {
        console.error(error);
      }
    
    }
    

  },[account])

  // useEffect(() => {
  //   try {
  //     if (account) {
  //       const fetchValues = async () => {

  // TODO:: add data fetching here

  // for setting pool address, update below variable
  // setPoolAddress();

  // setDetails();
  // Note: as done in pool-table.tsx file after data fetching
  // Note: pools.map, do the same here after data fetching
  // Note: add condition and assign specific variables to it.
  // Note: and then update the updatedDetails using setDetails()
  // Note: function above.

  //       };

  //       fetchValues();
  //     } else {
  //       setDetails(poolDetailsPlaceholder);
  //     }
  //   } catch (error) {
  //     console.error(error);
  //   }
  // }, [account]);

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    // .then(() => {
    //   alert("Address copied to clipboard!");
    // });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-12 px-4 border border-neutral-300 rounded-2xl">
      {details.map((item, index) => (
        <div key={index} className="flex flex-col">
          <div className="flex items-center">
            <span className="text-sm text-baseBlack mr-1">{item.label}</span>
            <Tooltip content={item.tooltip}>
              <Info size={16} color="black" />
            </Tooltip>
          </div>
          <div className="font-semibold text-lg mt-1.5">{item.value}</div>
        </div>
      ))}
      <div className="flex flex-col">
        <div className="flex items-center cursor-pointer">
          <span className="text-sm text-baseBlack mr-1">ADDRESS</span>
          <Copy
            size={16}
            color="black"
            onClick={() => handleCopyAddress(poolAddress ? poolAddress : "")}
          />
        </div>
        <div className="font-semibold text-lg mt-1.5">
          {poolAddress == "-" ? poolAddress : getShortenedAddress(poolAddress)}
        </div>
      </div>
    </div>
  );
};

export default PoolDetails;
