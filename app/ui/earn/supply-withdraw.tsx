/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useEffect, useState } from "react";
import { Info } from "@phosphor-icons/react";
import clsx from "clsx";
import TokenDropdown from "../components/token-dropdown";
import Tooltip from "../components/tooltip";
import Image from "next/image";

import { BASE_NETWORK, OPTIMISM_NETWORK } from "@/app/lib/constants";
import { ethers, utils, Contract } from "ethers";
import { formatUnits, parseEther, parseUnits } from "ethers/lib/utils";

import VEther from "@/app/abi/vanna/v1/out/VEther.sol/VEther.json";
import VToken from "@/app/abi/vanna/v1/out/VToken.sol/VToken.json";
import {
  arbAddressList,
  baseAddressList,
  opAddressList,
  arbTokensAddress,
  opTokensAddress,
  baseTokensAddress,
} from "@/app/lib/web3-constants";

import DefaultRateModel from "@/app/abi/vanna/v1/out/DefaultRateModel.sol/DefaultRateModel.json";
// import Multicall from "@/app/abi/vanna/v1/out/Multicall.sol/Multicall.json";
import ERC20 from "../../abi/vanna/v1/out/ERC20.sol/ERC20.json";
import {
  ceilWithPrecision,
  sleep,
  formatBignumberToUnits,
} from "@/app/lib/helper";
import { useNetwork } from "@/app/context/network-context";
import { useWeb3React } from "@web3-react/core";

