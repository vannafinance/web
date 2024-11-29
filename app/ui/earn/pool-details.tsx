/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { poolDetailsPlaceholder } from "@/app/lib/static-values";
import { Copy, Info } from "@phosphor-icons/react";
import Tooltip from "../components/tooltip";
import { useWeb3React } from "@web3-react/core";
import { useNetwork } from "@/app/context/network-context";
import {
  // baseAddressList,
  getShortenedAddress,
  opAddressList,
} from "@/app/lib/web3-constants";
import { useEffect, useState } from "react";
import {
  ARBITRUM_NETWORK,
  BASE_NETWORK,
  OPTIMISM_NETWORK,
} from "@/app/lib/constants";
import { utils, Contract } from "ethers";
import { formatUnits, parseUnits } from "ethers/lib/utils";

import VEther from "@/app/abi/vanna/v1/out/VEther.sol/VEther.json";
import VToken from "@/app/abi/vanna/v1/out/VToken.sol/VToken.json";
import { arbAddressList } from "@/app/lib/web3-constants";

import Multicall from "@/app/abi/vanna/v1/out/Multicall.sol/Multicall.json";
import { ceilWithPrecision, check0xHex } from "@/app/lib/helper";
import axios from "axios";
import { formatUSD } from "@/app/lib/number-format-helper";
import Notification from "../components/notification";

