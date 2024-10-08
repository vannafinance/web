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
import Loader from "../components/loader";

const SupplyWithdraw = ({
  pool,
  onTokenUpdate,
}: {
  pool: PoolTable;
  onTokenUpdate: (token: PoolTable) => void;
}) => {
  const { account, library } = useWeb3React();
  const { currentNetwork } = useNetwork();
  const [isSupply, setIsSupply] = useState(true);
  const [loading, setLoading] = useState(false);
  const [disableBtn, setDisableBtn] = useState(true);
  const [btnValue, setBtnValue] = useState("Enter an amount");

  const [amount, setAmount] = useState<number | undefined>();
  // const [selectedPercentage, setSelectedPercentage] = useState<number | null>(
  //   null
  // );
  const [selectedToken, setSelectedToken] = useState(pool);
  const [expected, setExpected] = useState(0);
  const [coinBalance, setCoinBalance] = useState<number | undefined>();
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
    // setAmount(
    //   (parseFloat(String(coinBalance)) * (percentage / 100)).toFixed(3)
    // );
  };

  const handleTokenSelect = (token: PoolTable) => {
    setSelectedToken(token);
    onTokenUpdate(token);
  };

  useEffect(() => {
    const tokenName = selectedToken ? selectedToken.name : "";
    if (amount === undefined || amount <= 0) {
      setBtnValue("Enter an amount");
      setDisableBtn(true);
    } else if (coinBalance && amount && coinBalance * 1.0 < amount * 1.0) {
      setBtnValue("Insufficient " + tokenName + " balance");
      setDisableBtn(true);
    } else {
      setBtnValue(
        isSupply
          ? tokenName === "WETH"
            ? "Deposit"
            : "Approve - Deposit"
          : tokenName === "WETH"
          ? "Withdraw"
          : "Approve - Withdraw"
      );
      setDisableBtn(false);
    }
  }, [amount, coinBalance, isSupply, selectedToken]);

  // const rateModelContract = new Contract(
  //   arbAddressList.rateModelContractAddress,
  //   DefaultRateModel.abi,
  //   library
  // );

  const fetchParams = () => {
    try {
      const processParams = async () => {
        if (library && library?.getSigner()) {
          const signer = await library?.getSigner();

          const vEtherContract = new Contract(
            arbAddressList.vEtherContractAddress,
            VEther.abi,
            signer
          );
          const vDaiContract = new Contract(
            arbAddressList.vDaiContractAddress,
            VToken.abi,
            signer
          );
          const vUsdcContract = new Contract(
            arbAddressList.vUSDCContractAddress,
            VToken.abi,
            signer
          );
          const vUsdtContract = new Contract(
            arbAddressList.vUSDTContractAddress,
            VToken.abi,
            signer
          );
          const vWbtcContract = new Contract(
            arbAddressList.vWBTCContractAddress,
            VToken.abi,
            signer
          );

          if (selectedToken.name == "WETH") {
            const ethPerVeth = formatBignumberToUnits(
              selectedToken.name,
              await vEtherContract.convertToShares(parseUnits("1", 18))
            );
            setEthPerVeth(ceilWithPrecision(ethPerVeth));
          } else if (selectedToken.name === "WBTC") {
            const btcPerVbtc = formatBignumberToUnits(
              selectedToken.name,
              await vWbtcContract.convertToShares(parseUnits("1", 18))
            );

            setEthPerVeth(ceilWithPrecision(btcPerVbtc, 6));
          } else if (selectedToken.name === "USDC") {
            const usdcPerVusdc = formatBignumberToUnits(
              selectedToken.name,
              await vUsdcContract.convertToShares(parseUnits("1", 6))
            );

            setEthPerVeth(ceilWithPrecision(usdcPerVusdc, 6));
          } else if (selectedToken.name === "USDT") {
            const usdtPerVusdt = formatBignumberToUnits(
              selectedToken.name,
              await vUsdtContract.convertToShares(parseUnits("1", 6))
            );

            setEthPerVeth(ceilWithPrecision(usdtPerVusdt, 6));
          } else if (selectedToken.name === "DAI") {
            const daiPerVdai = formatBignumberToUnits(
              selectedToken.name,
              await vDaiContract.convertToShares(parseUnits("1", 18))
            );

            setEthPerVeth(ceilWithPrecision(daiPerVdai, 6));
          } else {
            console.error("Something went wrong, token = ", selectedToken.name);
          }
        }
      };

      processParams();
    } catch (e) {
      console.error(e);
    }
  };
  fetchParams();

  const getTokenBalance = async (tokenName = selectedToken.name) => {
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
        setCoinBalance(Number(balInNumber));
      }
    } catch (e) {
      console.error(e);
    }
  };
  useEffect(() => {
    getTokenBalance();
  }, [account]);

  const deposit = async () => {
    const signer = await library?.getSigner();

    const vEtherContract = new Contract(
      arbAddressList.vEtherContractAddress,
      VEther.abi,
      signer
    );
    const vDaiContract = new Contract(
      arbAddressList.vDaiContractAddress,
      VToken.abi,
      signer
    );
    const vUsdcContract = new Contract(
      arbAddressList.vUSDCContractAddress,
      VToken.abi,
      signer
    );
    const vUsdtContract = new Contract(
      arbAddressList.vUSDTContractAddress,
      VToken.abi,
      signer
    );
    const vWbtcContract = new Contract(
      arbAddressList.vWBTCContractAddress,
      VToken.abi,
      signer
    );

    if (currentNetwork.id === BASE_NETWORK) {
      // value assigne is pending
      try {
        const signer = await library?.getSigner();
        // ERC20 contract
        const WBTCContract = new Contract(
          arbTokensAddress[selectedToken.name],
          ERC20.abi,
          signer
        );
        const USDCContract = new Contract(
          arbTokensAddress[selectedToken.name],
          ERC20.abi,
          signer
        );
        const USDTContract = new Contract(
          arbTokensAddress[selectedToken.name],
          ERC20.abi,
          signer
        );
        const DAIContract = new Contract(
          arbTokensAddress[selectedToken.name],
          ERC20.abi,
          signer
        );

        //@TODO: ask meet about this error

        if (isSupply) {
          if (selectedToken.name === "WETH") {
            await vEtherContract.depositEth({
              value: parseEther(String(amount)),
              gasLimit: 2300000,
            });
          } else if (selectedToken.name === "WBTC") {
            // to confirm this abi, address & function

            const allowance = await WBTCContract.allowance(
              account,
              arbAddressList.vWBTCContractAddress
            );

            if (amount && allowance < amount) {
              await WBTCContract.approve(
                arbAddressList.vWBTCContractAddress,
                parseEther(String(amount))
              );
              await sleep(3000);
            }

            await vWbtcContract.deposit(parseEther(String(amount)), account, {
              gasLimit: 2300000,
            });
          } else if (selectedToken.name === "USDC") {
            // to confirm this abi, address & function

            const allowance = await USDCContract.allowance(
              account,
              arbAddressList.vUSDCContractAddress
            );

            if (amount && allowance < amount) {
              await USDCContract.approve(
                arbAddressList.vUSDCContractAddress,
                parseUnits(String(amount), 6)
              );
              await sleep(3000);
            }

            await vUsdcContract.deposit(
              parseUnits(String(amount), 6),
              account,
              {
                gasLimit: 23000000,
              }
            );
          } else if (selectedToken.name === "USDT") {
            // to confirm this abi, address & function

            const allowance = await USDTContract.allowance(
              account,
              arbAddressList.vUSDTContractAddress
            );

            if (amount && allowance < amount) {
              await USDTContract.approve(
                arbAddressList.vUSDTContractAddress,
                parseUnits(String(amount), 6)
              );
              await sleep(3000);
            }

            await vUsdtContract.deposit(
              parseUnits(String(amount), 6),
              account,
              {
                gasLimit: 23000000,
              }
            );
          } else {
            const allowance = await DAIContract.allowance(
              account,
              arbAddressList.vDaiContractAddress
            );

            if (amount && allowance < amount) {
              await DAIContract.approve(
                arbAddressList.vDaiContractAddress,
                parseEther(String(amount))
              );
              await sleep(3000);
            }

            await vDaiContract.deposit(parseEther(String(amount)), account);
          }
        } else {
          if (selectedToken.name === "WETH") {
            const vEthcontract = new Contract(
              arbAddressList.vEtherContractAddress,
              VEther.abi,
              signer
            );
            if (amount && amount <= (await vEthcontract.balanceOf(account))) {
              await vEthcontract.redeemEth(parseEther(String(amount)), {
                gasLimit: 2300000,
              });
            }
          } else if (selectedToken.name === "WBTC") {
            const vBTCcontract = new Contract(
              arbAddressList.vWBTCContractAddress,
              VToken.abi,
              signer
            );
            if (amount && amount <= (await vBTCcontract.balanceOf(account))) {
              await vBTCcontract.redeem(
                parseEther(String(amount)),
                account,
                account,
                {
                  gasLimit: 2300000,
                }
              );
            }
          } else if (selectedToken.name === "USDC") {
            const vUSDCcontract = new Contract(
              arbAddressList.vUSDCContractAddress,
              VToken.abi,
              signer
            );
            if (amount && amount <= (await vUSDCcontract.balanceOf(account))) {
              await vUSDCcontract.redeem(
                parseUnits(String(amount), 6),
                account,
                account,
                {
                  gasLimit: 2300000,
                }
              );
            }
          } else if (selectedToken.name === "USDT") {
            const vUSDTcontract = new Contract(
              arbAddressList.vUSDTContractAddress,
              VToken.abi,
              signer
            );
            if (amount && amount <= (await vUSDTcontract.balanceOf(account))) {
              await vUSDTcontract.redeem(
                parseUnits(String(amount), 6),
                account,
                account,
                {
                  gasLimit: 2300000,
                }
              );
            }
          } else if (selectedToken.name === "DAI") {
            const vDaicontract = new Contract(
              arbAddressList.vDaiContractAddress,
              VToken.abi,
              signer
            );
            if (amount && amount <= (await vDaicontract.balanceOf(account))) {
              await vDaicontract.redeem(
                parseEther(String(amount)),
                account,
                account,
                {
                  gasLimit: 2300000,
                }
              );
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
          opTokensAddress[selectedToken.name],
          ERC20.abi,
          signer
        );
        const USDCContract = new Contract(
          opTokensAddress[selectedToken.name],
          ERC20.abi,
          signer
        );
        const USDTContract = new Contract(
          opTokensAddress[selectedToken.name],
          ERC20.abi,
          signer
        );
        const DAIContract = new Contract(
          opTokensAddress[selectedToken.name],
          ERC20.abi,
          signer
        );

        const fetchParams = () => {
          try {
            const processParams = async () => {
              if (selectedToken.name == "WETH") {
                const ethPerVeth = formatBignumberToUnits(
                  selectedToken.name,
                  await vEtherContract.convertToShares(parseUnits("1", 18))
                );
                setEthPerVeth(ceilWithPrecision(ethPerVeth, 6));
              } else if (selectedToken.name === "WBTC") {
                const btcPerVbtc = formatBignumberToUnits(
                  selectedToken.name,
                  await vWbtcContract.convertToShares(parseUnits("1", 18))
                );

                setEthPerVeth(ceilWithPrecision(btcPerVbtc, 6));
              } else if (selectedToken.name === "USDC") {
                const usdcPerVusdc = formatBignumberToUnits(
                  selectedToken.name,
                  await vUsdcContract.convertToShares(parseUnits("1", 6))
                );

                setEthPerVeth(ceilWithPrecision(usdcPerVusdc, 6));
              } else if (selectedToken.name === "USDT") {
                const usdtPerVusdt = formatBignumberToUnits(
                  selectedToken.name,
                  await vUsdtContract.convertToShares(parseUnits("1", 6))
                );

                setEthPerVeth(ceilWithPrecision(usdtPerVusdt, 6));
              } else if (selectedToken.name === "DAI") {
                const daiPerVdai = formatBignumberToUnits(
                  selectedToken.name,
                  await vDaiContract.convertToShares(parseUnits("1", 18))
                );

                setEthPerVeth(ceilWithPrecision(daiPerVdai, 6));
              } else {
                console.error(
                  "Something went wrong, token = ",
                  selectedToken.name
                );
              }
            };

            processParams();
          } catch (e) {
            console.error(e);
          }
        };

        if (isSupply) {
          if (selectedToken.name === "WETH") {
            await vEtherContract.depositEth({
              value: parseEther(String(amount)),
              gasLimit: 2300000,
            });
          } else if (selectedToken.name === "WBTC") {
            // to confirm this abi, address & function

            const allowance = await WBTCContract.allowance(
              account,
              opAddressList.vWBTCContractAddress
            );

            if (amount && allowance < amount) {
              await WBTCContract.approve(
                opAddressList.vWBTCContractAddress,
                parseEther(String(amount))
              );
              await sleep(3000);
            }

            await vWbtcContract.deposit(parseEther(String(amount)), account, {
              gasLimit: 2300000,
            });
          } else if (selectedToken.name === "USDC") {
            // to confirm this abi, address & function

            const allowance = await USDCContract.allowance(
              account,
              opAddressList.vUSDCContractAddress
            );

            if (amount && allowance < amount) {
              await USDCContract.approve(
                opAddressList.vUSDCContractAddress,
                parseUnits(String(amount), 6)
              );
              await sleep(3000);
            }

            await vUsdcContract.deposit(
              parseUnits(String(amount), 6),
              account,
              {
                gasLimit: 23000000,
              }
            );
          } else if (selectedToken.name === "USDT") {
            // to confirm this abi, address & function

            const allowance = await USDTContract.allowance(
              account,
              opAddressList.vUSDTContractAddress
            );

            if (amount && allowance < amount) {
              await USDTContract.approve(
                opAddressList.vUSDTContractAddress,
                parseUnits(String(amount), 6)
              );
              await sleep(3000);
            }

            await vUsdtContract.deposit(
              parseUnits(String(amount), 6),
              account,
              {
                gasLimit: 23000000,
              }
            );
          } else {
            const allowance = await DAIContract.allowance(
              account,
              opAddressList.vDaiContractAddress
            );

            if (amount && allowance < amount) {
              await DAIContract.approve(
                opAddressList.vDaiContractAddress,
                parseEther(String(amount))
              );
              await sleep(3000);
            }

            await vDaiContract.deposit(parseEther(String(amount)), account);
          }
        } else {
          if (selectedToken.name === "WETH") {
            const vEthcontract = new Contract(
              opAddressList.vEtherContractAddress,
              VEther.abi,
              signer
            );
            if (amount && amount <= (await vEthcontract.balanceOf(account))) {
              await vEthcontract.redeemEth(parseEther(String(amount)), {
                gasLimit: 2300000,
              });
            }
          } else if (selectedToken.name === "WBTC") {
            const vBTCcontract = new Contract(
              opAddressList.vWBTCContractAddress,
              VToken.abi,
              signer
            );
            if (amount && amount <= (await vBTCcontract.balanceOf(account))) {
              await vBTCcontract.redeem(
                parseEther(String(amount)),
                account,
                account,
                {
                  gasLimit: 2300000,
                }
              );
            }
          } else if (selectedToken.name === "USDC") {
            const vUSDCcontract = new Contract(
              opAddressList.vUSDCContractAddress,
              VToken.abi,
              signer
            );
            if (amount && amount <= (await vUSDCcontract.balanceOf(account))) {
              await vUSDCcontract.redeem(
                parseUnits(String(amount), 6),
                account,
                account,
                {
                  gasLimit: 2300000,
                }
              );
            }
          } else if (selectedToken.name === "USDT") {
            const vUSDTcontract = new Contract(
              opAddressList.vUSDTContractAddress,
              VToken.abi,
              signer
            );
            if (amount && amount <= (await vUSDTcontract.balanceOf(account))) {
              await vUSDTcontract.redeem(
                parseUnits(String(amount), 6),
                account,
                account,
                {
                  gasLimit: 2300000,
                }
              );
            }
          } else if (selectedToken.name === "DAI") {
            const vDaicontract = new Contract(
              opAddressList.vDaiContractAddress,
              VToken.abi,
              signer
            );
            if (amount && amount <= (await vDaicontract.balanceOf(account))) {
              await vDaicontract.redeem(
                parseEther(String(amount)),
                account,
                account,
                {
                  gasLimit: 2300000,
                }
              );
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
          signer
        );
        const vDaiContract = new Contract(
          baseAddressList.vDaiContractAddress,
          VToken.abi,
          signer
        );
        const vUsdcContract = new Contract(
          baseAddressList.vUSDCContractAddress,
          VToken.abi,
          signer
        );
        const vUsdtContract = new Contract(
          baseAddressList.vUSDTContractAddress,
          VToken.abi,
          signer
        );
        const vWbtcContract = new Contract(
          baseAddressList.vWBTCContractAddress,
          VToken.abi,
          signer
        );
        const rateModelContract = new Contract(
          baseAddressList.rateModelContractAddress,
          DefaultRateModel.abi,
          signer
        );

        // ERC20 contract
        const WBTCContract = new Contract(
          baseTokensAddress[selectedToken.name],
          ERC20.abi,
          signer
        );
        const USDCContract = new Contract(
          baseTokensAddress[selectedToken.name],
          ERC20.abi,
          signer
        );
        const USDTContract = new Contract(
          baseTokensAddress[selectedToken.name],
          ERC20.abi,
          signer
        );
        const DAIContract = new Contract(
          baseTokensAddress[selectedToken.name],
          ERC20.abi,
          signer
        );

        // const fetchParams = () => {
        //   try {
        //     const processParams = async () => {
        //       if (selectedToken.name == "WETH") {
        //         const ethPerVeth = formatBignumberToUnits(
        //           selectedToken.name,
        //           await vEtherContract.convertToShares(parseUnits("1", 18))
        //         );
        //         setEthPerVeth(ceilWithPrecision(ethPerVeth, 6));
        //       } else if (selectedToken.name === "WBTC") {
        //         const btcPerVbtc = formatBignumberToUnits(
        //           selectedToken.name,
        //           await vWbtcContract.convertToShares(parseUnits("1", 18))
        //         );

        //         setEthPerVeth(ceilWithPrecision(btcPerVbtc, 6));
        //       } else if (selectedToken.name === "USDC") {
        //         const usdcPerVusdc = formatBignumberToUnits(
        //           selectedToken.name,
        //           await vUsdcContract.convertToShares(parseUnits("1", 6))
        //         );

        //         setEthPerVeth(ceilWithPrecision(usdcPerVusdc, 6));
        //       } else if (selectedToken.name === "USDT") {
        //         const usdtPerVusdt = formatBignumberToUnits(
        //           selectedToken.name,
        //           await vUsdtContract.convertToShares(parseUnits("1", 6))
        //         );

        //         setEthPerVeth(ceilWithPrecision(usdtPerVusdt, 6));
        //       } else if (selectedToken.name === "DAI") {
        //         const daiPerVdai = formatBignumberToUnits(
        //           selectedToken.name,
        //           await vDaiContract.convertToShares(parseUnits("1", 18))
        //         );

        //         setEthPerVeth(ceilWithPrecision(daiPerVdai, 6));
        //       } else {
        //         console.error("Something went wrong, token = ", selectedToken.name);
        //       }
        //     };

        //     processParams();
        //   } catch (e) {
        //     console.error(e);
        //   }
        // };

        if (isSupply) {
          if (selectedToken.name === "WETH") {
            await vEtherContract.depositEth({
              value: parseEther(String(amount)),
              gasLimit: 2300000,
            });
          } else if (selectedToken.name === "WBTC") {
            // to confirm this abi, address & function

            const allowance = await WBTCContract.allowance(
              account,
              baseAddressList.vWBTCContractAddress
            );

            if (amount && allowance < amount) {
              await WBTCContract.approve(
                baseAddressList.vWBTCContractAddress,
                parseEther(String(amount))
              );
              await sleep(3000);
            }

            await vWbtcContract.deposit(parseEther(String(amount)), account, {
              gasLimit: 2300000,
            });
          } else if (selectedToken.name === "USDC") {
            // to confirm this abi, address & function

            const allowance = await USDCContract.allowance(
              account,
              baseAddressList.vUSDCContractAddress
            );

            if (amount && allowance < amount) {
              await USDCContract.approve(
                baseAddressList.vUSDCContractAddress,
                parseUnits(String(amount), 6)
              );
              await sleep(3000);
            }

            await vUsdcContract.deposit(
              parseUnits(String(amount), 6),
              account,
              {
                gasLimit: 23000000,
              }
            );
          } else if (selectedToken.name === "USDT") {
            // to confirm this abi, address & function

            const allowance = await USDTContract.allowance(
              account,
              baseAddressList.vUSDTContractAddress
            );

            if (amount && allowance < amount) {
              await USDTContract.approve(
                baseAddressList.vUSDTContractAddress,
                parseUnits(String(amount), 6)
              );
              await sleep(3000);
            }

            await vUsdtContract.deposit(
              parseUnits(String(amount), 6),
              account,
              {
                gasLimit: 23000000,
              }
            );
          } else {
            const allowance = await DAIContract.allowance(
              account,
              baseAddressList.vDaiContractAddress
            );

            if (amount && allowance < amount) {
              await DAIContract.approve(
                baseAddressList.vDaiContractAddress,
                parseEther(String(amount))
              );
              await sleep(3000);
            }

            await vDaiContract.deposit(parseEther(String(amount)), account);
          }
        } else {
          if (selectedToken.name === "WETH") {
            const vEthcontract = new Contract(
              baseAddressList.vEtherContractAddress,
              VEther.abi,
              signer
            );
            if (amount && amount <= (await vEthcontract.balanceOf(account))) {
              await vEthcontract.redeemEth(parseEther(String(amount)), {
                gasLimit: 2300000,
              });
            }
          } else if (selectedToken.name === "WBTC") {
            const vBTCcontract = new Contract(
              baseAddressList.vWBTCContractAddress,
              VToken.abi,
              signer
            );
            if (amount && amount <= (await vBTCcontract.balanceOf(account))) {
              await vBTCcontract.redeem(
                parseEther(String(amount)),
                account,
                account,
                {
                  gasLimit: 2300000,
                }
              );
            }
          } else if (selectedToken.name === "USDC") {
            const vUSDCcontract = new Contract(
              baseAddressList.vUSDCContractAddress,
              VToken.abi,
              signer
            );
            if (amount && amount <= (await vUSDCcontract.balanceOf(account))) {
              await vUSDCcontract.redeem(
                parseUnits(String(amount), 6),
                account,
                account,
                {
                  gasLimit: 2300000,
                }
              );
            }
          } else if (selectedToken.name === "USDT") {
            const vUSDTcontract = new Contract(
              baseAddressList.vUSDTContractAddress,
              VToken.abi,
              signer
            );
            if (amount && amount <= (await vUSDTcontract.balanceOf(account))) {
              await vUSDTcontract.redeem(
                parseUnits(String(amount), 6),
                account,
                account,
                {
                  gasLimit: 2300000,
                }
              );
            }
          } else if (selectedToken.name === "DAI") {
            const vDaicontract = new Contract(
              baseAddressList.vDaiContractAddress,
              VToken.abi,
              signer
            );
            if (amount && amount <= (await vDaicontract.balanceOf(account))) {
              await vDaicontract.redeem(
                parseEther(String(amount)),
                account,
                account,
                {
                  gasLimit: 2300000,
                }
              );
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

  // const withdraw = async () => {}

  // const process = async () => {
  //   if (isSupply) {
  //     await deposit();
  //   } else {
  //     // await withdraw();
  //   }
  // };

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
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full text-baseBlack text-2xl font-bold outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              placeholder="0"
            />
          </div>
          <div className="flex">
            <TokenDropdown
              onSelect={handleTokenSelect}
              defaultValue={selectedToken}
            />
          </div>
        </div>
        <div className="flex justify-between mt-2">
          <div className="text-xs text-neutral-500">
            Expected {expected} USD
          </div>
          <div className="text-xs text-neutral-500">
            Balance: {coinBalance}{" "}
            {coinBalance !== undefined ? selectedToken.name : "-"}
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
              src={selectedToken.icon}
              alt={selectedToken.name + " token"}
              className="w-6 h-6 mr-1 rounded-full"
              width={16}
              height={16}
            />
            <span className="font-semibold">{selectedToken.vToken}</span>
          </div>
        </div>
        <div className="flex justify-between text-sm mb-1">
          <span>You get</span>
          <span>{youGet}</span>
        </div>
        <div className="flex justify-between text-sm mb-1">
          <span>{selectedToken.name + " per " + selectedToken.vToken}</span>
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

      {!account && (
        <button className="w-full bg-neutral-500 text-white py-3 rounded-2xl font-semibold text-xl mb-6">
          Connect Wallet
        </button>
      )}
      {account && loading && (
        <button className="w-full bg-purple py-3 rounded-2xl font-semibold text-xl mb-6 flex justify-center">
          <Loader />
        </button>
      )}
      {account && !loading && disableBtn && (
        <button className="w-full bg-neutral-500 text-white py-3 rounded-2xl font-semibold text-xl mb-6">
          {btnValue}
        </button>
      )}
      {account && !loading && !disableBtn && (
        <button
          className="w-full bg-purple text-white py-3 rounded-2xl font-semibold text-xl mb-6"
          onClick={deposit}
        >
          {btnValue}
        </button>
      )}
    </div>
  );
};

export default SupplyWithdraw;
