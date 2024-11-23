/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useEffect, useState } from "react";
import { Info } from "@phosphor-icons/react";
import clsx from "clsx";
import TokenDropdown from "../components/token-dropdown";
import Tooltip from "../components/tooltip";
import Image from "next/image";

import {
  ARBITRUM_NETWORK,
  BASE_NETWORK,
  OPTIMISM_NETWORK,
  percentageClickValues,
} from "@/app/lib/constants";
import { ethers, utils, Contract, BigNumber } from "ethers";
import { formatUnits, parseEther, parseUnits } from "ethers/lib/utils";
import Multicall from "@/app/abi/vanna/v1/out/Multicall.sol/Multicall.json";
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
import ERC20 from "../../abi/vanna/v1/out/ERC20.sol/ERC20.json";
import {
  ceilWithPrecision,
  sleep,
  formatBignumberToUnits,
  check0xHex,
} from "@/app/lib/helper";
import { useNetwork } from "@/app/context/network-context";
import { useWeb3React } from "@web3-react/core";
import Loader from "../components/loader";
import { formatUSD } from "@/app/lib/number-format-helper";
import axios from "axios";
import Notification from "../components/notification";

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

  const [amount, setAmount] = useState<string | undefined>();
  const [selectedToken, setSelectedToken] = useState(pool);
  const [expected, setExpected] = useState(0);
  const [coinBalance, setCoinBalance] = useState<number | undefined>(0);
  const [youGet, setYouGet] = useState(0);
  const [ethPerVeth, setEthPerVeth] = useState("-");
  const [currentApy, setCurrentApy] = useState(pool.supplyAPY);
  // const [points, setPoints] = useState();
  const [availableLiq, setAvailableLiq] = useState("-");

  const [notifications, setNotifications] = useState<
    Array<{ id: number; type: NotificationType; message: string }>
  >([]);

  const handleToggle = (value: string) => {
    if (
      (value === "withdraw" && isSupply) ||
      (value === "supply" && !isSupply)
    ) {
      setIsSupply(!isSupply);
    }
  };

  const handlePercentageClick = (percentage: number) => {
    if (coinBalance) {
      updateAmount(
        Number(ceilWithPrecision(String(coinBalance * (percentage / 100))))
      );
    }
  };

  const handleTokenSelect = (token: PoolTable) => {
    setSelectedToken(token);
    onTokenUpdate(token);
    setCoinBalance(0);
  };

  useEffect(() => {
    setCurrentApy(pool.supplyAPY);
  }, [pool]);

  useEffect(() => {
    const tokenName = selectedToken ? selectedToken.name : "";
    if (amount === "" || Number(amount) <= 0) {
      setBtnValue("Enter an amount");
      setDisableBtn(true);
    } else if (
      coinBalance &&
      amount &&
      amount !== "" &&
      coinBalance * 1.0 < Number(amount) * 1.0
    ) {
      setBtnValue("Insufficient " + tokenName + " balance");
      setDisableBtn(true);
    } else {
      setBtnValue(
        isSupply
          ? tokenName === "WETH"
            ? "Deposit"
            : "Approve - Deposit"
          : "Withdraw"
      );
      setDisableBtn(false);
    }
  }, [amount, coinBalance, isSupply, selectedToken]);

  const fetchParams = () => {
    try {
      if (!currentNetwork) return;

      const processParams = async () => {
        if (library && library?.getSigner()) {
          const signer = await library?.getSigner();

          let vEtherContract;
          let vDaiContract;
          let vUsdcContract;
          let vUsdtContract;
          let vWbtcContract;

          if (currentNetwork.id === ARBITRUM_NETWORK) {
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
          } else if (currentNetwork.id === BASE_NETWORK) {
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
          }

          if (
            !vEtherContract ||
            !vDaiContract ||
            !vUsdcContract ||
            !vUsdtContract ||
            !vWbtcContract
          )
            return;

          if (selectedToken.name === "WETH") {
            const val = await vEtherContract.convertToShares(
              BigNumber.from("1000000000000000000")
            );
            const ethPerVeth = formatBignumberToUnits(selectedToken.name, val);

            if (isSupply) {
              setEthPerVeth(ceilWithPrecision(ethPerVeth));
            } else {
              setEthPerVeth(ceilWithPrecision(String(1 / Number(ethPerVeth))));
            }
          } else if (selectedToken.name === "WBTC") {
            const btcPerVbtc = formatBignumberToUnits(
              selectedToken.name,
              await vWbtcContract.convertToShares(parseUnits("1", 18))
            );

            if (isSupply) {
              setEthPerVeth(ceilWithPrecision(btcPerVbtc, 6));
            } else {
              setEthPerVeth(
                ceilWithPrecision(String(1 / Number(btcPerVbtc)), 6)
              );
            }
          } else if (selectedToken.name === "USDC") {
            const usdcPerVusdc = formatBignumberToUnits(
              selectedToken.name,
              await vUsdcContract.convertToShares(parseUnits("1", 6))
            );

            if (isSupply) {
              setEthPerVeth(ceilWithPrecision(usdcPerVusdc, 6));
            } else {
              setEthPerVeth(
                ceilWithPrecision(String(1 / Number(usdcPerVusdc)), 6)
              );
            }
          } else if (selectedToken.name === "USDT") {
            const usdtPerVusdt = formatBignumberToUnits(
              selectedToken.name,
              await vUsdtContract.convertToShares(parseUnits("1", 6))
            );

            if (isSupply) {
              setEthPerVeth(ceilWithPrecision(usdtPerVusdt, 6));
            } else {
              setEthPerVeth(
                ceilWithPrecision(String(1 / Number(usdtPerVusdt)), 6)
              );
            }
          } else if (selectedToken.name === "DAI") {
            const daiPerVdai = formatBignumberToUnits(
              selectedToken.name,
              await vDaiContract.convertToShares(parseUnits("1", 18))
            );

            if (isSupply) {
              setEthPerVeth(ceilWithPrecision(daiPerVdai, 6));
            } else {
              setEthPerVeth(
                ceilWithPrecision(String(1 / Number(daiPerVdai)), 6)
              );
            }
          } else {
            console.error("Something went wrong, token = ", selectedToken.name);
            setEthPerVeth("-");
          }
        } else {
          setEthPerVeth("-");
        }

        if (!isSupply && account) {
          let res;

          if (currentNetwork.id === ARBITRUM_NETWORK) {
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

            res = await MCcontract.callStatic.aggregate(calldata);
          } else if (currentNetwork.id === OPTIMISM_NETWORK) {
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

            res = await MCcontract.callStatic.aggregate(calldata);
          } else if (currentNetwork.id === BASE_NETWORK) {
            const iFaceEth = new utils.Interface(VEther.abi);
            const iFaceToken = new utils.Interface(VToken.abi);

            const MCcontract = new Contract(
              baseAddressList.multicallAddress,
              Multicall.abi,
              library
            );

            const calldata = [];
            let tempData;

            tempData = utils.arrayify(
              iFaceEth.encodeFunctionData("balanceOf", [
                baseAddressList.vEtherContractAddress,
              ])
            );
            calldata.push([baseAddressList.wethTokenAddress, tempData]);

            tempData = utils.arrayify(
              iFaceToken.encodeFunctionData("balanceOf", [
                baseAddressList.vWBTCContractAddress,
              ])
            );
            calldata.push([baseAddressList.wbtcTokenAddress, tempData]);

            tempData = utils.arrayify(
              iFaceToken.encodeFunctionData("balanceOf", [
                baseAddressList.vUSDCContractAddress,
              ])
            );
            calldata.push([baseAddressList.usdcTokenAddress, tempData]);

            tempData = utils.arrayify(
              iFaceToken.encodeFunctionData("balanceOf", [
                baseAddressList.vUSDTContractAddress,
              ])
            );
            calldata.push([baseAddressList.usdtTokenAddress, tempData]);

            tempData = utils.arrayify(
              iFaceToken.encodeFunctionData("balanceOf", [
                baseAddressList.vDaiContractAddress,
              ])
            );
            calldata.push([baseAddressList.daiTokenAddress, tempData]);

            res = await MCcontract.callStatic.aggregate(calldata);
          }

          if (res) {
            if (selectedToken.name === "WETH") {
              const avaibaleETH = check0xHex(res.returnData[0]);
              setAvailableLiq(ceilWithPrecision(formatUnits(avaibaleETH)));
            } else if (selectedToken.name === "WBTC") {
              const avaibaleBTC = check0xHex(res.returnData[1]);
              setAvailableLiq(ceilWithPrecision(formatUnits(avaibaleBTC)));
            } else if (selectedToken.name === "USDC") {
              const avaibaleUSDC = check0xHex(res.returnData[2]);
              setAvailableLiq(ceilWithPrecision(formatUnits(avaibaleUSDC)));
            } else if (selectedToken.name === "USDT") {
              const avaibaleUSDT = check0xHex(res.returnData[3]);
              setAvailableLiq(ceilWithPrecision(formatUnits(avaibaleUSDT)));
            } else if (selectedToken.name === "DAI") {
              const avaibaleDai = check0xHex(res.returnData[4]);
              setAvailableLiq(ceilWithPrecision(formatUnits(avaibaleDai)));
            } else {
              console.error(
                "Something went wrong, token = ",
                selectedToken.name
              );
              setAvailableLiq("-");
            }
          } else {
            setAvailableLiq("-");
          }
        } else {
          setAvailableLiq("-");
        }
      };

      processParams();
    } catch (e) {
      console.error(e);
      setEthPerVeth("-");
      setAvailableLiq("-");
    }
  };

  const getTokenBalance = async (tokenName = selectedToken.name) => {
    try {
      if (account && currentNetwork) {
        const signer = await library?.getSigner();

        if (isSupply) {
          let bal;

          if (tokenName == "WETH") {
            bal = await library?.getBalance(account);
          } else {
            let contract;

            if (currentNetwork.id === ARBITRUM_NETWORK) {
              contract = new Contract(
                arbTokensAddress[tokenName],
                ERC20.abi,
                signer
              );
            } else if (currentNetwork.id === OPTIMISM_NETWORK) {
              contract = new Contract(
                opTokensAddress[tokenName],
                ERC20.abi,
                signer
              );
            } else if (currentNetwork.id === BASE_NETWORK) {
              contract = new Contract(
                baseTokensAddress[tokenName],
                ERC20.abi,
                signer
              );
            }

            if (contract) {
              bal = await contract.balanceOf(account);
            }
          }

          const balInNumber = ceilWithPrecision(
            formatBignumberToUnits(tokenName, bal)
          );
          setCoinBalance(Number(balInNumber));
        } else {
          const fetchValues = async () => {
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

              if (pool.name === "WETH") {
                setCoinBalance(Number(ethBal));
              } else if (pool.name === "WBTC") {
                setCoinBalance(Number(wbtcBal));
              } else if (pool.name === "USDC") {
                setCoinBalance(Number(usdcBal));
              } else if (pool.name === "USDT") {
                setCoinBalance(Number(usdtBal));
              } else if (pool.name === "DAI") {
                setCoinBalance(Number(daiBal));
              }
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

              if (pool.name === "WETH") {
                setCoinBalance(Number(ethBal));
              } else if (pool.name === "WBTC") {
                setCoinBalance(Number(wbtcBal));
              } else if (pool.name === "USDC") {
                setCoinBalance(Number(usdcBal));
              } else if (pool.name === "USDT") {
                setCoinBalance(Number(usdtBal));
              } else if (pool.name === "DAI") {
                setCoinBalance(Number(daiBal));
              }
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

              if (pool.name === "WETH") {
                setCoinBalance(Number(ethBal));
              } else if (pool.name === "WBTC") {
                setCoinBalance(Number(wbtcBal));
              } else if (pool.name === "USDC") {
                setCoinBalance(Number(usdcBal));
              } else if (pool.name === "USDT") {
                setCoinBalance(Number(usdtBal));
              } else if (pool.name === "DAI") {
                setCoinBalance(Number(daiBal));
              }
            }
          };

          fetchValues();
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    getTokenBalance();
  }, [account]);

  useEffect(() => {
    getTokenBalance();
    fetchParams();
    updateAmount("");
  }, [account, selectedToken, currentNetwork, isSupply]);

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

  const updateAmount = async (amt: string | number) => {
    if (amt === "") {
      setAmount("");
      setYouGet(0);
      setExpected(0);
    } else {
      setAmount(String(amt));
      setYouGet(Number(amt) * Number(ethPerVeth));
      const val = await getPriceFromAssetsArray(selectedToken.name);
      setExpected(Number(amt) * Number(val));
    }
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

  const deposit = async () => {
    if (!currentNetwork) return;

    const signer = await library?.getSigner();
    setLoading(true);

    if (currentNetwork.id === ARBITRUM_NETWORK) {
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

            if (amount && amount !== "" && allowance < Number(amount)) {
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

            if (amount && amount !== "" && allowance < Number(amount)) {
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

            if (amount && amount !== "" && allowance < Number(amount)) {
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

            if (amount && amount !== "" && allowance < Number(amount)) {
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
            if (
              amount &&
              amount !== "" &&
              Number(amount) <= (await vEthcontract.balanceOf(account))
            ) {
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
            if (
              amount &&
              amount !== "" &&
              Number(amount) <= (await vBTCcontract.balanceOf(account))
            ) {
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
            if (
              amount &&
              amount !== "" &&
              Number(amount) <= (await vUSDCcontract.balanceOf(account))
            ) {
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
            if (
              amount &&
              amount !== "" &&
              Number(amount) <= (await vUSDTcontract.balanceOf(account))
            ) {
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
            if (
              amount &&
              amount !== "" &&
              Number(amount) <= (await vDaicontract.balanceOf(account))
            ) {
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
            console.error("Something went wrong, Please try again.");
            addNotification("error", "Something went wrong, Please try again.");
            updateAmount("");
            setLoading(false);
            return;
          }
        }

        await sleep(5000);
        addNotification("success", "Transaction Successful!");
      } catch (error) {
        console.error(error);
        addNotification("error", "Something went wrong, Please try again.");
      }
    } else if (currentNetwork.id === OPTIMISM_NETWORK) {
      // value assigne is pending
      try {
        const signer = await library?.getSigner();

        const vEtherContract = new Contract(
          opAddressList.vEtherContractAddress,
          VEther.abi,
          signer
        );
        const vDaiContract = new Contract(
          opAddressList.vDaiContractAddress,
          VToken.abi,
          signer
        );
        const vUsdcContract = new Contract(
          opAddressList.vUSDCContractAddress,
          VToken.abi,
          signer
        );
        const vUsdtContract = new Contract(
          opAddressList.vUSDTContractAddress,
          VToken.abi,
          signer
        );
        const vWbtcContract = new Contract(
          opAddressList.vWBTCContractAddress,
          VToken.abi,
          signer
        );
        const rateModelContract = new Contract(
          opAddressList.rateModelContractAddress,
          DefaultRateModel.abi,
          signer
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

            if (amount && amount !== "" && allowance < Number(amount)) {
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

            if (amount && amount !== "" && allowance < Number(amount)) {
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

            if (amount && amount !== "" && allowance < Number(amount)) {
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

            if (amount && amount !== "" && allowance < Number(amount)) {
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

            if (
              amount &&
              amount !== "" &&
              Number(amount) <= (await vEthcontract.balanceOf(account))
            ) {
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
            if (
              amount &&
              amount !== "" &&
              Number(amount) <= (await vBTCcontract.balanceOf(account))
            ) {
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
            if (
              amount &&
              amount !== "" &&
              Number(amount) <= (await vUSDCcontract.balanceOf(account))
            ) {
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
            if (
              amount &&
              amount !== "" &&
              Number(amount) <= (await vUSDTcontract.balanceOf(account))
            ) {
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
            if (
              amount &&
              amount !== "" &&
              Number(amount) <= (await vDaicontract.balanceOf(account))
            ) {
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
            console.error("Something went wrong, Please try again.");
            addNotification("error", "Something went wrong, Please try again.");
            updateAmount("");
            setLoading(false);
            return;
          }
        }

        await sleep(5000);
        addNotification("success", "Transaction Successful!");
      } catch (error) {
        console.error(error);
        addNotification("error", "Something went wrong, Please try again.");
      }
    } else if (currentNetwork.id === BASE_NETWORK) {
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

            if (amount && amount !== "" && allowance < Number(amount)) {
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

            if (amount && amount !== "" && allowance < Number(amount)) {
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

            if (amount && amount !== "" && allowance < Number(amount)) {
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

            if (amount && amount !== "" && allowance < Number(amount)) {
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

            if (
              amount &&
              amount !== "" &&
              Number(amount) <= (await vEthcontract.balanceOf(account))
            ) {
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
            if (
              amount &&
              amount !== "" &&
              Number(amount) <= (await vBTCcontract.balanceOf(account))
            ) {
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
            if (
              amount &&
              amount !== "" &&
              Number(amount) <= (await vUSDCcontract.balanceOf(account))
            ) {
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
            if (
              amount &&
              amount !== "" &&
              Number(amount) <= (await vUSDTcontract.balanceOf(account))
            ) {
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
            if (
              amount &&
              amount !== "" &&
              Number(amount) <= (await vDaicontract.balanceOf(account))
            ) {
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
            console.error("Something went wrong, Please try again.");
            addNotification("error", "Something went wrong, Please try again.");
            updateAmount("");
            setLoading(false);
            return;
          }
        }

        await sleep(5000);
        addNotification("success", "Transaction Successful!");
      } catch (error) {
        console.error(error);
        addNotification("error", "Something went wrong, Please try again.");
      }
    }

    getTokenBalance();
    fetchParams();
    updateAmount("");
    setLoading(false);
  };

  return (
    <>
      <div className="bg-baseComplementary dark:bg-baseDarkComplementary p-4 rounded-3xl w-full text-baseBlack dark:text-baseWhite">
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
                isSupply ? "bg-white dark:bg-baseDark" : "bg-transparent"
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
                !isSupply ? "bg-white dark:bg-baseDark" : "bg-transparent"
              )}
              onClick={() => handleToggle("withdraw")}
            >
              Withdraw
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-baseDark rounded-lg p-4 mb-4">
          <div className="flex justify-between mb-2">
            <div className="flex flex-col">
              <span className="font-medium text-sm mb-2">
                {isSupply ? "Deposit" : "Withdraw"}
              </span>
              <input
                type="number"
                value={amount}
                onChange={(e) => updateAmount(e.target.value)}
                className="w-full dark:bg-baseDark text-2xl font-bold outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="0"
                min={0}
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
              {formatUSD(expected)}
            </div>
            <div className="text-xs text-neutral-500">
              {ceilWithPrecision(String(coinBalance))}{" "}
              {coinBalance !== undefined
                ? isSupply
                  ? selectedToken.name
                  : "v" + selectedToken.name
                : "-"}
            </div>
          </div>
        </div>

        <div className="flex justify-between mb-4">
          {percentageClickValues.map((percent) => (
            <button
              key={percent}
              onClick={() => handlePercentageClick(percent)}
              className={clsx(
                "w-1/5 h-12 bg-purpleBG-lighter dark:bg-darkPurpleBG-lighter font-semibold text-base rounded-lg"
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
                <Info size={14} />
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
            <span>{ceilWithPrecision(String(youGet))}</span>
          </div>
          <div className="flex justify-between text-sm mb-1">
            <span>
              {isSupply
                ? selectedToken.name + " per " + selectedToken.vToken
                : selectedToken.vToken + " per " + selectedToken.name}
            </span>
            <span>{ceilWithPrecision(ethPerVeth)}</span>
          </div>
          {isSupply && (
            <>
              <div className="flex justify-between text-sm mb-1">
                <span>Current APY</span>
                <span>{currentApy}</span>
              </div>
              {/* <div className="flex justify-between text-sm">
              <span>Points</span>
              <span>{points} Kpts MIle per hour</span>
            </div> */}
            </>
          )}
          {!isSupply && (
            <>
              <div className="flex justify-between text-sm mb-1">
                <span>Available liquidity</span>
                <span>{availableLiq}</span>
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

      <div className="fixed bottom-5 left-5 w-72">
        {notifications.map(({ id, type, message }) => (
          <Notification
            key={id}
            type={type}
            message={message}
            onClose={() => removeNotification(id)}
            duration={3000}
          />
        ))}
      </div>
    </>
  );
};

export default SupplyWithdraw;