const PoolDetails = ({ pool }: { pool: PoolTable }) => {
  const { account, library } = useWeb3React();
  const { currentNetwork } = useNetwork();
  const [details, setDetails] = useState(poolDetailsPlaceholder);
  const [poolAddress, setPoolAddress] = useState("-");

  const [notifications, setNotifications] = useState<
    Array<{ id: number; type: NotificationType; message: string }>
  >([]);

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
    if (!currentNetwork) return;
    if (currentNetwork.id === ARBITRUM_NETWORK) {
      try {
        if (account) {
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

            tempData = utils.arrayify(
              iFaceEth.encodeFunctionData("balanceOf", [
                arbAddressList.vEtherContractAddress,
              ])
            );
            calldata.push([arbAddressList.wethTokenAddress, tempData]);

            tempData = utils.arrayify(
              iFaceToken.encodeFunctionData("balanceOf", [
                arbAddressList.vWBTCContractAddress,
              ])
            );
            calldata.push([arbAddressList.wbtcTokenAddress, tempData]);

            tempData = utils.arrayify(
              iFaceToken.encodeFunctionData("balanceOf", [
                arbAddressList.vUSDCContractAddress,
              ])
            );
            calldata.push([arbAddressList.usdcTokenAddress, tempData]);

            tempData = utils.arrayify(
              iFaceToken.encodeFunctionData("balanceOf", [
                arbAddressList.vUSDTContractAddress,
              ])
            );
            calldata.push([arbAddressList.usdtTokenAddress, tempData]);

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

            tempData = utils.arrayify(
              iFaceToken.encodeFunctionData("convertToAssets", [
                parseUnits("1", 18),
              ])
            );
            calldata.push([arbAddressList.vEtherContractAddress, tempData]);

            tempData = utils.arrayify(
              iFaceToken.encodeFunctionData("convertToAssets", [
                parseUnits("1", 18),
              ])
            );
            calldata.push([arbAddressList.vWBTCContractAddress, tempData]);

            tempData = utils.arrayify(
              iFaceToken.encodeFunctionData("convertToAssets", [
                parseUnits("1", 18),
              ])
            );
            calldata.push([arbAddressList.vUSDCContractAddress, tempData]);

            tempData = utils.arrayify(
              iFaceToken.encodeFunctionData("convertToAssets", [
                parseUnits("1", 18),
              ])
            );
            calldata.push([arbAddressList.vUSDTContractAddress, tempData]);

            tempData = utils.arrayify(
              iFaceToken.encodeFunctionData("convertToAssets", [
                parseUnits("1", 18),
              ])
            );
            calldata.push([arbAddressList.vDaiContractAddress, tempData]);

            const res = await MCcontract.callStatic.aggregate(calldata);

            //avaibaleAssetsInContract

            const avaibaleETH = check0xHex(res.returnData[0]);
            const avaibaleBTC = check0xHex(res.returnData[1]);
            const avaibaleUSDC = check0xHex(res.returnData[2]);
            const avaibaleUSDT = check0xHex(res.returnData[3]);
            const avaibaleDai = check0xHex(res.returnData[4]);

            // totalBorrow

            const ethTotalBorrow = check0xHex(res.returnData[5]);
            const wbtcTotalBorrow = check0xHex(res.returnData[6]);
            const usdcTotalBorrow = check0xHex(res.returnData[7]);
            const usdtTotalBorrow = check0xHex(res.returnData[8]);
            const daiTotalBorrow = check0xHex(res.returnData[9]);

            // Token to vTOken
            const ethToVeth = check0xHex(res.returnData[10]);
            const btcToVbtc = check0xHex(res.returnData[11]);
            const usdcToVusdc = check0xHex(res.returnData[12]);
            const usdtToVusdt = check0xHex(res.returnData[13]);
            const daiToVdai = check0xHex(res.returnData[14]);

            // utilazation rate
            // let ethUtilization = ethTotalBorrow/parseFloat(formatUnits(pool.supply));

            const val = await getPriceFromAssetsArray(pool.name);

            if (pool.name === "WETH") {
              const updatedPoolDetails = details.map((detail) => {
                if (detail.label === "SUPPLY APY") {
                  return {
                    ...detail,
                    value: pool.supplyAPY,
                  };
                }
                if (detail.label === "BORROW APY") {
                  return {
                    ...detail,
                    value: pool.borrowAPY,
                  };
                }
                if (detail.label === "VTOKEN RATE") {
                  return {
                    ...detail,
                    value: String(ceilWithPrecision(formatUnits(ethToVeth))),
                  };
                }
                if (detail.label === "TOTAL LIQUIDITY") {
                  return {
                    ...detail,
                    value: Number(pool.supply) * Number(ceilWithPrecision(formatUnits(ethToVeth)))+ " " + pool.name,
                  };
                }
                if (detail.label === "LQ. IN DOLLAR") {
                  return {
                    ...detail,
                    value: formatUSD(Number(pool.supply) * Number(val)),
                  };
                }

                if (detail.label === "TOTAL BORROWED") {
                  return {
                    ...detail,
                    value: ceilWithPrecision(formatUnits(ethTotalBorrow), 4),
                  };
                }

                if (detail.label === "AVAILABLE LIQUIDITY") {
                  return {
                    ...detail,
                    value:
                      ceilWithPrecision(formatUnits(avaibaleETH), 4) +
                      " " +
                      pool.name,
                  };
                }
                if (detail.label === "UNIQUE USERS") {
                  return {
                    ...detail,
                    value: pool.supplyAPY,
                  };
                }
                if (detail.label === "WITHDRAWAL FEES") {
                  return {
                    ...detail,
                    value: "0.00 %",
                  };
                }
                return detail;
              });
              setPoolAddress(arbAddressList.vEtherContractAddress);
              setDetails(updatedPoolDetails);
            }
            if (pool.name === "WBTC") {
              const updatedPoolDetails = details.map((detail) => {
                if (detail.label === "SUPPLY APY") {
                  return {
                    ...detail,
                    value: pool.supplyAPY,
                  };
                }
                if (detail.label === "BORROW APY") {
                  return {
                    ...detail,
                    value: pool.borrowAPY,
                  };
                }
                if (detail.label === "VTOKEN RATE") {
                  return {
                    ...detail,
                    value: String(ceilWithPrecision(formatUnits(btcToVbtc))),
                  };
                }
                if (detail.label === "TOTAL LIQUIDITY") {
                  return {
                    ...detail,
                    value: Number(pool.supply) * Number(ceilWithPrecision(formatUnits(btcToVbtc))) + " " + pool.name,
                  };
                }
                if (detail.label === "LQ. IN DOLLAR") {
                  return {
                    ...detail,
                    value: formatUSD(Number(pool.supply) * Number(val)),
                  };
                }

                if (detail.label === "TOTAL BORROWED") {
                  return {
                    ...detail,
                    value: ceilWithPrecision(formatUnits(wbtcTotalBorrow), 4),
                  };
                }

                if (detail.label === "AVAILABLE LIQUIDITY") {
                  return {
                    ...detail,
                    value:
                      ceilWithPrecision(formatUnits(avaibaleBTC), 4) +
                      " " +
                      pool.name,
                  };
                }
                if (detail.label === "UNIQUE USERS") {
                  return {
                    ...detail,
                    value: pool.supplyAPY,
                  };
                }
                if (detail.label === "WITHDRAWAL FEES") {
                  return {
                    ...detail,
                    value: "0.00 %",
                  };
                }
                return detail;
              });
              setPoolAddress(arbAddressList.vWBTCContractAddress);
              setDetails(updatedPoolDetails);
            }
            if (pool.name === "USDC") {
              const updatedPoolDetails = details.map((detail) => {
                if (detail.label === "SUPPLY APY") {
                  return {
                    ...detail,
                    value: pool.supplyAPY,
                  };
                }
                if (detail.label === "BORROW APY") {
                  return {
                    ...detail,
                    value: pool.borrowAPY,
                  };
                }
                if (detail.label === "VTOKEN RATE") {
                  return {
                    ...detail,
                    value: String(ceilWithPrecision(formatUnits(usdcToVusdc))),
                  };
                }
                if (detail.label === "TOTAL LIQUIDITY") {
                  return {
                    ...detail,
                    value: Number(pool.supply) * Number(ceilWithPrecision(formatUnits(usdcToVusdc))) + " " + pool.name,
                  };
                }
                if (detail.label === "LQ. IN DOLLAR") {
                  return {
                    ...detail,
                    value: formatUSD(Number(pool.supply) * Number(val)),
                  };
                }

                if (detail.label === "TOTAL BORROWED") {
                  return {
                    ...detail,
                    value: ceilWithPrecision(formatUnits(usdcTotalBorrow)),
                  };
                }

                if (detail.label === "AVAILABLE LIQUIDITY") {
                  return {
                    ...detail,
                    value:
                      ceilWithPrecision(formatUnits(avaibaleUSDC, 6)) +
                      " " +
                      pool.name,
                  };
                }
                if (detail.label === "UNIQUE USERS") {
                  return {
                    ...detail,
                    value: pool.supplyAPY,
                  };
                }
                if (detail.label === "WITHDRAWAL FEES") {
                  return {
                    ...detail,
                    value: "0.00 %",
                  };
                }
                return detail;
              });
              setPoolAddress(arbAddressList.vUSDCContractAddress);
              setDetails(updatedPoolDetails);
            }
            if (pool.name === "USDT") {
              const updatedPoolDetails = details.map((detail) => {
                if (detail.label === "SUPPLY APY") {
                  return {
                    ...detail,
                    value: pool.supplyAPY,
                  };
                }
                if (detail.label === "BORROW APY") {
                  return {
                    ...detail,
                    value: pool.borrowAPY,
                  };
                }
                if (detail.label === "VTOKEN RATE") {
                  return {
                    ...detail,
                    value: String(ceilWithPrecision(formatUnits(usdtToVusdt))),
                  };
                }
                if (detail.label === "TOTAL LIQUIDITY") {
                  return {
                    ...detail,
                    value: Number(pool.supply) * Number(ceilWithPrecision(formatUnits(usdtToVusdt))) + " " + pool.name,
                  };
                }
                if (detail.label === "LQ. IN DOLLAR") {
                  return {
                    ...detail,
                    value: formatUSD(Number(pool.supply) * Number(val)),
                  };
                }

                if (detail.label === "TOTAL BORROWED") {
                  return {
                    ...detail,
                    value: ceilWithPrecision(formatUnits(usdtTotalBorrow)),
                  };
                }

                if (detail.label === "AVAILABLE LIQUIDITY") {
                  return {
                    ...detail,
                    value:
                      ceilWithPrecision(formatUnits(avaibaleUSDT, 6)) +
                      " " +
                      pool.name,
                  };
                }
                if (detail.label === "UNIQUE USERS") {
                  return {
                    ...detail,
                    value: pool.supplyAPY,
                  };
                }
                if (detail.label === "WITHDRAWAL FEES") {
                  return {
                    ...detail,
                    value: "0.00 %",
                  };
                }
                return detail;
              });
              setPoolAddress(arbAddressList.vUSDTContractAddress);
              setDetails(updatedPoolDetails);
            }
            if (pool.name === "DAI") {
              const updatedPoolDetails = details.map((detail) => {
                if (detail.label === "SUPPLY APY") {
                  return {
                    ...detail,
                    value: pool.supplyAPY,
                  };
                }
                if (detail.label === "BORROW APY") {
                  return {
                    ...detail,
                    value: pool.borrowAPY,
                  };
                }
                if (detail.label === "VTOKEN RATE") {
                  return {
                    ...detail,
                    value: String(ceilWithPrecision(formatUnits(daiToVdai))),
                  };
                }
                if (detail.label === "TOTAL LIQUIDITY") {
                  return {
                    ...detail,
                    value: Number(pool.supply) * Number(ceilWithPrecision(formatUnits(daiToVdai))) + " " + pool.name,
                  };
                }
                if (detail.label === "LQ. IN DOLLAR") {
                  return {
                    ...detail,
                    value: formatUSD(Number(pool.supply) * Number(val)),
                  };
                }

                if (detail.label === "TOTAL BORROWED") {
                  return {
                    ...detail,
                    value: ceilWithPrecision(formatUnits(daiTotalBorrow)),
                  };
                }

                if (detail.label === "AVAILABLE LIQUIDITY") {
                  return {
                    ...detail,
                    value:
                      ceilWithPrecision(formatUnits(avaibaleDai)) +
                      " " +
                      pool.name,
                  };
                }
                if (detail.label === "UNIQUE USERS") {
                  return {
                    ...detail,
                    value: pool.supplyAPY,
                  };
                }
                if (detail.label === "WITHDRAWAL FEES") {
                  return {
                    ...detail,
                    value: "0.00 %",
                  };
                }
                return detail;
              });
              setPoolAddress(arbAddressList.vDaiContractAddress);
              setDetails(updatedPoolDetails);
            }
          };
          fetchValues();
        } else {
          setDetails(poolDetailsPlaceholder);
        }
        // if(work) {
        //     let iFaceEth = new utils.Interface(VEther.abi);
        //     let iFaceToken = new utils.Interface(VToken.abi);
        //     const MCcontract = new Contract(
        //       arbAddressList.multicallAddress,
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
        //     calldata.push([arbAddressList.vEtherContractAddress, tempData]);

        //     tempData = utils.arrayify(
        //                 iFaceEth.encodeFunctionData("balanceOf",
        //                   [arbAddressList.vEtherContractAddress]
        //                 )
        //     )
        //     calldata.push([arbAddressList.wethTokenAddress, tempData]);

        //     // WBTC

        //     tempData = utils.arrayify(
        //       iFaceToken.encodeFunctionData("totalSupply",
        //       [])
        //     );

        //     calldata.push([arbAddressList.vWBTCContractAddress, tempData]);
        //     tempData = utils.arrayify(
        //                 iFaceToken.encodeFunctionData("balanceOf",
        //                   [arbAddressList.vWBTCContractAddress]
        //                 )
        //     )
        //     calldata.push([arbAddressList.wbtcTokenAddress, tempData]);

        //     // USDC
        //     tempData = utils.arrayify(
        //                 iFaceToken.encodeFunctionData("totalSupply",
        //                 [])
        //               );
        //     calldata.push([arbAddressList.vUSDCContractAddress, tempData]);

        //     tempData = utils.arrayify(
        //                 iFaceToken.encodeFunctionData("balanceOf",
        //                   [arbAddressList.vUSDCContractAddress]
        //                 )
        //     )
        //     calldata.push([arbAddressList.usdcTokenAddress, tempData]);

        //     // USDT
        //     tempData = utils.arrayify(
        //                 iFaceToken.encodeFunctionData("totalSupply",
        //                 [])
        //               );
        //     calldata.push([arbAddressList.vUSDTContractAddress, tempData]);

        //     tempData = utils.arrayify(
        //                 iFaceToken.encodeFunctionData("balanceOf",
        //                   [arbAddressList.vUSDTContractAddress]
        //                 )
        //     )
        //     calldata.push([arbAddressList.usdtTokenAddress, tempData]);

        //     // DAI
        //     tempData = utils.arrayify(
        //                 iFaceToken.encodeFunctionData("totalSupply",
        //                 [])
        //               );
        //     calldata.push([arbAddressList.vDaiContractAddress, tempData]);

        //     tempData = utils.arrayify(
        //                 iFaceToken.encodeFunctionData("balanceOf",
        //                   [arbAddressList.vDaiContractAddress]
        //                 )
        //     )
        //     calldata.push([arbAddressList.daiTokenAddress, tempData]);

        //     // totalBorrow
        //     //ETH
        //     tempData = utils.arrayify(
        //       iFaceEth.encodeFunctionData("getBorrows",
        //         []
        //       )
        //     )
        //     calldata.push([arbAddressList.vEtherContractAddress, tempData]);

        //     //WBTC
        //     tempData = utils.arrayify(
        //                 iFaceToken.encodeFunctionData("getBorrows",
        //                   []
        //                 )
        //     )
        //     calldata.push([arbAddressList.vWBTCContractAddress, tempData]);

        //     //USDC
        //     tempData = utils.arrayify(
        //                 iFaceToken.encodeFunctionData("getBorrows",
        //                   []
        //                 )
        //     )
        //     calldata.push([arbAddressList.vUSDCContractAddress, tempData]);

        //     //USDT
        //     tempData = utils.arrayify(
        //                 iFaceToken.encodeFunctionData("getBorrows",
        //                   []
        //                 )
        //     )
        //     calldata.push([arbAddressList.vUSDTContractAddress, tempData]);

        //     //DAI
        //     tempData = utils.arrayify(
        //                 iFaceToken.encodeFunctionData("getBorrows",
        //                   []
        //                 )
        //     )
        //     calldata.push([arbAddressList.vDaiContractAddress, tempData]);

        //     //User assets balance

        //     //ETH
        //     tempData = utils.arrayify(
        //                 iFaceEth.encodeFunctionData("balanceOf",
        //                   [account]
        //                 )
        //     )
        //     calldata.push([arbAddressList.vEtherContractAddress, tempData]);

        //     //WBTC
        //     tempData = utils.arrayify(
        //                 iFaceToken.encodeFunctionData("balanceOf",
        //                   [account]
        //                 )
        //     )
        //     calldata.push([arbAddressList.vWBTCContractAddress, tempData]);

        //     //USDC
        //     tempData = utils.arrayify(
        //                 iFaceToken.encodeFunctionData("balanceOf",
        //                   [account]
        //                 )
        //     )
        //     calldata.push([arbAddressList.vUSDCContractAddress, tempData]);

        //     //USDT
        //     tempData = utils.arrayify(
        //                 iFaceToken.encodeFunctionData("balanceOf",
        //                   [account]
        //                 )
        //     )
        //     calldata.push([arbAddressList.vUSDTContractAddress, tempData]);

        //     //DAI
        //     tempData = utils.arrayify(
        //                 iFaceToken.encodeFunctionData("balanceOf",
        //                   [account]
        //                 )
        //     )
        //     calldata.push([arbAddressList.vDaiContractAddress, tempData]);

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

        //      // totalBorrow

        //      let ethTotalBorrow = res.returnData[10];
        //      let wbtcTotalBorrow = res.returnData[11];
        //      let usdcTotalBorrow = res.returnData[12];
        //      let usdtTotalBorrow = res.returnData[13];
        //      let daiTotalBorrow = res.returnData[14];

        //     // Utilization Rate

        //     let ethUtilization = parseFloat(ethTotalBorrow) /parseFloat(ethSupply) ;
        //     let wbtcUtilization = parseFloat(wbtcTotalBorrow)/ parseFloat(wbtcSupply);
        //     let usdcUtilization = parseFloat(usdcTotalBorrow)/parseFloat(usdcSupply);
        //     let usdtUtilization = parseFloat(usdtTotalBorrow)/parseFloat(usdtSupply);
        //     let daiUtilization = parseFloat(daiTotalBorrow)/parseFloat(daiSupply);

        //     // Your Balance
        //     const ethBal = formatUnits(res.returnData[15], 18);
        //     const wbtcBal = formatUnits(res.returnData[16], 18);
        //     const usdcBal = formatUnits(res.returnData[17], 18);
        //     const usdtBal = formatUnits(res.returnData[18], 18);
        //     const daiBal = formatUnits(res.returnData[19], 18);

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
        //     calldata1.push([arbAddressList.rateModelContractAddress, tempData1]);

        //     //BTC
        //     tempData1 = utils.arrayify(
        //                   iFaceRateModel.encodeFunctionData("getBorrowRatePerSecond",
        //                   [avaibaleBTC,wbtcTotalBorrow]
        //                   )
        //                 );
        //     calldata1.push([arbAddressList.rateModelContractAddress, tempData1]);

        //     //USDC
        //     tempData1 = utils.arrayify(
        //                 iFaceRateModel.encodeFunctionData("getBorrowRatePerSecond",
        //                 [avaibaleUSDC,usdcTotalBorrow]
        //               )
        //             );
        //     calldata1.push([arbAddressList.rateModelContractAddress, tempData1]);

        //     //USDT
        //     tempData1 = utils.arrayify(
        //                 iFaceRateModel.encodeFunctionData("getBorrowRatePerSecond",
        //                 [avaibaleUSDT,usdtTotalBorrow]
        //               )
        //             );
        //     calldata1.push([arbAddressList.rateModelContractAddress, tempData1]);

        //     //DAI
        //     tempData1 = utils.arrayify(
        //                   iFaceRateModel.encodeFunctionData("getBorrowRatePerSecond",
        //                   [avaibaleDai,daiTotalBorrow]
        //                 )
        //               );
        //     calldata1.push([arbAddressList.rateModelContractAddress, tempData1]);

        //     var res1 = await MCcontract.callStatic.aggregate(calldata1);

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
      } catch (error) {
        console.error(error);
      }
    } else if (currentNetwork.id === OPTIMISM_NETWORK) {
      try {
        if (account) {
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

            tempData = utils.arrayify(
              iFaceEth.encodeFunctionData("balanceOf", [
                opAddressList.vEtherContractAddress,
              ])
            );
            calldata.push([opAddressList.wethTokenAddress, tempData]);

            tempData = utils.arrayify(
              iFaceToken.encodeFunctionData("balanceOf", [
                opAddressList.vWBTCContractAddress,
              ])
            );
            calldata.push([opAddressList.wbtcTokenAddress, tempData]);

            tempData = utils.arrayify(
              iFaceToken.encodeFunctionData("balanceOf", [
                opAddressList.vUSDCContractAddress,
              ])
            );
            calldata.push([opAddressList.usdcTokenAddress, tempData]);

            tempData = utils.arrayify(
              iFaceToken.encodeFunctionData("balanceOf", [
                opAddressList.vUSDTContractAddress,
              ])
            );
            calldata.push([opAddressList.usdtTokenAddress, tempData]);

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

            tempData = utils.arrayify(
              iFaceToken.encodeFunctionData("convertToAssets", [
                parseUnits("1", 18),
              ])
            );
            calldata.push([opAddressList.vEtherContractAddress, tempData]);

            tempData = utils.arrayify(
              iFaceToken.encodeFunctionData("convertToAssets", [
                parseUnits("1", 18),
              ])
            );
            calldata.push([opAddressList.vWBTCContractAddress, tempData]);

            tempData = utils.arrayify(
              iFaceToken.encodeFunctionData("convertToAssets", [
                parseUnits("1", 18),
              ])
            );
            calldata.push([opAddressList.vUSDCContractAddress, tempData]);

            tempData = utils.arrayify(
              iFaceToken.encodeFunctionData("convertToAssets", [
                parseUnits("1", 18),
              ])
            );
            calldata.push([opAddressList.vUSDTContractAddress, tempData]);

            tempData = utils.arrayify(
              iFaceToken.encodeFunctionData("convertToAssets", [
                parseUnits("1", 18),
              ])
            );
            calldata.push([opAddressList.vDaiContractAddress, tempData]);

            const res = await MCcontract.callStatic.aggregate(calldata);

            //avaibaleAssetsInContract

            const avaibaleETH = check0xHex(res.returnData[0]);
            const avaibaleBTC = check0xHex(res.returnData[1]);
            const avaibaleUSDC = check0xHex(res.returnData[2]);
            const avaibaleUSDT = check0xHex(res.returnData[3]);
            const avaibaleDai = check0xHex(res.returnData[4]);

            // totalBorrow

            const ethTotalBorrow = check0xHex(res.returnData[5]);
            const wbtcTotalBorrow = check0xHex(res.returnData[6]);
            const usdcTotalBorrow = check0xHex(res.returnData[7]);
            const usdtTotalBorrow = check0xHex(res.returnData[8]);
            const daiTotalBorrow = check0xHex(res.returnData[9]);

            // Token to vTOken
            const ethToVeth = check0xHex(res.returnData[10]);
            const btcToVbtc = check0xHex(res.returnData[11]);
            const usdcToVusdc = check0xHex(res.returnData[12]);
            const usdtToVusdt = check0xHex(res.returnData[13]);
            const daiToVdai = check0xHex(res.returnData[14]);

            // utilazation rate
            // let ethUtilization = ethTotalBorrow/parseFloat(formatUnits(pool.supply));

            const val = await getPriceFromAssetsArray(pool.name);

            if (pool.name === "WETH") {
              const updatedPoolDetails = details.map((detail) => {
                if (detail.label === "SUPPLY APY") {
                  return {
                    ...detail,
                    value: pool.supplyAPY,
                  };
                }
                if (detail.label === "BORROW APY") {
                  return {
                    ...detail,
                    value: pool.borrowAPY,
                  };
                }
                if (detail.label === "VTOKEN RATE") {
                  return {
                    ...detail,
                    value: String(ceilWithPrecision(formatUnits(ethToVeth))),
                  };
                }
                if (detail.label === "TOTAL LIQUIDITY") {
                  return {
                    ...detail,
                    value: Number(pool.supply) * Number(ceilWithPrecision(formatUnits(ethToVeth))) + " " + pool.name,
                  };
                }
                if (detail.label === "LQ. IN DOLLAR") {
                  return {
                    ...detail,
                    value: formatUSD(Number(pool.supply) * Number(val)),
                  };
                }

                if (detail.label === "TOTAL BORROWED") {
                  return {
                    ...detail,
                    value: ceilWithPrecision(formatUnits(ethTotalBorrow), 4),
                  };
                }

                if (detail.label === "AVAILABLE LIQUIDITY") {
                  return {
                    ...detail,
                    value:
                      ceilWithPrecision(formatUnits(avaibaleETH), 4) +
                      " " +
                      pool.name,
                  };
                }
                if (detail.label === "UNIQUE USERS") {
                  return {
                    ...detail,
                    value: pool.supplyAPY,
                  };
                }
                if (detail.label === "WITHDRAWAL FEES") {
                  return {
                    ...detail,
                    value: "0.00 %",
                  };
                }
                return detail;
              });
              setPoolAddress(opAddressList.vEtherContractAddress);
              setDetails(updatedPoolDetails);
            }
            if (pool.name === "WBTC") {
              const updatedPoolDetails = details.map((detail) => {
                if (detail.label === "SUPPLY APY") {
                  return {
                    ...detail,
                    value: pool.supplyAPY,
                  };
                }
                if (detail.label === "BORROW APY") {
                  return {
                    ...detail,
                    value: pool.borrowAPY,
                  };
                }
                if (detail.label === "VTOKEN RATE") {
                  return {
                    ...detail,
                    value: String(ceilWithPrecision(formatUnits(btcToVbtc))),
                  };
                }
                if (detail.label === "TOTAL LIQUIDITY") {
                  return {
                    ...detail,
                    value: Number(pool.supply) * Number(ceilWithPrecision(formatUnits(btcToVbtc))) + " " + pool.name,
                  };
                }
                if (detail.label === "LQ. IN DOLLAR") {
                  return {
                    ...detail,
                    value: formatUSD(Number(pool.supply) * Number(val)),
                  };
                }

                if (detail.label === "TOTAL BORROWED") {
                  return {
                    ...detail,
                    value: ceilWithPrecision(formatUnits(wbtcTotalBorrow), 4),
                  };
                }

                if (detail.label === "AVAILABLE LIQUIDITY") {
                  return {
                    ...detail,
                    value:
                      ceilWithPrecision(formatUnits(avaibaleBTC), 4) +
                      " " +
                      pool.name,
                  };
                }
                if (detail.label === "UNIQUE USERS") {
                  return {
                    ...detail,
                    value: pool.supplyAPY,
                  };
                }
                if (detail.label === "WITHDRAWAL FEES") {
                  return {
                    ...detail,
                    value: "0.00 %",
                  };
                }
                return detail;
              });
              setPoolAddress(opAddressList.vWBTCContractAddress);
              setDetails(updatedPoolDetails);
            }
            if (pool.name === "USDC") {
              const updatedPoolDetails = details.map((detail) => {
                if (detail.label === "SUPPLY APY") {
                  return {
                    ...detail,
                    value: pool.supplyAPY,
                  };
                }
                if (detail.label === "BORROW APY") {
                  return {
                    ...detail,
                    value: pool.borrowAPY,
                  };
                }
                if (detail.label === "VTOKEN RATE") {
                  return {
                    ...detail,
                    value: String(ceilWithPrecision(formatUnits(usdcToVusdc))),
                  };
                }
                if (detail.label === "TOTAL LIQUIDITY") {
                  return {
                    ...detail,
                    value: Number(pool.supply) * Number(ceilWithPrecision(formatUnits(usdcToVusdc))) + " " + pool.name,
                  };
                }
                if (detail.label === "LQ. IN DOLLAR") {
                  return {
                    ...detail,
                    value: formatUSD(Number(pool.supply) * Number(val)),
                  };
                }

                if (detail.label === "TOTAL BORROWED") {
                  return {
                    ...detail,
                    value: ceilWithPrecision(formatUnits(usdcTotalBorrow)),
                  };
                }

                if (detail.label === "AVAILABLE LIQUIDITY") {
                  return {
                    ...detail,
                    value:
                      ceilWithPrecision(formatUnits(avaibaleUSDC, 6)) +
                      " " +
                      pool.name,
                  };
                }
                if (detail.label === "UNIQUE USERS") {
                  return {
                    ...detail,
                    value: pool.supplyAPY,
                  };
                }
                if (detail.label === "WITHDRAWAL FEES") {
                  return {
                    ...detail,
                    value: "0.00 %",
                  };
                }
                return detail;
              });
              setPoolAddress(opAddressList.vUSDCContractAddress);
              setDetails(updatedPoolDetails);
            }
            if (pool.name === "USDT") {
              const updatedPoolDetails = details.map((detail) => {
                if (detail.label === "SUPPLY APY") {
                  return {
                    ...detail,
                    value: pool.supplyAPY,
                  };
                }
                if (detail.label === "BORROW APY") {
                  return {
                    ...detail,
                    value: pool.borrowAPY,
                  };
                }
                if (detail.label === "VTOKEN RATE") {
                  return {
                    ...detail,
                    value: String(ceilWithPrecision(formatUnits(usdtToVusdt))),
                  };
                }
                if (detail.label === "TOTAL LIQUIDITY") {
                  return {
                    ...detail,
                    value: Number(pool.supply) * Number(ceilWithPrecision(formatUnits(usdcToVusdc))) + " " + pool.name,
                  };
                }
                if (detail.label === "LQ. IN DOLLAR") {
                  return {
                    ...detail,
                    value: formatUSD(Number(pool.supply) * Number(val)),
                  };
                }

                if (detail.label === "TOTAL BORROWED") {
                  return {
                    ...detail,
                    value: ceilWithPrecision(formatUnits(usdtTotalBorrow)),
                  };
                }

                if (detail.label === "AVAILABLE LIQUIDITY") {
                  return {
                    ...detail,
                    value:
                      ceilWithPrecision(formatUnits(avaibaleUSDT, 6)) +
                      " " +
                      pool.name,
                  };
                }
                if (detail.label === "UNIQUE USERS") {
                  return {
                    ...detail,
                    value: pool.supplyAPY,
                  };
                }
                if (detail.label === "WITHDRAWAL FEES") {
                  return {
                    ...detail,
                    value: "0.00 %",
                  };
                }
                return detail;
              });
              setPoolAddress(opAddressList.vUSDTContractAddress);
              setDetails(updatedPoolDetails);
            }
            if (pool.name === "DAI") {
              const updatedPoolDetails = details.map((detail) => {
                if (detail.label === "SUPPLY APY") {
                  return {
                    ...detail,
                    value: pool.supplyAPY,
                  };
                }
                if (detail.label === "BORROW APY") {
                  return {
                    ...detail,
                    value: pool.borrowAPY,
                  };
                }
                if (detail.label === "VTOKEN RATE") {
                  return {
                    ...detail,
                    value: String(ceilWithPrecision(formatUnits(daiToVdai))),
                  };
                }
                if (detail.label === "TOTAL LIQUIDITY") {
                  return {
                    ...detail,
                    value: Number(pool.supply) * Number(ceilWithPrecision(formatUnits(daiToVdai))) + " " + pool.name,
                  };
                }
                if (detail.label === "LQ. IN DOLLAR") {
                  return {
                    ...detail,
                    value: formatUSD(Number(pool.supply) * Number(val)),
                  };
                }

                if (detail.label === "TOTAL BORROWED") {
                  return {
                    ...detail,
                    value: ceilWithPrecision(formatUnits(daiTotalBorrow)),
                  };
                }

                if (detail.label === "AVAILABLE LIQUIDITY") {
                  return {
                    ...detail,
                    value:
                      ceilWithPrecision(formatUnits(avaibaleDai)) +
                      " " +
                      pool.name,
                  };
                }
                if (detail.label === "UNIQUE USERS") {
                  return {
                    ...detail,
                    value: pool.supplyAPY,
                  };
                }
                if (detail.label === "WITHDRAWAL FEES") {
                  return {
                    ...detail,
                    value: "0.00 %",
                  };
                }
                return detail;
              });
              setPoolAddress(opAddressList.vDaiContractAddress);
              setDetails(updatedPoolDetails);
            }
          };
          fetchValues();
        } else {
          setDetails(poolDetailsPlaceholder);
        }
        // if(work) {
        //     let iFaceEth = new utils.Interface(VEther.abi);
        //     let iFaceToken = new utils.Interface(VToken.abi);
        //     const MCcontract = new Contract(
        //       opAddressList.multicallAddress,
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
        //     calldata.push([opAddressList.vEtherContractAddress, tempData]);

        //     tempData = utils.arrayify(
        //                 iFaceEth.encodeFunctionData("balanceOf",
        //                   [opAddressList.vEtherContractAddress]
        //                 )
        //     )
        //     calldata.push([opAddressList.wethTokenAddress, tempData]);

        //     // WBTC

        //     tempData = utils.arrayify(
        //       iFaceToken.encodeFunctionData("totalSupply",
        //       [])
        //     );

        //     calldata.push([opAddressList.vWBTCContractAddress, tempData]);
        //     tempData = utils.arrayify(
        //                 iFaceToken.encodeFunctionData("balanceOf",
        //                   [opAddressList.vWBTCContractAddress]
        //                 )
        //     )
        //     calldata.push([opAddressList.wbtcTokenAddress, tempData]);

        //     // USDC
        //     tempData = utils.arrayify(
        //                 iFaceToken.encodeFunctionData("totalSupply",
        //                 [])
        //               );
        //     calldata.push([opAddressList.vUSDCContractAddress, tempData]);

        //     tempData = utils.arrayify(
        //                 iFaceToken.encodeFunctionData("balanceOf",
        //                   [opAddressList.vUSDCContractAddress]
        //                 )
        //     )
        //     calldata.push([opAddressList.usdcTokenAddress, tempData]);

        //     // USDT
        //     tempData = utils.arrayify(
        //                 iFaceToken.encodeFunctionData("totalSupply",
        //                 [])
        //               );
        //     calldata.push([opAddressList.vUSDTContractAddress, tempData]);

        //     tempData = utils.arrayify(
        //                 iFaceToken.encodeFunctionData("balanceOf",
        //                   [opAddressList.vUSDTContractAddress]
        //                 )
        //     )
        //     calldata.push([opAddressList.usdtTokenAddress, tempData]);

        //     // DAI
        //     tempData = utils.arrayify(
        //                 iFaceToken.encodeFunctionData("totalSupply",
        //                 [])
        //               );
        //     calldata.push([opAddressList.vDaiContractAddress, tempData]);

        //     tempData = utils.arrayify(
        //                 iFaceToken.encodeFunctionData("balanceOf",
        //                   [opAddressList.vDaiContractAddress]
        //                 )
        //     )
        //     calldata.push([opAddressList.daiTokenAddress, tempData]);

        //     // totalBorrow
        //     //ETH
        //     tempData = utils.arrayify(
        //       iFaceEth.encodeFunctionData("getBorrows",
        //         []
        //       )
        //     )
        //     calldata.push([opAddressList.vEtherContractAddress, tempData]);

        //     //WBTC
        //     tempData = utils.arrayify(
        //                 iFaceToken.encodeFunctionData("getBorrows",
        //                   []
        //                 )
        //     )
        //     calldata.push([opAddressList.vWBTCContractAddress, tempData]);

        //     //USDC
        //     tempData = utils.arrayify(
        //                 iFaceToken.encodeFunctionData("getBorrows",
        //                   []
        //                 )
        //     )
        //     calldata.push([opAddressList.vUSDCContractAddress, tempData]);

        //     //USDT
        //     tempData = utils.arrayify(
        //                 iFaceToken.encodeFunctionData("getBorrows",
        //                   []
        //                 )
        //     )
        //     calldata.push([opAddressList.vUSDTContractAddress, tempData]);

        //     //DAI
        //     tempData = utils.arrayify(
        //                 iFaceToken.encodeFunctionData("getBorrows",
        //                   []
        //                 )
        //     )
        //     calldata.push([opAddressList.vDaiContractAddress, tempData]);

        //     //User assets balance

        //     //ETH
        //     tempData = utils.arrayify(
        //                 iFaceEth.encodeFunctionData("balanceOf",
        //                   [account]
        //                 )
        //     )
        //     calldata.push([opAddressList.vEtherContractAddress, tempData]);

        //     //WBTC
        //     tempData = utils.arrayify(
        //                 iFaceToken.encodeFunctionData("balanceOf",
        //                   [account]
        //                 )
        //     )
        //     calldata.push([opAddressList.vWBTCContractAddress, tempData]);

        //     //USDC
        //     tempData = utils.arrayify(
        //                 iFaceToken.encodeFunctionData("balanceOf",
        //                   [account]
        //                 )
        //     )
        //     calldata.push([opAddressList.vUSDCContractAddress, tempData]);

        //     //USDT
        //     tempData = utils.arrayify(
        //                 iFaceToken.encodeFunctionData("balanceOf",
        //                   [account]
        //                 )
        //     )
        //     calldata.push([opAddressList.vUSDTContractAddress, tempData]);

        //     //DAI
        //     tempData = utils.arrayify(
        //                 iFaceToken.encodeFunctionData("balanceOf",
        //                   [account]
        //                 )
        //     )
        //     calldata.push([opAddressList.vDaiContractAddress, tempData]);

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

        //      // totalBorrow

        //      let ethTotalBorrow = res.returnData[10];
        //      let wbtcTotalBorrow = res.returnData[11];
        //      let usdcTotalBorrow = res.returnData[12];
        //      let usdtTotalBorrow = res.returnData[13];
        //      let daiTotalBorrow = res.returnData[14];

        //     // Utilization Rate

        //     let ethUtilization = parseFloat(ethTotalBorrow) /parseFloat(ethSupply) ;
        //     let wbtcUtilization = parseFloat(wbtcTotalBorrow)/ parseFloat(wbtcSupply);
        //     let usdcUtilization = parseFloat(usdcTotalBorrow)/parseFloat(usdcSupply);
        //     let usdtUtilization = parseFloat(usdtTotalBorrow)/parseFloat(usdtSupply);
        //     let daiUtilization = parseFloat(daiTotalBorrow)/parseFloat(daiSupply);

        //     // Your Balance
        //     const ethBal = formatUnits(res.returnData[15], 18);
        //     const wbtcBal = formatUnits(res.returnData[16], 18);
        //     const usdcBal = formatUnits(res.returnData[17], 18);
        //     const usdtBal = formatUnits(res.returnData[18], 18);
        //     const daiBal = formatUnits(res.returnData[19], 18);

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
        //     calldata1.push([opAddressList.rateModelContractAddress, tempData1]);

        //     //BTC
        //     tempData1 = utils.arrayify(
        //                   iFaceRateModel.encodeFunctionData("getBorrowRatePerSecond",
        //                   [avaibaleBTC,wbtcTotalBorrow]
        //                   )
        //                 );
        //     calldata1.push([opAddressList.rateModelContractAddress, tempData1]);

        //     //USDC
        //     tempData1 = utils.arrayify(
        //                 iFaceRateModel.encodeFunctionData("getBorrowRatePerSecond",
        //                 [avaibaleUSDC,usdcTotalBorrow]
        //               )
        //             );
        //     calldata1.push([opAddressList.rateModelContractAddress, tempData1]);

        //     //USDT
        //     tempData1 = utils.arrayify(
        //                 iFaceRateModel.encodeFunctionData("getBorrowRatePerSecond",
        //                 [avaibaleUSDT,usdtTotalBorrow]
        //               )
        //             );
        //     calldata1.push([opAddressList.rateModelContractAddress, tempData1]);

        //     //DAI
        //     tempData1 = utils.arrayify(
        //                   iFaceRateModel.encodeFunctionData("getBorrowRatePerSecond",
        //                   [avaibaleDai,daiTotalBorrow]
        //                 )
        //               );
        //     calldata1.push([opAddressList.rateModelContractAddress, tempData1]);

        //     var res1 = await MCcontract.callStatic.aggregate(calldata1);

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
      } catch (error) {
        console.error(error);
      }
    }
    // else if (currentNetwork.id === BASE_NETWORK) {
    //   try {
    //     if (account) {
    //       const fetchValues = async () => {
    //         const iFaceEth = new utils.Interface(VEther.abi);
    //         const iFaceToken = new utils.Interface(VToken.abi);

    //         const MCcontract = new Contract(
    //           baseAddressList.multicallAddress,
    //           Multicall.abi,
    //           library
    //         );

    //         const calldata = [];
    //         let tempData;

    //         tempData = utils.arrayify(
    //           iFaceEth.encodeFunctionData("balanceOf", [
    //             baseAddressList.vEtherContractAddress,
    //           ])
    //         );
    //         calldata.push([baseAddressList.wethTokenAddress, tempData]);

    //         tempData = utils.arrayify(
    //           iFaceToken.encodeFunctionData("balanceOf", [
    //             baseAddressList.vWBTCContractAddress,
    //           ])
    //         );
    //         calldata.push([baseAddressList.wbtcTokenAddress, tempData]);

    //         tempData = utils.arrayify(
    //           iFaceToken.encodeFunctionData("balanceOf", [
    //             baseAddressList.vUSDCContractAddress,
    //           ])
    //         );
    //         calldata.push([baseAddressList.usdcTokenAddress, tempData]);

    //         tempData = utils.arrayify(
    //           iFaceToken.encodeFunctionData("balanceOf", [
    //             baseAddressList.vUSDTContractAddress,
    //           ])
    //         );
    //         calldata.push([baseAddressList.usdtTokenAddress, tempData]);

    //         tempData = utils.arrayify(
    //           iFaceToken.encodeFunctionData("balanceOf", [
    //             baseAddressList.vDaiContractAddress,
    //           ])
    //         );
    //         calldata.push([baseAddressList.daiTokenAddress, tempData]);

    //         // totalBorrow
    //         //ETH
    //         tempData = utils.arrayify(
    //           iFaceEth.encodeFunctionData("getBorrows", [])
    //         );
    //         calldata.push([baseAddressList.vEtherContractAddress, tempData]);

    //         //WBTC
    //         tempData = utils.arrayify(
    //           iFaceToken.encodeFunctionData("getBorrows", [])
    //         );
    //         calldata.push([baseAddressList.vWBTCContractAddress, tempData]);

    //         //USDC
    //         tempData = utils.arrayify(
    //           iFaceToken.encodeFunctionData("getBorrows", [])
    //         );
    //         calldata.push([baseAddressList.vUSDCContractAddress, tempData]);

    //         //USDT
    //         tempData = utils.arrayify(
    //           iFaceToken.encodeFunctionData("getBorrows", [])
    //         );
    //         calldata.push([baseAddressList.vUSDTContractAddress, tempData]);

    //         //DAI
    //         tempData = utils.arrayify(
    //           iFaceToken.encodeFunctionData("getBorrows", [])
    //         );
    //         calldata.push([baseAddressList.vDaiContractAddress, tempData]);

    //         tempData = utils.arrayify(
    //           iFaceToken.encodeFunctionData("convertToAssets", [
    //             parseUnits("1", 18),
    //           ])
    //         );
    //         calldata.push([baseAddressList.vEtherContractAddress, tempData]);

    //         tempData = utils.arrayify(
    //           iFaceToken.encodeFunctionData("convertToAssets", [
    //             parseUnits("1", 18),
    //           ])
    //         );
    //         calldata.push([baseAddressList.vWBTCContractAddress, tempData]);

    //         tempData = utils.arrayify(
    //           iFaceToken.encodeFunctionData("convertToAssets", [
    //             parseUnits("1", 18),
    //           ])
    //         );
    //         calldata.push([baseAddressList.vUSDCContractAddress, tempData]);

    //         tempData = utils.arrayify(
    //           iFaceToken.encodeFunctionData("convertToAssets", [
    //             parseUnits("1", 18),
    //           ])
    //         );
    //         calldata.push([baseAddressList.vUSDTContractAddress, tempData]);

    //         tempData = utils.arrayify(
    //           iFaceToken.encodeFunctionData("convertToAssets", [
    //             parseUnits("1", 18),
    //           ])
    //         );
    //         calldata.push([baseAddressList.vDaiContractAddress, tempData]);

    //         var res = await MCcontract.callStatic.aggregate(calldata);

    //         //avaibaleAssetsInContract

    //         const avaibaleETH = check0xHex(res.returnData[0]);
    //         const avaibaleBTC = check0xHex(res.returnData[1]);
    //         const avaibaleUSDC = check0xHex(res.returnData[2]);
    //         const avaibaleUSDT = check0xHex(res.returnData[3]);
    //         const avaibaleDai = check0xHex(res.returnData[4]);

    //         // totalBorrow

    //         const ethTotalBorrow = check0xHex(res.returnData[5]);
    //         const wbtcTotalBorrow = check0xHex(res.returnData[6]);
    //         const usdcTotalBorrow = check0xHex(res.returnData[7]);
    //         const usdtTotalBorrow = check0xHex(res.returnData[8]);
    //         const daiTotalBorrow = check0xHex(res.returnData[9]);

    //         // Token to vTOken
    //         const ethToVeth = check0xHex(res.returnData[10]);
    //         const btcToVbtc = check0xHex(res.returnData[11]);
    //         const usdcToVusdc = check0xHex(res.returnData[12]);
    //         const usdtToVusdt = check0xHex(res.returnData[13]);
    //         const daiToVdai = check0xHex(res.returnData[14]);

    //         // utilazation rate
    //         // let ethUtilization = ethTotalBorrow/parseFloat(formatUnits(pool.supply));

    //         const val = await getPriceFromAssetsArray(pool.name);

    //         if (pool.name === "WETH") {
    //           const updatedPoolDetails = details.map((detail) => {
    //             if (detail.label === "SUPPLY APY") {
    //               return {
    //                 ...detail,
    //                 value: pool.supplyAPY,
    //               };
    //             }
    //             if (detail.label === "BORROW APY") {
    //               return {
    //                 ...detail,
    //                 value: pool.borrowAPY,
    //               };
    //             }
    //             if (detail.label === "VTOKEN RATE") {
    //               return {
    //                 ...detail,
    //                 value: String(ceilWithPrecision(formatUnits(ethToVeth))),
    //               };
    //             }
    //             if (detail.label === "TOTAL LIQUIDITY") {
    //               return {
    //                 ...detail,
    //                 value: Number(pool.supply) * Number(ceilWithPrecision(formatUnits(ethToVeth))) + " " + pool.name,
    //               };
    //             }
    //             if (detail.label === "LIQUIDITY IN DOLLAR") {
    //               return {
    //                 ...detail,
    //                 value: formatUSD(Number(pool.supply) * Number(val)),
    //               };
    //             }

    //             if (detail.label === "TOTAL BORROWED") {
    //               return {
    //                 ...detail,
    //                 value: ceilWithPrecision(formatUnits(ethTotalBorrow)),
    //               };
    //             }

    //             if (detail.label === "AVAILABLE LIQUIDITY") {
    //               return {
    //                 ...detail,
    //                 value:
    //                   ceilWithPrecision(formatUnits(avaibaleETH)) +
    //                   " " +
    //                   pool.name,
    //               };
    //             }
    //             if (detail.label === "UNIQUE USERS") {
    //               return {
    //                 ...detail,
    //                 value: pool.supplyAPY,
    //               };
    //             }
    //             if (detail.label === "WITHDRAWAL FEES") {
    //               return {
    //                 ...detail,
    //                 value: "0.00 %",
    //               };
    //             }
    //             return detail;
    //           });
    //           setDetails(updatedPoolDetails);
    //           setPoolAddress(baseAddressList.vEtherContractAddress);
    //         }
    //         if (pool.name === "WBTC") {
    //           const updatedPoolDetails = details.map((detail) => {
    //             if (detail.label === "SUPPLY APY") {
    //               return {
    //                 ...detail,
    //                 value: pool.supplyAPY,
    //               };
    //             }
    //             if (detail.label === "BORROW APY") {
    //               return {
    //                 ...detail,
    //                 value: pool.borrowAPY,
    //               };
    //             }
    //             if (detail.label === "VTOKEN RATE") {
    //               return {
    //                 ...detail,
    //                 value: String(ceilWithPrecision(formatUnits(btcToVbtc))),
    //               };
    //             }
    //             if (detail.label === "TOTAL LIQUIDITY") {
    //               return {
    //                 ...detail,
    //                 value: Number(pool.supply) * Number(ceilWithPrecision(formatUnits(ethToVeth)))+ " " + pool.name,
    //               };
    //             }
    //             if (detail.label === "LIQUIDITY IN DOLLAR") {
    //               return {
    //                 ...detail,
    //                 value: formatUSD(Number(pool.supply) * Number(val)),
    //               };
    //             }

    //             if (detail.label === "TOTAL BORROWED") {
    //               return {
    //                 ...detail,
    //                 value: ceilWithPrecision(formatUnits(wbtcTotalBorrow)),
    //               };
    //             }

    //             if (detail.label === "AVAILABLE LIQUIDITY") {
    //               return {
    //                 ...detail,
    //                 value:
    //                   ceilWithPrecision(formatUnits(avaibaleBTC)) +
    //                   " " +
    //                   pool.name,
    //               };
    //             }
    //             if (detail.label === "UNIQUE USERS") {
    //               return {
    //                 ...detail,
    //                 value: pool.supplyAPY,
    //               };
    //             }
    //             if (detail.label === "WITHDRAWAL FEES") {
    //               return {
    //                 ...detail,
    //                 value: "0.00 %",
    //               };
    //             }
    //             return detail;
    //           });
    //           setDetails(updatedPoolDetails);
    //           setPoolAddress(baseAddressList.vWBTCContractAddress);
    //         }
    //         if (pool.name === "USDC") {
    //           const updatedPoolDetails = details.map((detail) => {
    //             if (detail.label === "SUPPLY APY") {
    //               return {
    //                 ...detail,
    //                 value: pool.supplyAPY,
    //               };
    //             }
    //             if (detail.label === "BORROW APY") {
    //               return {
    //                 ...detail,
    //                 value: pool.borrowAPY,
    //               };
    //             }
    //             if (detail.label === "VTOKEN RATE") {
    //               return {
    //                 ...detail,
    //                 value: String(ceilWithPrecision(formatUnits(usdcToVusdc))),
    //               };
    //             }
    //             if (detail.label === "TOTAL LIQUIDITY") {
    //               return {
    //                 ...detail,
    //                 value: Number(pool.supply) * Number(ceilWithPrecision(formatUnits(ethToVeth))) + " " + pool.name,
    //               };
    //             }
    //             if (detail.label === "LIQUIDITY IN DOLLAR") {
    //               return {
    //                 ...detail,
    //                 value: formatUSD(Number(pool.supply) * Number(val)),
    //               };
    //             }

    //             if (detail.label === "TOTAL BORROWED") {
    //               return {
    //                 ...detail,
    //                 value: ceilWithPrecision(formatUnits(usdcTotalBorrow)),
    //               };
    //             }

    //             if (detail.label === "AVAILABLE LIQUIDITY") {
    //               return {
    //                 ...detail,
    //                 value:
    //                   ceilWithPrecision(formatUnits(avaibaleUSDC)) +
    //                   " " +
    //                   pool.name,
    //               };
    //             }
    //             if (detail.label === "UNIQUE USERS") {
    //               return {
    //                 ...detail,
    //                 value: pool.supplyAPY,
    //               };
    //             }
    //             if (detail.label === "WITHDRAWAL FEES") {
    //               return {
    //                 ...detail,
    //                 value: "0.00 %",
    //               };
    //             }
    //             return detail;
    //           });
    //           setDetails(updatedPoolDetails);
    //           setPoolAddress(baseAddressList.vUSDCContractAddress);
    //         }
    //         if (pool.name === "USDT") {
    //           const updatedPoolDetails = details.map((detail) => {
    //             if (detail.label === "SUPPLY APY") {
    //               return {
    //                 ...detail,
    //                 value: pool.supplyAPY,
    //               };
    //             }
    //             if (detail.label === "BORROW APY") {
    //               return {
    //                 ...detail,
    //                 value: pool.borrowAPY,
    //               };
    //             }
    //             if (detail.label === "VTOKEN RATE") {
    //               return {
    //                 ...detail,
    //                 value: String(ceilWithPrecision(formatUnits(usdtToVusdt))),
    //               };
    //             }
    //             if (detail.label === "TOTAL LIQUIDITY") {
    //               return {
    //                 ...detail,
    //                 value: Number(pool.supply) * Number(ceilWithPrecision(formatUnits(ethToVeth))) + " " + pool.name,
    //               };
    //             }
    //             if (detail.label === "LIQUIDITY IN DOLLAR") {
    //               return {
    //                 ...detail,
    //                 value: formatUSD(Number(pool.supply) * Number(val)),
    //               };
    //             }

    //             if (detail.label === "TOTAL BORROWED") {
    //               return {
    //                 ...detail,
    //                 value: ceilWithPrecision(formatUnits(usdtTotalBorrow)),
    //               };
    //             }

    //             if (detail.label === "AVAILABLE LIQUIDITY") {
    //               return {
    //                 ...detail,
    //                 value:
    //                   ceilWithPrecision(formatUnits(avaibaleUSDT)) +
    //                   " " +
    //                   pool.name,
    //               };
    //             }
    //             if (detail.label === "UNIQUE USERS") {
    //               return {
    //                 ...detail,
    //                 value: pool.supplyAPY,
    //               };
    //             }
    //             if (detail.label === "WITHDRAWAL FEES") {
    //               return {
    //                 ...detail,
    //                 value: "0.00 %",
    //               };
    //             }
    //             return detail;
    //           });
    //           setDetails(updatedPoolDetails);
    //           setPoolAddress(baseAddressList.vUSDTContractAddress);
    //         }
    //         if (pool.name === "DAI") {
    //           const updatedPoolDetails = details.map((detail) => {
    //             if (detail.label === "SUPPLY APY") {
    //               return {
    //                 ...detail,
    //                 value: pool.supplyAPY,
    //               };
    //             }
    //             if (detail.label === "BORROW APY") {
    //               return {
    //                 ...detail,
    //                 value: pool.borrowAPY,
    //               };
    //             }
    //             if (detail.label === "VTOKEN RATE") {
    //               return {
    //                 ...detail,
    //                 value: String(ceilWithPrecision(formatUnits(daiToVdai))),
    //               };
    //             }
    //             if (detail.label === "TOTAL LIQUIDITY") {
    //               return {
    //                 ...detail,
    //                 value: Number(pool.supply) * Number(ceilWithPrecision(formatUnits(ethToVeth))) + " " + pool.name,
    //               };
    //             }
    //             if (detail.label === "LIQUIDITY IN DOLLAR") {
    //               return {
    //                 ...detail,
    //                 value: formatUSD(Number(pool.supply) * Number(val)),
    //               };
    //             }

    //             if (detail.label === "TOTAL BORROWED") {
    //               return {
    //                 ...detail,
    //                 value: ceilWithPrecision(formatUnits(daiTotalBorrow)),
    //               };
    //             }

    //             if (detail.label === "AVAILABLE LIQUIDITY") {
    //               return {
    //                 ...detail,
    //                 value:
    //                   ceilWithPrecision(formatUnits(avaibaleDai)) +
    //                   " " +
    //                   pool.name,
    //               };
    //             }
    //             if (detail.label === "UNIQUE USERS") {
    //               return {
    //                 ...detail,
    //                 value: pool.supplyAPY,
    //               };
    //             }
    //             if (detail.label === "WITHDRAWAL FEES") {
    //               return {
    //                 ...detail,
    //                 value: "0.00 %",
    //               };
    //             }
    //             return detail;
    //           });
    //           setDetails(updatedPoolDetails);
    //           setPoolAddress(baseAddressList.vDaiContractAddress);
    //         }
    //       };
    //       fetchValues();
    //     } else {
    //       setDetails(poolDetailsPlaceholder);
    //     }
    //     // if(work) {
    //     //     let iFaceEth = new utils.Interface(VEther.abi);
    //     //     let iFaceToken = new utils.Interface(VToken.abi);
    //     //     const MCcontract = new Contract(
    //     //       baseAddressList.multicallAddress,
    //     //       Multicall.abi,
    //     //       library
    //     //     );
    //     //     let calldata = [];
    //     //     let tempData;
    //     //     // ETH
    //     //     tempData = utils.arrayify(
    //     //       iFaceEth.encodeFunctionData("totalSupply",
    //     //       [])
    //     //     );
    //     //     calldata.push([baseAddressList.vEtherContractAddress, tempData]);

    //     //     tempData = utils.arrayify(
    //     //                 iFaceEth.encodeFunctionData("balanceOf",
    //     //                   [baseAddressList.vEtherContractAddress]
    //     //                 )
    //     //     )
    //     //     calldata.push([baseAddressList.wethTokenAddress, tempData]);

    //     //     // WBTC

    //     //     tempData = utils.arrayify(
    //     //       iFaceToken.encodeFunctionData("totalSupply",
    //     //       [])
    //     //     );

    //     //     calldata.push([baseAddressList.vWBTCContractAddress, tempData]);
    //     //     tempData = utils.arrayify(
    //     //                 iFaceToken.encodeFunctionData("balanceOf",
    //     //                   [baseAddressList.vWBTCContractAddress]
    //     //                 )
    //     //     )
    //     //     calldata.push([baseAddressList.wbtcTokenAddress, tempData]);

    //     //     // USDC
    //     //     tempData = utils.arrayify(
    //     //                 iFaceToken.encodeFunctionData("totalSupply",
    //     //                 [])
    //     //               );
    //     //     calldata.push([baseAddressList.vUSDCContractAddress, tempData]);

    //     //     tempData = utils.arrayify(
    //     //                 iFaceToken.encodeFunctionData("balanceOf",
    //     //                   [baseAddressList.vUSDCContractAddress]
    //     //                 )
    //     //     )
    //     //     calldata.push([baseAddressList.usdcTokenAddress, tempData]);

    //     //     // USDT
    //     //     tempData = utils.arrayify(
    //     //                 iFaceToken.encodeFunctionData("totalSupply",
    //     //                 [])
    //     //               );
    //     //     calldata.push([baseAddressList.vUSDTContractAddress, tempData]);

    //     //     tempData = utils.arrayify(
    //     //                 iFaceToken.encodeFunctionData("balanceOf",
    //     //                   [baseAddressList.vUSDTContractAddress]
    //     //                 )
    //     //     )
    //     //     calldata.push([baseAddressList.usdtTokenAddress, tempData]);

    //     //     // DAI
    //     //     tempData = utils.arrayify(
    //     //                 iFaceToken.encodeFunctionData("totalSupply",
    //     //                 [])
    //     //               );
    //     //     calldata.push([baseAddressList.vDaiContractAddress, tempData]);

    //     //     tempData = utils.arrayify(
    //     //                 iFaceToken.encodeFunctionData("balanceOf",
    //     //                   [baseAddressList.vDaiContractAddress]
    //     //                 )
    //     //     )
    //     //     calldata.push([baseAddressList.daiTokenAddress, tempData]);

    //     //     // totalBorrow
    //     //     //ETH
    //     //     tempData = utils.arrayify(
    //     //       iFaceEth.encodeFunctionData("getBorrows",
    //     //         []
    //     //       )
    //     //     )
    //     //     calldata.push([baseAddressList.vEtherContractAddress, tempData]);

    //     //     //WBTC
    //     //     tempData = utils.arrayify(
    //     //                 iFaceToken.encodeFunctionData("getBorrows",
    //     //                   []
    //     //                 )
    //     //     )
    //     //     calldata.push([baseAddressList.vWBTCContractAddress, tempData]);

    //     //     //USDC
    //     //     tempData = utils.arrayify(
    //     //                 iFaceToken.encodeFunctionData("getBorrows",
    //     //                   []
    //     //                 )
    //     //     )
    //     //     calldata.push([baseAddressList.vUSDCContractAddress, tempData]);

    //     //     //USDT
    //     //     tempData = utils.arrayify(
    //     //                 iFaceToken.encodeFunctionData("getBorrows",
    //     //                   []
    //     //                 )
    //     //     )
    //     //     calldata.push([baseAddressList.vUSDTContractAddress, tempData]);

    //     //     //DAI
    //     //     tempData = utils.arrayify(
    //     //                 iFaceToken.encodeFunctionData("getBorrows",
    //     //                   []
    //     //                 )
    //     //     )
    //     //     calldata.push([baseAddressList.vDaiContractAddress, tempData]);

    //     //     //User assets balance

    //     //     //ETH
    //     //     tempData = utils.arrayify(
    //     //                 iFaceEth.encodeFunctionData("balanceOf",
    //     //                   [account]
    //     //                 )
    //     //     )
    //     //     calldata.push([baseAddressList.vEtherContractAddress, tempData]);

    //     //     //WBTC
    //     //     tempData = utils.arrayify(
    //     //                 iFaceToken.encodeFunctionData("balanceOf",
    //     //                   [account]
    //     //                 )
    //     //     )
    //     //     calldata.push([baseAddressList.vWBTCContractAddress, tempData]);

    //     //     //USDC
    //     //     tempData = utils.arrayify(
    //     //                 iFaceToken.encodeFunctionData("balanceOf",
    //     //                   [account]
    //     //                 )
    //     //     )
    //     //     calldata.push([baseAddressList.vUSDCContractAddress, tempData]);

    //     //     //USDT
    //     //     tempData = utils.arrayify(
    //     //                 iFaceToken.encodeFunctionData("balanceOf",
    //     //                   [account]
    //     //                 )
    //     //     )
    //     //     calldata.push([baseAddressList.vUSDTContractAddress, tempData]);

    //     //     //DAI
    //     //     tempData = utils.arrayify(
    //     //                 iFaceToken.encodeFunctionData("balanceOf",
    //     //                   [account]
    //     //                 )
    //     //     )
    //     //     calldata.push([baseAddressList.vDaiContractAddress, tempData]);

    //     //     var res = await MCcontract.callStatic.aggregate(calldata);

    //     //     // assigne value
    //     //     //supply

    //     //     let ethSupply = formatUnits(res.returnData[0]);
    //     //     let wbtcSupply = formatUnits(res.returnData[1]);
    //     //     let usdcSupply = formatUnits(res.returnData[2],6);
    //     //     let usdtSupply = formatUnits(res.returnData[3],6);
    //     //     let daiSupply = formatUnits(res.returnData[4]);

    //     //     //avaibaleAssetsInContract

    //     //     let avaibaleETH = res.returnData[1];
    //     //     let avaibaleBTC = res.returnData[3];
    //     //     let avaibaleUSDC = res.returnData[5];
    //     //     let avaibaleUSDT = res.returnData[7];
    //     //     let avaibaleDai = res.returnData[9];

    //     //      // totalBorrow

    //     //      let ethTotalBorrow = res.returnData[10];
    //     //      let wbtcTotalBorrow = res.returnData[11];
    //     //      let usdcTotalBorrow = res.returnData[12];
    //     //      let usdtTotalBorrow = res.returnData[13];
    //     //      let daiTotalBorrow = res.returnData[14];

    //     //     // Utilization Rate

    //     //     let ethUtilization = parseFloat(ethTotalBorrow) /parseFloat(ethSupply) ;
    //     //     let wbtcUtilization = parseFloat(wbtcTotalBorrow)/ parseFloat(wbtcSupply);
    //     //     let usdcUtilization = parseFloat(usdcTotalBorrow)/parseFloat(usdcSupply);
    //     //     let usdtUtilization = parseFloat(usdtTotalBorrow)/parseFloat(usdtSupply);
    //     //     let daiUtilization = parseFloat(daiTotalBorrow)/parseFloat(daiSupply);

    //     //     // Your Balance
    //     //     const ethBal = formatUnits(res.returnData[15], 18);
    //     //     const wbtcBal = formatUnits(res.returnData[16], 18);
    //     //     const usdcBal = formatUnits(res.returnData[17], 18);
    //     //     const usdtBal = formatUnits(res.returnData[18], 18);
    //     //     const daiBal = formatUnits(res.returnData[19], 18);

    //     //     // Dependent varibale data fetching
    //     //     let calldata1 = [];
    //     //     let tempData1;
    //     //     let iFaceRateModel = new utils.Interface(DefaultRateModel.abi);

    //     //     //BorrowAPY
    //     //     //ETH
    //     //     tempData1 = utils.arrayify(
    //     //                   iFaceRateModel.encodeFunctionData("getBorrowRatePerSecond",
    //     //                   [avaibaleETH,ethTotalBorrow]
    //     //                 )
    //     //               );
    //     //     calldata1.push([baseAddressList.rateModelContractAddress, tempData1]);

    //     //     //BTC
    //     //     tempData1 = utils.arrayify(
    //     //                   iFaceRateModel.encodeFunctionData("getBorrowRatePerSecond",
    //     //                   [avaibaleBTC,wbtcTotalBorrow]
    //     //                   )
    //     //                 );
    //     //     calldata1.push([baseAddressList.rateModelContractAddress, tempData1]);

    //     //     //USDC
    //     //     tempData1 = utils.arrayify(
    //     //                 iFaceRateModel.encodeFunctionData("getBorrowRatePerSecond",
    //     //                 [avaibaleUSDC,usdcTotalBorrow]
    //     //               )
    //     //             );
    //     //     calldata1.push([baseAddressList.rateModelContractAddress, tempData1]);

    //     //     //USDT
    //     //     tempData1 = utils.arrayify(
    //     //                 iFaceRateModel.encodeFunctionData("getBorrowRatePerSecond",
    //     //                 [avaibaleUSDT,usdtTotalBorrow]
    //     //               )
    //     //             );
    //     //     calldata1.push([baseAddressList.rateModelContractAddress, tempData1]);

    //     //     //DAI
    //     //     tempData1 = utils.arrayify(
    //     //                   iFaceRateModel.encodeFunctionData("getBorrowRatePerSecond",
    //     //                   [avaibaleDai,daiTotalBorrow]
    //     //                 )
    //     //               );
    //     //     calldata1.push([baseAddressList.rateModelContractAddress, tempData1]);

    //     //     var res1 = await MCcontract.callStatic.aggregate(calldata1);

    //     //     const ethBorrowAPY = res1.returnData[0];
    //     //     const ethBorrowApy = ethTotalBorrow != 0 ? parseFloat(formatUnits(ethBorrowAPY)) * SECS_PER_YEAR * 1e3 : 0;
    //     //     const ethSupplyApy = ethBorrowApy - ethBorrowApy * FEES;
    //     //     // const ethSupplyApy7D = (ethSupplyApy / 52);

    //     //     const btcBorrowAPY = res1.returnData[1];
    //     //     const wbtcBorrowApy =wbtcTotalBorrow != 0 ? parseFloat(formatUnits(btcBorrowAPY)) * SECS_PER_YEAR *1e3 : 0;
    //     //     const wbtcSupplyApy = wbtcBorrowApy - wbtcBorrowApy * FEES;

    //     //     const usdcBorrowAPY = res1.returnData[2];
    //     //     const usdcBorrowApy = usdcTotalBorrow != 0 ? parseFloat(formatUnits(usdcBorrowAPY))* SECS_PER_YEAR *1e3 : 0;
    //     //     const usdcSupplyApy = usdcBorrowApy - usdcBorrowApy * FEES;

    //     //     const usdtBorrowAPY = res1.returnData[3];
    //     //     const usdtBorrowApy = usdtTotalBorrow != 0 ? parseFloat(formatUnits(usdtBorrowAPY)) * SECS_PER_YEAR *1e3 : 0;
    //     //     const usdtSupplyApy = usdtBorrowAPY - usdtBorrowApy * FEES;

    //     //     const daiBorrowAPY = res1.returnData[4];
    //     //     const daiBorrowApy = daiTotalBorrow != 0 ? parseFloat(formatUnits(daiBorrowAPY)) * SECS_PER_YEAR *1e3 : 0;
    //     //     const daiSupplyApy = daiBorrowApy - daiBorrowApy * FEES;

    //     //     const availableETHLiq = parseFloat(formatUnits(ethSupply)) - parseFloat(formatUnits(ethTotalBorrow));
    //     //     const availableWBTCLiq = parseFloat(formatUnits(wbtcSupply)) - parseFloat(formatUnits(wbtcTotalBorrow));
    //     //     const availableUSDCLiq = parseFloat(formatUnits(usdcSupply)) - parseFloat(formatUnits(usdcTotalBorrow));
    //     //     const availableUSDTLiq = parseFloat(formatUnits(usdtSupply)) - parseFloat(formatUnits(usdtTotalBorrow));
    //     //     const availableDAILiq = parseFloat(formatUnits(daiSupply)) - parseFloat(formatUnits(daiTotalBorrow));

    //     //   }
    //   } catch (error) {
    //     console.error(error);
    //   }
    // }
  }, [account, pool, currentNetwork]);

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    addNotification("info", "Address copied to clipboard!");
  };

  const addNotification = (type: NotificationType, message: string) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, type, message }]);
  };

  const removeNotification = (id: number) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id)
    );
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-4 p-5 sm:p-7 xl:py-12 xl:px-4 border border-neutral-300 dark:border-neutral-700 rounded-2xl text-baseBlack dark:text-baseWhite">
      {details.map((item, index) => (
        <div key={index} className="flex flex-col">
          <div className="flex items-center">
            <span className="text-sm mr-1">{item.label}</span>
            <Tooltip content={item.tooltip}>
              <Info size={16} />
            </Tooltip>
          </div>
          <div className="font-semibold text-lg mt-1.5">{item.value}</div>
        </div>
      ))}
      <div className="flex flex-col">
        <div className="flex items-center cursor-pointer">
          <span className="text-sm mr-1">ADDRESS</span>
          <Copy
            size={16}
            onClick={() => handleCopyAddress(poolAddress ? poolAddress : "")}
          />
        </div>
        <div className="font-semibold text-lg mt-1.5">
          {poolAddress == "-" ? poolAddress : getShortenedAddress(poolAddress)}
        </div>
      </div>

      <div className="fixed bottom-5 left-5 w-72">
        {notifications.map(({ id, type, message }) => (
          <Notification
            key={id}
            type={type}
            message={message}
            onClose={() => removeNotification(id)}
            duration={10000}
          />
        ))}
      </div>
    </div>
  );
};

export default PoolDetails;