const SupplyWithdraw = ({ pool }: { pool: PoolTable }) => {
  const { account, library } = useWeb3React();
  const { currentNetwork } = useNetwork();
  const [isSupply, setIsSupply] = useState(true);
  const [amount, setAmount] = useState("");
  // const [selectedPercentage, setSelectedPercentage] = useState<number | null>(
  //   null
  // );
  const [expected, setExpected] = useState(0);
  const [coinBalance, setCoinBalance] = useState("-");
  const [youGet, setYouGet] = useState(0);
  const [ethPerVeth, setEthPerVeth] = useState("-");
  const [currentApy, setCurrentApy] = useState(pool.supplyAPY);
  const [points, setPoints] = useState();
  const [availableEthLiq, setAvailableEthLiq] = useState(0);

  const handleToggle = (value: string) => {
    if (
      (value === "withdraw" && isSupply) ||
      (value === "supply" && !isSupply)
    ) {
      setIsSupply(!isSupply);
    }
  };

  const handlePercentageClick = (percentage: number) => {
    // setSelectedPercentage(percentage);
    setAmount(
      (parseFloat(String(coinBalance)) * (percentage / 100)).toFixed(3)
    );
  };

  const handleTokenSelect = (token: PoolTable) => {
    // TODO: add action here
  };
  const vEtherContract = new Contract(
    arbAddressList.vEtherContractAddress,
    VEther.abi,
    library
  );
  const vDaiContract = new Contract(
    arbAddressList.vDaiContractAddress,
    VToken.abi,
    library
  );
  const vUsdcContract = new Contract(
    arbAddressList.vUSDCContractAddress,
    VToken.abi,
    library
  );
  const vUsdtContract = new Contract(
    arbAddressList.vUSDTContractAddress,
    VToken.abi,
    library
  );
  const vWbtcContract = new Contract(
    arbAddressList.vWBTCContractAddress,
    VToken.abi,
    library
  );
  // const rateModelContract = new Contract(
  //   arbAddressList.rateModelContractAddress,
  //   DefaultRateModel.abi,
  //   library
  // );

  const fetchParams = () => {
    try {
      const processParams = async () => {
        if (pool.name == "WETH") {
          const ethPerVeth = formatBignumberToUnits(
            pool.name,
            await vEtherContract.convertToShares(parseUnits("1", 18))
          );
          setEthPerVeth(ceilWithPrecision(ethPerVeth));
        } else if (pool.name === "WBTC") {
          const btcPerVbtc = formatBignumberToUnits(
            pool.name,
            await vWbtcContract.convertToShares(parseUnits("1", 18))
          );

          setEthPerVeth(ceilWithPrecision(btcPerVbtc, 6));
        } else if (pool.name === "USDC") {
          const usdcPerVusdc = formatBignumberToUnits(
            pool.name,
            await vUsdcContract.convertToShares(parseUnits("1", 6))
          );

          setEthPerVeth(ceilWithPrecision(usdcPerVusdc, 6));
        } else if (pool.name === "USDT") {
          const usdtPerVusdt = formatBignumberToUnits(
            pool.name,
            await vUsdtContract.convertToShares(parseUnits("1", 6))
          );

          setEthPerVeth(ceilWithPrecision(usdtPerVusdt, 6));
        } else if (pool.name === "DAI") {
          const daiPerVdai = formatBignumberToUnits(
            pool.name,
            await vDaiContract.convertToShares(parseUnits("1", 18))
          );

          setEthPerVeth(ceilWithPrecision(daiPerVdai, 6));
        } else {
          console.error("Something went wrong, token = ", pool.name);
        }
      };

      processParams();
    } catch (e) {
      console.error(e);
    }
  };
  fetchParams();

  const getTokenBalance = async (tokenName = pool.name) => {
    try {
      if (account) {
        const signer = await library?.getSigner();

        let bal;

        if (tokenName == "WETH") {
          bal = await library?.getBalance(account);
        } else {
          const contract = new Contract(
            arbTokensAddress[tokenName],
            ERC20.abi,
            signer
          );
          bal = await contract.balanceOf(account);
        }

        const balInNumber = ceilWithPrecision(
          formatBignumberToUnits(tokenName, bal)
        );
        setCoinBalance(balInNumber);
      }
    } catch (e) {
      console.error(e);
    }
  };
  useEffect(() => {
    getTokenBalance();
  }, [account]);

  const deposit = async () => {
    if (currentNetwork.id === BASE_NETWORK) {
      // value assigne is pending
      try {
        const signer = await library?.getSigner();
        // ERC20 contract
        const WBTCContract = new Contract(
          arbTokensAddress[pool.name],
          ERC20.abi,
          signer
        );
        const USDCContract = new Contract(
          arbTokensAddress[pool.name],
          ERC20.abi,
          signer
        );
        const USDTContract = new Contract(
          arbTokensAddress[pool.name],
          ERC20.abi,
          signer
        );
        const DAIContract = new Contract(
          arbTokensAddress[pool.name],
          ERC20.abi,
          signer
        );

        //@TODO: ask meet about this error

        if (isSupply) {
          if (pool.name === "WETH") {
            await vEtherContract.depositEth({
              value: parseEther(amount),
              gasLimit: 2300000,
            });
          } else if (pool.name === "WBTC") {
            // to confirm this abi, address & function

            const allowance = await WBTCContract.allowance(
              account,
              arbAddressList.vWBTCContractAddress
            );

            if (allowance < amount) {
              await WBTCContract.approve(
                arbAddressList.vWBTCContractAddress,
                parseEther(amount)
              );
              await sleep(3000);
            }

            await vWbtcContract.deposit(parseEther(amount), account, {
              gasLimit: 2300000,
            });
          } else if (pool.name === "USDC") {
            // to confirm this abi, address & function

            const allowance = await USDCContract.allowance(
              account,
              arbAddressList.vUSDCContractAddress
            );

            if (allowance < amount) {
              await USDCContract.approve(
                arbAddressList.vUSDCContractAddress,
                parseUnits(amount, 6)
              );
              await sleep(3000);
            }

            await vUsdcContract.deposit(parseUnits(amount, 6), account, {
              gasLimit: 23000000,
            });
          } else if (pool.name === "USDT") {
            // to confirm this abi, address & function

            const allowance = await USDTContract.allowance(
              account,
              arbAddressList.vUSDTContractAddress
            );

            if (allowance < amount) {
              await USDTContract.approve(
                arbAddressList.vUSDTContractAddress,
                parseUnits(amount, 6)
              );
              await sleep(3000);
            }

            await vUsdtContract.deposit(parseUnits(amount, 6), account, {
              gasLimit: 23000000,
            });
          } else {
            const allowance = await DAIContract.allowance(
              account,
              arbAddressList.vDaiContractAddress
            );

            if (allowance < amount) {
              await DAIContract.approve(
                arbAddressList.vDaiContractAddress,
                parseEther(amount)
              );
              await sleep(3000);
            }

            await vDaiContract.deposit(parseEther(amount), account);
          }
        } else {
          if (pool.name === "WETH") {
            const vEthcontract = new Contract(
              arbAddressList.vEtherContractAddress,
              VEther.abi,
              signer
            );
            if (amount <= (await vEthcontract.balanceOf(account))) {
              await vEthcontract.redeemEth(parseEther(amount), {
                gasLimit: 2300000,
              });
            }
          } else if (pool.name === "WBTC") {
            const vBTCcontract = new Contract(
              arbAddressList.vWBTCContractAddress,
              VToken.abi,
              signer
            );
            if (amount <= (await vBTCcontract.balanceOf(account))) {
              await vBTCcontract.redeem(parseEther(amount), account, account, {
                gasLimit: 2300000,
              });
            }
          } else if (pool.name === "USDC") {
            const vUSDCcontract = new Contract(
              arbAddressList.vUSDCContractAddress,
              VToken.abi,
              signer
            );
            if (amount <= (await vUSDCcontract.balanceOf(account))) {
              await vUSDCcontract.redeem(
                parseUnits(amount, 6),
                account,
                account,
                {
                  gasLimit: 2300000,
                }
              );
            }
          } else if (pool.name === "USDT") {
            const vUSDTcontract = new Contract(
              arbAddressList.vUSDTContractAddress,
              VToken.abi,
              signer
            );
            if (amount <= (await vUSDTcontract.balanceOf(account))) {
              await vUSDTcontract.redeem(
                parseUnits(amount, 6),
                account,
                account,
                {
                  gasLimit: 2300000,
                }
              );
            }
          } else if (pool.name === "DAI") {
            const vDaicontract = new Contract(
              arbAddressList.vDaiContractAddress,
              VToken.abi,
              signer
            );
            if (amount <= (await vDaicontract.balanceOf(account))) {
              await vDaicontract.redeem(parseEther(amount), account, account, {
                gasLimit: 2300000,
              });
            }
          } else {
            console.error("something went wrong, Please try again.");
          }
        }
      } catch (error) {
        console.error(error);
      }
    }
    if (currentNetwork.id === OPTIMISM_NETWORK) {
      // value assigne is pending
      try {
        const signer = await library?.getSigner();

        const vEtherContract = new Contract(
          opAddressList.vEtherContractAddress,
          VEther.abi,
          library
        );
        const vDaiContract = new Contract(
          opAddressList.vDaiContractAddress,
          VToken.abi,
          library
        );
        const vUsdcContract = new Contract(
          opAddressList.vUSDCContractAddress,
          VToken.abi,
          library
        );
        const vUsdtContract = new Contract(
          opAddressList.vUSDTContractAddress,
          VToken.abi,
          library
        );
        const vWbtcContract = new Contract(
          opAddressList.vWBTCContractAddress,
          VToken.abi,
          library
        );
        const rateModelContract = new Contract(
          opAddressList.rateModelContractAddress,
          DefaultRateModel.abi,
          library
        );

        // ERC20 contract
        const WBTCContract = new Contract(
          opTokensAddress[pool.name],
          ERC20.abi,
          signer
        );
        const USDCContract = new Contract(
          opTokensAddress[pool.name],
          ERC20.abi,
          signer
        );
        const USDTContract = new Contract(
          opTokensAddress[pool.name],
          ERC20.abi,
          signer
        );
        const DAIContract = new Contract(
          opTokensAddress[pool.name],
          ERC20.abi,
          signer
        );

        const fetchParams = () => {
          try {
            const processParams = async () => {
              if (pool.name == "WETH") {
                const ethPerVeth = formatBignumberToUnits(
                  pool.name,
                  await vEtherContract.convertToShares(parseUnits("1", 18))
                );
                setEthPerVeth(ceilWithPrecision(ethPerVeth, 6));
              } else if (pool.name === "WBTC") {
                const btcPerVbtc = formatBignumberToUnits(
                  pool.name,
                  await vWbtcContract.convertToShares(parseUnits("1", 18))
                );

                setEthPerVeth(ceilWithPrecision(btcPerVbtc, 6));
              } else if (pool.name === "USDC") {
                const usdcPerVusdc = formatBignumberToUnits(
                  pool.name,
                  await vUsdcContract.convertToShares(parseUnits("1", 6))
                );

                setEthPerVeth(ceilWithPrecision(usdcPerVusdc, 6));
              } else if (pool.name === "USDT") {
                const usdtPerVusdt = formatBignumberToUnits(
                  pool.name,
                  await vUsdtContract.convertToShares(parseUnits("1", 6))
                );

                setEthPerVeth(ceilWithPrecision(usdtPerVusdt, 6));
              } else if (pool.name === "DAI") {
                const daiPerVdai = formatBignumberToUnits(
                  pool.name,
                  await vDaiContract.convertToShares(parseUnits("1", 18))
                );

                setEthPerVeth(ceilWithPrecision(daiPerVdai, 6));
              } else {
                console.error("Something went wrong, token = ", pool.name);
              }
            };

            processParams();
          } catch (e) {
            console.error(e);
          }
        };

        if (isSupply) {
          if (pool.name === "WETH") {
            await vEtherContract.depositEth({
              value: parseEther(amount),
              gasLimit: 2300000,
            });
          } else if (pool.name === "WBTC") {
            // to confirm this abi, address & function

            const allowance = await WBTCContract.allowance(
              account,
              opAddressList.vWBTCContractAddress
            );

            if (allowance < amount) {
              await WBTCContract.approve(
                opAddressList.vWBTCContractAddress,
                parseEther(amount)
              );
              await sleep(3000);
            }

            await vWbtcContract.deposit(parseEther(amount), account, {
              gasLimit: 2300000,
            });
          } else if (pool.name === "USDC") {
            // to confirm this abi, address & function

            const allowance = await USDCContract.allowance(
              account,
              opAddressList.vUSDCContractAddress
            );

            if (allowance < amount) {
              await USDCContract.approve(
                opAddressList.vUSDCContractAddress,
                parseUnits(amount, 6)
              );
              await sleep(3000);
            }

            await vUsdcContract.deposit(parseUnits(amount, 6), account, {
              gasLimit: 23000000,
            });
          } else if (pool.name === "USDT") {
            // to confirm this abi, address & function

            const allowance = await USDTContract.allowance(
              account,
              opAddressList.vUSDTContractAddress
            );

            if (allowance < amount) {
              await USDTContract.approve(
                opAddressList.vUSDTContractAddress,
                parseUnits(amount, 6)
              );
              await sleep(3000);
            }

            await vUsdtContract.deposit(parseUnits(amount, 6), account, {
              gasLimit: 23000000,
            });
          } else {
            const allowance = await DAIContract.allowance(
              account,
              opAddressList.vDaiContractAddress
            );

            if (allowance < amount) {
              await DAIContract.approve(
                opAddressList.vDaiContractAddress,
                parseEther(amount)
              );
              await sleep(3000);
            }

            await vDaiContract.deposit(parseEther(amount), account);
          }
        } else {
          if (pool.name === "WETH") {
            const vEthcontract = new Contract(
              opAddressList.vEtherContractAddress,
              VEther.abi,
              signer
            );
            if (amount <= (await vEthcontract.balanceOf(account))) {
              await vEthcontract.redeemEth(parseEther(amount), {
                gasLimit: 2300000,
              });
            }
          } else if (pool.name === "WBTC") {
            const vBTCcontract = new Contract(
              opAddressList.vWBTCContractAddress,
              VToken.abi,
              signer
            );
            if (amount <= (await vBTCcontract.balanceOf(account))) {
              await vBTCcontract.redeem(parseEther(amount), account, account, {
                gasLimit: 2300000,
              });
            }
          } else if (pool.name === "USDC") {
            const vUSDCcontract = new Contract(
              opAddressList.vUSDCContractAddress,
              VToken.abi,
              signer
            );
            if (amount <= (await vUSDCcontract.balanceOf(account))) {
              await vUSDCcontract.redeem(
                parseUnits(amount, 6),
                account,
                account,
                {
                  gasLimit: 2300000,
                }
              );
            }
          } else if (pool.name === "USDT") {
            const vUSDTcontract = new Contract(
              opAddressList.vUSDTContractAddress,
              VToken.abi,
              signer
            );
            if (amount <= (await vUSDTcontract.balanceOf(account))) {
              await vUSDTcontract.redeem(
                parseUnits(amount, 6),
                account,
                account,
                {
                  gasLimit: 2300000,
                }
              );
            }
          } else if (pool.name === "DAI") {
            const vDaicontract = new Contract(
              opAddressList.vDaiContractAddress,
              VToken.abi,
              signer
            );
            if (amount <= (await vDaicontract.balanceOf(account))) {
              await vDaicontract.redeem(parseEther(amount), account, account, {
                gasLimit: 2300000,
              });
            }
          } else {
            console.error("something went wrong, Please try again.");
          }
        }
      } catch (error) {
        console.error(error);
      }
    }
    if (currentNetwork.id === BASE_NETWORK) {
      // value assigne is pending
      try {
        const signer = await library?.getSigner();

        const vEtherContract = new Contract(
          baseAddressList.vEtherContractAddress,
          VEther.abi,
          library
        );
        const vDaiContract = new Contract(
          baseAddressList.vDaiContractAddress,
          VToken.abi,
          library
        );
        const vUsdcContract = new Contract(
          baseAddressList.vUSDCContractAddress,
          VToken.abi,
          library
        );
        const vUsdtContract = new Contract(
          baseAddressList.vUSDTContractAddress,
          VToken.abi,
          library
        );
        const vWbtcContract = new Contract(
          baseAddressList.vWBTCContractAddress,
          VToken.abi,
          library
        );
        const rateModelContract = new Contract(
          baseAddressList.rateModelContractAddress,
          DefaultRateModel.abi,
          library
        );

        // ERC20 contract
        const WBTCContract = new Contract(
          baseTokensAddress[pool.name],
          ERC20.abi,
          signer
        );
        const USDCContract = new Contract(
          baseTokensAddress[pool.name],
          ERC20.abi,
          signer
        );
        const USDTContract = new Contract(
          baseTokensAddress[pool.name],
          ERC20.abi,
          signer
        );
        const DAIContract = new Contract(
          baseTokensAddress[pool.name],
          ERC20.abi,
          signer
        );

        // const fetchParams = () => {
        //   try {
        //     const processParams = async () => {
        //       if (pool.name == "WETH") {
        //         const ethPerVeth = formatBignumberToUnits(
        //           pool.name,
        //           await vEtherContract.convertToShares(parseUnits("1", 18))
        //         );
        //         setEthPerVeth(ceilWithPrecision(ethPerVeth, 6));
        //       } else if (pool.name === "WBTC") {
        //         const btcPerVbtc = formatBignumberToUnits(
        //           pool.name,
        //           await vWbtcContract.convertToShares(parseUnits("1", 18))
        //         );

        //         setEthPerVeth(ceilWithPrecision(btcPerVbtc, 6));
        //       } else if (pool.name === "USDC") {
        //         const usdcPerVusdc = formatBignumberToUnits(
        //           pool.name,
        //           await vUsdcContract.convertToShares(parseUnits("1", 6))
        //         );

        //         setEthPerVeth(ceilWithPrecision(usdcPerVusdc, 6));
        //       } else if (pool.name === "USDT") {
        //         const usdtPerVusdt = formatBignumberToUnits(
        //           pool.name,
        //           await vUsdtContract.convertToShares(parseUnits("1", 6))
        //         );

        //         setEthPerVeth(ceilWithPrecision(usdtPerVusdt, 6));
        //       } else if (pool.name === "DAI") {
        //         const daiPerVdai = formatBignumberToUnits(
        //           pool.name,
        //           await vDaiContract.convertToShares(parseUnits("1", 18))
        //         );

        //         setEthPerVeth(ceilWithPrecision(daiPerVdai, 6));
        //       } else {
        //         console.error("Something went wrong, token = ", pool.name);
        //       }
        //     };

        //     processParams();
        //   } catch (e) {
        //     console.error(e);
        //   }
        // };

        if (isSupply) {
          if (pool.name === "WETH") {
            await vEtherContract.depositEth({
              value: parseEther(amount),
              gasLimit: 2300000,
            });
          } else if (pool.name === "WBTC") {
            // to confirm this abi, address & function

            const allowance = await WBTCContract.allowance(
              account,
              baseAddressList.vWBTCContractAddress
            );

            if (allowance < amount) {
              await WBTCContract.approve(
                baseAddressList.vWBTCContractAddress,
                parseEther(amount)
              );
              await sleep(3000);
            }

            await vWbtcContract.deposit(parseEther(amount), account, {
              gasLimit: 2300000,
            });
          } else if (pool.name === "USDC") {
            // to confirm this abi, address & function

            const allowance = await USDCContract.allowance(
              account,
              baseAddressList.vUSDCContractAddress
            );

            if (allowance < amount) {
              await USDCContract.approve(
                baseAddressList.vUSDCContractAddress,
                parseUnits(amount, 6)
              );
              await sleep(3000);
            }

            await vUsdcContract.deposit(parseUnits(amount, 6), account, {
              gasLimit: 23000000,
            });
          } else if (pool.name === "USDT") {
            // to confirm this abi, address & function

            const allowance = await USDTContract.allowance(
              account,
              baseAddressList.vUSDTContractAddress
            );

            if (allowance < amount) {
              await USDTContract.approve(
                baseAddressList.vUSDTContractAddress,
                parseUnits(amount, 6)
              );
              await sleep(3000);
            }

            await vUsdtContract.deposit(parseUnits(amount, 6), account, {
              gasLimit: 23000000,
            });
          } else {
            const allowance = await DAIContract.allowance(
              account,
              baseAddressList.vDaiContractAddress
            );

            if (allowance < amount) {
              await DAIContract.approve(
                baseAddressList.vDaiContractAddress,
                parseEther(amount)
              );
              await sleep(3000);
            }

            await vDaiContract.deposit(parseEther(amount), account);
          }
        } else {
          if (pool.name === "WETH") {
            const vEthcontract = new Contract(
              baseAddressList.vEtherContractAddress,
              VEther.abi,
              signer
            );
            if (amount <= (await vEthcontract.balanceOf(account))) {
              await vEthcontract.redeemEth(parseEther(amount), {
                gasLimit: 2300000,
              });
            }
          } else if (pool.name === "WBTC") {
            const vBTCcontract = new Contract(
              baseAddressList.vWBTCContractAddress,
              VToken.abi,
              signer
            );
            if (amount <= (await vBTCcontract.balanceOf(account))) {
              await vBTCcontract.redeem(parseEther(amount), account, account, {
                gasLimit: 2300000,
              });
            }
          } else if (pool.name === "USDC") {
            const vUSDCcontract = new Contract(
              baseAddressList.vUSDCContractAddress,
              VToken.abi,
              signer
            );
            if (amount <= (await vUSDCcontract.balanceOf(account))) {
              await vUSDCcontract.redeem(
                parseUnits(amount, 6),
                account,
                account,
                {
                  gasLimit: 2300000,
                }
              );
            }
          } else if (pool.name === "USDT") {
            const vUSDTcontract = new Contract(
              baseAddressList.vUSDTContractAddress,
              VToken.abi,
              signer
            );
            if (amount <= (await vUSDTcontract.balanceOf(account))) {
              await vUSDTcontract.redeem(
                parseUnits(amount, 6),
                account,
                account,
                {
                  gasLimit: 2300000,
                }
              );
            }
          } else if (pool.name === "DAI") {
            const vDaicontract = new Contract(
              baseAddressList.vDaiContractAddress,
              VToken.abi,
              signer
            );
            if (amount <= (await vDaicontract.balanceOf(account))) {
              await vDaicontract.redeem(parseEther(amount), account, account, {
                gasLimit: 2300000,
              });
            }
          } else {
            console.error("something went wrong, Please try again.");
          }
        }
      } catch (error) {
        console.error(error);
      }
    }
  };

  return (
    <div className="bg-baseComplementary p-4 rounded-3xl w-full text-baseBlack">
      <div className="flex mb-4 p-1 text-lg">
        <div
          className={clsx(
            "flex-1 p-[1px] rounded-2xl",
            isSupply ? "bg-gradient-to-r from-gradient-1 to-gradient-2" : ""
          )}
        >
          <button
            className={clsx(
              "w-full py-3 px-2 rounded-2xl",
              isSupply ? "bg-white" : "bg-transparent"
            )}
            onClick={() => handleToggle("supply")}
          >
            Supply
          </button>
        </div>
        <div
          className={clsx(
            "flex-1 p-[1px] rounded-2xl",
            !isSupply ? "bg-gradient-to-r from-gradient-1 to-gradient-2" : ""
          )}
        >
          <button
            className={clsx(
              "w-full py-3 px-2 rounded-2xl",
              !isSupply ? "bg-white" : "bg-transparent"
            )}
            onClick={() => handleToggle("withdraw")}
          >
            Withdraw
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg p-4 mb-4">
        <div className="flex justify-between mb-2">
          <div className="flex flex-col">
            <span className="font-medium text-sm mb-2">Deposit</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full text-baseBlack text-2xl font-bold outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              placeholder="0"
            />
          </div>
          <div className="flex">
            <TokenDropdown onSelect={handleTokenSelect} />
          </div>
        </div>
        <div className="flex justify-between mt-2">
          <div className="text-xs text-neutral-500">
            Expected {expected} USDT
          </div>
          <div className="text-xs text-neutral-500">
            Balance: {coinBalance} {coinBalance !== "-" ? pool.name : ""}
          </div>
        </div>
      </div>

      <div className="flex justify-between mb-4">
        {[1, 10, 50, 100].map((percent) => (
          <button
            key={percent}
            onClick={() => handlePercentageClick(percent)}
            className={clsx(
              "w-1/5 h-12 bg-purpleBG-lighter font-semibold text-base rounded-lg"
            )}
          >
            {percent}%
          </button>
        ))}
      </div>

      <div className="p-4 mb-4 text-sm font-medium">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center">
            <span className="mr-1">Target token</span>
            <Tooltip content={"Target token"}>
              <Info size={14} color="black" />
            </Tooltip>
          </div>
          <div className="flex items-center">
            <Image
              src={pool.icon}
              alt={pool.name + " token"}
              className="w-6 h-6 mr-1 rounded-full"
              width={16}
              height={16}
            />
            <span className="font-semibold">{pool.vToken}</span>
          </div>
        </div>
        <div className="flex justify-between text-sm mb-1">
          <span>You get</span>
          <span>{youGet}</span>
        </div>
        <div className="flex justify-between text-sm mb-1">
          <span>{pool.name + " per " + pool.vToken}</span>
          <span>{ethPerVeth}</span>
        </div>
        {isSupply && (
          <>
            <div className="flex justify-between text-sm mb-1">
              <span>Current APY</span>
              <span>{currentApy}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Points</span>
              <span>{points} Kpts MIle per hour</span>
            </div>
          </>
        )}
        {!isSupply && (
          <>
            <div className="flex justify-between text-sm mb-1">
              <span>Available liquidity</span>
              <span>{availableEthLiq}</span>
            </div>
          </>
        )}
      </div>

      <button
        className="w-full bg-purple text-white py-3 rounded-2xl font-semibold text-xl"
        onClick={deposit}
      >
        Deposit
      </button>
    </div>
  );
};

export default SupplyWithdraw;
