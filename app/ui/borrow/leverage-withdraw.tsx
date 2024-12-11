/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useEffect, useState } from "react";
import { Question } from "@phosphor-icons/react";
import clsx from "clsx";
import Tooltip from "../components/tooltip";
import Slider from "./slider";
import TokenDropdown from "../components/token-dropdown";
import { Contract } from "ethers";
import { useWeb3React } from "@web3-react/core";
import {
  arbAddressList,
  arbTokensAddress,
  baseAddressList,
  baseTokensAddress,
  opAddressList,
  opTokensAddress,
} from "@/app/lib/web3-constants";

import AccountManager from "../../abi/vanna/v1/out/AccountManager.sol/AccountManager.json";
import Registry from "../../abi/vanna/v1/out/Registry.sol/Registry.json";
import ERC20 from "../../abi/vanna/v1/out/ERC20.sol/ERC20.json";
import RiskEngine from "../../abi/vanna/v1/out/RiskEngine.sol/RiskEngine.json";
import VEther from "@/app/abi/vanna/v1/out/VEther.sol/VEther.json";
import VToken from "@/app/abi/vanna/v1/out/VToken.sol/VToken.json";
import { formatUnits, parseEther, parseUnits } from "ethers/lib/utils";
import {
  ceilWithPrecision,
  formatBignumberToUnits,
  sleep,
} from "@/app/lib/helper";
import AccountOverview from "./account-overview";
import CreateSmartAccountModal from "../components/create-smart-account-model";
import Loader from "../components/loader";
import {
  ARBITRUM_NETWORK,
  BASE_NETWORK,
  OPTIMISM_NETWORK,
  percentageClickValues,
} from "@/app/lib/constants";
import { useNetwork } from "@/app/context/network-context";
import { ethPoolObj, poolsPlaceholder } from "@/app/lib/static-values";
import axios from "axios";
import { formatUSD } from "@/app/lib/number-format-helper";
import Notification from "../components/notification";

const LevrageWithdraw = () => {
  const { account, library } = useWeb3React();
  const { currentNetwork } = useNetwork();
  const [notifications, setNotifications] = useState<
    Array<{ id: number; type: NotificationType; message: string }>
  >([]);

  const [market, setMarket] = useState("ETH");
  const [marketPrice, setMarketPrice] = useState(0.0);
  const [assetsPrice, setAssetsPrice] = useState([]);

  const [loading, setLoading] = useState(false);
  const [disableBtn, setDisableBtn] = useState(true);
  const [btnValue, setBtnValue] = useState("Enter an amount");

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [isLeverage, setIsLeverage] = useState(true);
  const [depositAmount, setDepositAmount] = useState<string>("");
  const [borrowAmount, setBorrowAmount] = useState<string>("");
  const [leverageValue, setLeverageValue] = useState<number>(1);
  const [expected, setExpected] = useState(0);
  const [leverageAmount, setLeverageAmount] = useState<number | undefined>(0);
  const [depositBalance, setDepositBalance] = useState<number | undefined>(0);
  const [borrowBalance, setBorrowBalance] = useState<number | undefined>(0);
  const [debt, setDebt] = useState(0);
  const [healthFactor, setHealthFactor] = useState("-");
  const [activeAccount, setActiveAccount] = useState<string | undefined>();
  const [ltv, setLtv] = useState(0);

  const [depositToken, setDepositToken] = useState<PoolTable>(
    poolsPlaceholder[0]
  );
  const [borrowToken, setBorrowToken] = useState<PoolTable>(
    poolsPlaceholder[0]
  );

  const balance: string = "1";
  const currentAPY: string = "1";

  const handleToggle = (value: string) => {
    if (
      (value === "withdraw" && isLeverage) ||
      (value === "leverage" && !isLeverage)
    ) {
      setIsLeverage(!isLeverage);
    }
  };

  const handlePercentageClick = (percentage: number) => {
    if (depositBalance) {
      setDepositAmount(
        ceilWithPrecision(String((depositBalance * percentage) / 100))
      );
    }
  };

  const handleDepositTokenSelect = (token: PoolTable) => {
    setDepositToken(token);
    setDepositAmount("");
    setBorrowAmount("");
  };

  const handleBorrowTokenSelect = (token: PoolTable) => {
    setBorrowToken(token);
    setDepositAmount("");
    setBorrowAmount("");
  };

  const handleMaxClick = () => {
    setBorrowAmount(String(borrowBalance));
    setLeverageValue(10);
  };

  const handleLeverageChange = (num: number) => {
    if (depositAmount === "") {
      setBorrowAmount("");
      return;
    }

    const depositAmountInDollar = getPriceFromAssetsArray(depositToken.name);
    const borrowAmountInDollar = getPriceFromAssetsArray(borrowToken.name);
    const val =
      (Number(depositAmount) * depositAmountInDollar * (num - 1)) /
      borrowAmountInDollar;

    setBorrowAmount(ceilWithPrecision(String(val)));
    setLeverageValue(num);
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

  useEffect(() => {
    const tokenName = depositToken ? depositToken.name : "";
    if (
      (depositAmount === "" && borrowAmount === "") ||
      (depositAmount === "" &&
        borrowAmount !== "" &&
        Number(borrowAmount) <= 0) ||
      (borrowAmount === "" &&
        depositAmount !== "" &&
        Number(depositAmount) <= 0) ||
      (depositAmount !== "" &&
        Number(depositAmount) <= 0 &&
        borrowAmount !== "" &&
        Number(borrowAmount) <= 0)
    ) {
      setBtnValue("Enter an amount");
      setDisableBtn(true);
    } else if (
      depositBalance &&
      depositAmount !== "" &&
      Number(depositBalance) * 1.0 < Number(depositAmount) * 1.0
    ) {
      setBtnValue("Insufficient " + tokenName + " balance");
      setDisableBtn(true);
    } else {
      setBtnValue(
        isLeverage
          ? depositAmount !== "" &&
            borrowAmount !== "" &&
            Number(borrowAmount) > 0 &&
            Number(depositAmount) > 0
            ? tokenName === "WETH"
              ? "Deposit & Borrow"
              : "Approve - Deposit & Borrow"
            : borrowAmount !== "" && Number(borrowAmount) > 0
            ? "Borrow"
            : tokenName === "WETH"
            ? "Deposit"
            : "Approve - Deposit"
          : depositAmount !== "" &&
            borrowAmount !== "" &&
            Number(borrowAmount) > 0 &&
            Number(depositAmount) > 0
          ? "Repay & Withdraw"
          : borrowAmount !== "" && Number(borrowAmount) > 0
          ? "Withdraw"
          : "Repay"
      );
      setDisableBtn(false);
    }
  }, [
    depositAmount,
    depositBalance,
    isLeverage,
    borrowAmount,
    depositToken,
    borrowToken,
    leverageValue,
  ]);

  const accountCheck = async () => {
    if (
      localStorage.getItem("isWalletConnected") === "true" &&
      account &&
      currentNetwork
    ) {
      try {
        const signer = await library?.getSigner();

        let regitstryContract;
        if (currentNetwork.id === ARBITRUM_NETWORK) {
          regitstryContract = new Contract(
            arbAddressList.registryContractAddress,
            Registry.abi,
            signer
          );
        } else if (currentNetwork.id === OPTIMISM_NETWORK) {
          regitstryContract = new Contract(
            opAddressList.registryContractAddress,
            Registry.abi,
            signer
          );
        } else if (currentNetwork.id === BASE_NETWORK) {
          regitstryContract = new Contract(
            baseAddressList.registryContractAddress,
            Registry.abi,
            signer
          );
        }
        if (regitstryContract) {
          const accountsArray = await regitstryContract.accountsOwnedBy(
            account
          );
          let tempAccount;
          if (accountsArray.length > 0) {
            tempAccount = accountsArray[0];
            setActiveAccount(tempAccount);
          }
        }
      } catch (e) {
        console.error(e);
        setActiveAccount(undefined);
      }
    } else {
      setActiveAccount(undefined);
    }
    setLoading(false);
  };

  const getTokenBalance = async () => {
    try {
      setDepositBalance(0);
      setBorrowBalance(0);
      if (account && currentNetwork) {
        const signer = await library?.getSigner();
        let depositBalance;

        if (isLeverage) {
          if (depositToken?.name === undefined) return;
          if (depositToken?.name == "ETH") {
            depositBalance = await library?.getBalance(account);
          } else {
            let contract;
            if (currentNetwork.id === ARBITRUM_NETWORK) {
              contract = new Contract(
                arbTokensAddress[depositToken?.name],
                ERC20.abi,
                signer
              );
            } else if (currentNetwork.id === OPTIMISM_NETWORK) {
              contract = new Contract(
                opTokensAddress[depositToken?.name],
                ERC20.abi,
                signer
              );
            } else if (currentNetwork.id === BASE_NETWORK) {
              contract = new Contract(
                baseTokensAddress[depositToken?.name],
                ERC20.abi,
                signer
              );
            }

            if (contract) {
              depositBalance = await contract.balanceOf(account);
            }
          }

          const depositBalanceInNumber = formatBignumberToUnits(
            depositToken?.name,
            depositBalance
          );
          setDepositBalance(
            Number(ceilWithPrecision(String(depositBalanceInNumber)))
          );
          setBorrowBalance(0);
        } else {
          fetchRepayBalance();
          fetchWithdrawBalance();
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRepayBalance = async () => {
    if (!currentNetwork) return;

    const signer = await library?.getSigner();
    if (currentNetwork.id === ARBITRUM_NETWORK) {
    } else if (currentNetwork.id === OPTIMISM_NETWORK) {
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

      let accountBalance = await library?.getBalance(activeAccount);
      accountBalance = accountBalance / 1e18;
      let borrowedBalance = await vEtherContract.callStatic.getBorrowBalance(
        activeAccount
      );
      borrowedBalance = borrowedBalance / 1e18;

      let repayBalance;
      if (depositToken?.name == "ETH") {
        repayBalance =
          (await vEtherContract.callStatic.getBorrowBalance(activeAccount)) /
          1e18;
      } else if (depositToken?.name == "WBTC") {
        repayBalance = await vWbtcContract.callStatic.getBorrowBalance(
          activeAccount
        );
      } else if (depositToken?.name == "USDC") {
        repayBalance = await vUsdcContract.callStatic.getBorrowBalance(
          activeAccount
        );
        repayBalance = repayBalance / 1e6;
      } else if (depositToken?.name == "USDT") {
        repayBalance = await vUsdtContract.callStatic.getBorrowBalance(
          activeAccount
        );
      } else if (depositToken?.name == "DAI") {
        repayBalance = await vDaiContract.callStatic.getBorrowBalance(
          activeAccount
        );
      }
      setDepositBalance(Number(ceilWithPrecision(String(repayBalance), 8)));
    } else if (currentNetwork.id === BASE_NETWORK) {
    }
  };

  const fetchWithdrawBalance = async () => {
    if (!currentNetwork) return;

    const signer = await library?.getSigner();
    if (currentNetwork.id === ARBITRUM_NETWORK) {
    } else if (currentNetwork.id === OPTIMISM_NETWORK) {
      const daiContract = new Contract(
        opAddressList.daiTokenAddress,
        ERC20.abi,
        signer
      );
      const usdcContract = new Contract(
        opAddressList.usdcTokenAddress,
        ERC20.abi,
        signer
      );
      const usdtContract = new Contract(
        opAddressList.usdtTokenAddress,
        ERC20.abi,
        signer
      );
      const wethContract = new Contract(
        opAddressList.wethTokenAddress,
        ERC20.abi,
        signer
      );
      const wbtcContract = new Contract(
        opAddressList.wbtcTokenAddress,
        ERC20.abi,
        signer
      );
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

      let ethRepayBalance;
      let btcRepayBalance;
      let usdcRepayBalance;
      let usdtRepayBalance;
      let daiRepayBalance;
      if (borrowToken?.name == "WETH") {
        ethRepayBalance =
          (await vEtherContract.callStatic.getBorrowBalance(activeAccount)) /
          1e18;
      } else if (borrowToken?.name == "WBTC") {
        btcRepayBalance =
          (await vWbtcContract.callStatic.getBorrowBalance(activeAccount)) /
          1e18;
      } else if (borrowToken?.name == "USDC") {
        usdcRepayBalance =
          (await vUsdcContract.callStatic.getBorrowBalance(activeAccount)) /
          1e18;
      } else if (borrowToken?.name == "USDT") {
        usdtRepayBalance =
          (await vUsdtContract.callStatic.getBorrowBalance(activeAccount)) /
          1e18;
      } else if (borrowToken?.name == "DAI") {
        daiRepayBalance =
          (await vDaiContract.callStatic.getBorrowBalance(activeAccount)) /
          1e18;
      }
      let totalBalance;

      const wethAccounBalance = Number(
        (await wethContract.balanceOf(activeAccount)) / 1e18
      );
      const wbtcAccounBalance =
        (await wbtcContract.balanceOf(activeAccount)) / 1e18;
      const usdcAccounBalance =
        Number(await usdcContract.balanceOf(activeAccount)) / 1e6;
      const usdtAccounBalance =
        (await usdtContract.balanceOf(activeAccount)) / 1e6;
      const daiAccounBalance =
        (await daiContract.balanceOf(activeAccount)) / 1e18;

      if (borrowToken?.name == "WETH" && ethRepayBalance !== undefined) {
        totalBalance = wethAccounBalance - ethRepayBalance;
      } else if (borrowToken?.name == "WBTC" && btcRepayBalance !== undefined) {
        totalBalance = wbtcAccounBalance - btcRepayBalance;
      } else if (
        borrowToken?.name == "USDC" &&
        usdcRepayBalance !== undefined
      ) {
        totalBalance = usdcAccounBalance - usdcRepayBalance;
      } else if (
        borrowToken?.name == "USDT" &&
        usdtRepayBalance !== undefined
      ) {
        totalBalance = usdtAccounBalance - usdtRepayBalance;
      } else if (borrowToken?.name == "DAI" && daiRepayBalance !== undefined) {
        totalBalance = daiAccounBalance - daiRepayBalance;
      }

      setBorrowBalance(totalBalance);
    } else if (currentNetwork.id === BASE_NETWORK) {
    }
  };

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

  const getAssetPrice = async (
    assetName = market,
    shouldSetMarketPrice = true
  ) => {
    const rsp = await axios.get("https://app.mux.network/api/liquidityAsset", {
      timeout: 10 * 1000,
    });
    const price = getPriceFromAssetsArray(assetName, rsp.data.assets);
    setAssetsPrice(rsp.data.assets);

    if (shouldSetMarketPrice && price) {
      setMarketPrice(price);
    }

    return price;
  };

  useEffect(() => {
    const intervalId = setInterval(getAssetPrice, 10000); // Calls fetchData every second
    return () => clearInterval(intervalId); // This is the cleanup function
  }, []);

  useEffect(() => {
    accountCheck();
    getAssetPrice();
  }, []);

  useEffect(() => {
    accountCheck();
  }, [isModalOpen]);

  useEffect(() => {
    accountCheck();
    getTokenBalance();
    calc();
  }, [account, activeAccount, currentNetwork, isLeverage]);

  useEffect(() => {
    getTokenBalance();
  }, [depositToken, borrowToken]);

  useEffect(() => {
    const val = getPriceFromAssetsArray(borrowToken.name);
    if (borrowAmount !== "" && Number(borrowAmount) > 0) {
      setLeverageAmount(Number(borrowAmount) * val);
    } else {
      setLeverageAmount(0);
    }
  }, [leverageValue, borrowAmount, borrowToken]);

  const calc = async () => {
    const signer = await library?.getSigner();
    const val = getPriceFromAssetsArray(depositToken.name);
    if (depositAmount !== "") {
      setExpected(Number(depositAmount) * val);
    } else {
      setExpected(0);
    }

    if (!currentNetwork) return;

    let riskEngineContract;
    if (currentNetwork.id === ARBITRUM_NETWORK) {
      riskEngineContract = new Contract(
        arbAddressList.riskEngineContractAddress,
        RiskEngine.abi,
        signer
      );
    } else if (currentNetwork.id === OPTIMISM_NETWORK) {
      riskEngineContract = new Contract(
        opAddressList.riskEngineContractAddress,
        RiskEngine.abi,
        signer
      );
    } else if (currentNetwork.id === BASE_NETWORK) {
      riskEngineContract = new Contract(
        baseAddressList.riskEngineContractAddress,
        RiskEngine.abi,
        signer
      );
    } else {
      return;
    }

    const balance = await riskEngineContract.callStatic.getBalance(
      activeAccount
    );
    const borrowBalance = await riskEngineContract.callStatic.getBorrows(
      activeAccount
    );

    const depositAmountInDollar = getPriceFromAssetsArray(depositToken.name);
    const borrowAmountInDollar = getPriceFromAssetsArray(borrowToken.name);
    const balanceInNum = Number(balance / 1e16);
    const borrowBalanceInNum = Number(borrowBalance / 1e16);

    let healthFactor;
    if (depositAmount !== "" && borrowAmount !== "") {
      healthFactor =
        (balanceInNum +
          Number(depositAmount) * depositAmountInDollar +
          Number(borrowAmount) * borrowAmountInDollar) /
        (borrowBalanceInNum + Number(borrowAmount) * borrowAmountInDollar);
    } else if (depositAmount !== "" && borrowAmount === "") {
      healthFactor =
        (balanceInNum + Number(depositAmount) * depositAmountInDollar) /
        borrowBalanceInNum;
    } else if (depositAmount === "" && borrowAmount !== "") {
      healthFactor =
        (balanceInNum + Number(borrowAmount) * borrowAmountInDollar) /
        (borrowBalanceInNum + Number(borrowAmount) * borrowAmountInDollar);
    } else {
      healthFactor = balanceInNum / borrowBalanceInNum;
    }

    setHealthFactor(ceilWithPrecision(String(healthFactor), 2));

    // TODO @vatsal: 'depositAmount' is the variable which will have current input value entered in Deosit input box. Use it as required and update the above formula to add health Factor

    let leverageUse;
    if (depositAmount !== "" && borrowAmount !== "") {
      leverageUse =
        (borrowBalanceInNum + Number(borrowAmount) * borrowAmountInDollar) /
        (balanceInNum +
          Number(depositAmount) * depositAmountInDollar +
          Number(borrowAmount) * borrowAmountInDollar -
          borrowBalanceInNum +
          Number(borrowAmount) * borrowAmountInDollar +
          1);
    } else if (depositAmount !== "" && borrowAmount === "") {
      leverageUse =
        borrowBalanceInNum /
        (balanceInNum +
          Number(depositAmount) * depositAmountInDollar -
          borrowBalanceInNum +
          1);
    } else if (depositAmount === "" && borrowAmount !== "") {
      leverageUse =
        (borrowBalanceInNum + Number(borrowAmount) * borrowAmountInDollar) /
        (balanceInNum +
          Number(borrowAmount) * borrowAmountInDollar -
          borrowBalanceInNum +
          Number(borrowAmount) * borrowAmountInDollar +
          1);
    } else {
      leverageUse =
        borrowBalanceInNum / (balanceInNum - borrowBalanceInNum + 1);
    }

    const ltvValue = (leverageUse - 1) * 1e4;
    setLtv(Number(ceilWithPrecision(String(900), 2)));
  };

  useEffect(() => {
    calc();
  }, [depositAmount, depositToken, borrowAmount, borrowToken]);

  useEffect(() => {
    if (isLeverage && depositAmount !== "") {
      const depositAmountInDollar = getPriceFromAssetsArray(depositToken.name);
      const borrowAmountInDollar = getPriceFromAssetsArray(borrowToken.name);
      const val =
        (Number(depositAmount) * depositAmountInDollar * 9) /
        borrowAmountInDollar;
      setBorrowBalance(val);
      setBorrowAmount(ceilWithPrecision(String(0)));
    } else {
      setBorrowBalance(0);
      setBorrowAmount("");
    }
    setLeverageValue(1);
  }, [depositAmount, depositToken, borrowToken]);

  const process = async () => {
    setLoading(true);

    try {
      if (isLeverage) {
        if (btnValue === "Deposit" || btnValue === "Approve - Deposit") {
          await deposit();
        } else if (btnValue === "Borrow") {
          await borrow();
        } else {
          await deposit();
          addNotification(
            "info",
            "Please wait until transaction is processing!"
          );
          await sleep(5000);
          await borrow();
        }
      } else {
        if (btnValue === "Repay") {
          await repay();
        } else if (btnValue === "Withdraw") {
          await withdraw();
        } else {
          await repay();
          addNotification(
            "info",
            "Please wait until transaction is processing!"
          );
          await sleep(5000);
          await withdraw();
        }
      }

      await sleep(5000);
      addNotification("success", "Transaction Successful!");
    } catch (error) {
      console.error(error);
      addNotification("error", "Something went wrong, Please try again.");
    }

    getTokenBalance();
    setDepositAmount("");
    setBorrowAmount("");
    calc();
    setLoading(false);
  };

  const deposit = async () => {
    if (!currentNetwork) return;
    const signer = await library?.getSigner();

    let accountManagerContract;

    if (currentNetwork.id === ARBITRUM_NETWORK) {
      accountManagerContract = new Contract(
        arbAddressList.accountManagerContractAddress,
        AccountManager.abi,
        signer
      );

      if (
        depositToken === undefined ||
        depositAmount === "" ||
        !activeAccount ||
        !accountManagerContract
      )
        return;
      else if (depositToken?.name === "ETH") {
        await accountManagerContract.depositEth(activeAccount, {
          value: parseEther(depositAmount),
          gasLimit: 2300000,
        });
      } else if (
        depositToken?.name === "USDC" ||
        depositToken?.name === "USDT"
      ) {
        const erc20Contract = new Contract(
          arbTokensAddress[depositToken?.name],
          ERC20.abi,
          signer
        );
        // need to add check that is already have allowance or not
        const allowance = await erc20Contract.allowance(
          account,
          arbAddressList.accountManagerContractAddress
        );
        if (allowance < Number(depositAmount)) {
          await erc20Contract.approve(
            arbAddressList.accountManagerContractAddress,
            parseUnits(String(Number(depositAmount) - allowance), 6),
            { gasLimit: 2300000 }
          );
          await sleep(3000);
        }

        await accountManagerContract.deposit(
          activeAccount,
          arbTokensAddress[depositToken?.name],
          parseUnits(depositAmount, 6),
          { gasLimit: 2300000 }
        );
      } else {
        const erc20Contract = new Contract(
          arbTokensAddress[depositToken?.name],
          ERC20.abi,
          signer
        );
        const allowance = await erc20Contract.allowance(
          account,
          arbAddressList.accountManagerContractAddress
        );

        if (allowance < Number(depositAmount)) {
          await erc20Contract.approve(
            arbAddressList.accountManagerContractAddress,
            parseEther(String(Number(depositAmount) - allowance)),
            { gasLimit: 2300000 }
          );
          await sleep(3000);
        }

        await accountManagerContract.deposit(
          activeAccount,
          arbTokensAddress[depositToken?.name],
          parseEther(depositAmount),
          { gasLimit: 2300000 }
        );
      }
    } else if (currentNetwork.id === OPTIMISM_NETWORK) {
      accountManagerContract = new Contract(
        opAddressList.accountManagerContractAddress,
        AccountManager.abi,
        signer
      );
      if (
        depositToken === undefined ||
        depositAmount === "" ||
        !activeAccount ||
        !accountManagerContract
      )
        return;
      else if (depositToken?.name === "ETH") {
        await accountManagerContract.depositEth(activeAccount, {
          value: parseEther(depositAmount),
          gasLimit: 2300000,
        });
      } else if (
        depositToken?.name === "USDC" ||
        depositToken?.name === "USDT"
      ) {
        const erc20Contract = new Contract(
          opTokensAddress[depositToken?.name],
          ERC20.abi,
          signer
        );

        const allowance = formatUnits(
          await erc20Contract.allowance(
            account,
            opAddressList.accountManagerContractAddress
          ),
          6
        );
        if (Number(allowance) < Number(depositAmount)) {
          await erc20Contract.approve(
            opAddressList.accountManagerContractAddress,
            parseUnits(String(Number(depositAmount) - Number(allowance)), 6),
            { gasLimit: 2300000 }
          );
          await sleep(3000);
        }

        await accountManagerContract.deposit(
          activeAccount,
          opTokensAddress[depositToken?.name],
          parseUnits(depositAmount, 6),
          { gasLimit: 2300000 }
        );
      } else {
        const erc20Contract = new Contract(
          opTokensAddress[depositToken?.name],
          ERC20.abi,
          signer
        );
        const allowance = await erc20Contract.allowance(
          account,
          opAddressList.accountManagerContractAddress
        );

        if (allowance < Number(depositAmount)) {
          await erc20Contract.approve(
            opAddressList.accountManagerContractAddress,
            parseEther(String(Number(depositAmount) - allowance)),
            { gasLimit: 2300000 }
          );
          await sleep(3000);
        }

        await accountManagerContract.deposit(
          activeAccount,
          opTokensAddress[depositToken?.name],
          parseEther(depositAmount),
          { gasLimit: 2300000 }
        );
      }
    } else if (currentNetwork.id === BASE_NETWORK) {
      accountManagerContract = new Contract(
        baseAddressList.accountManagerContractAddress,
        AccountManager.abi,
        signer
      );
      if (
        depositToken === undefined ||
        depositAmount === "" ||
        !activeAccount ||
        !accountManagerContract
      )
        return;
      else if (depositToken?.name === "ETH") {
        await accountManagerContract.depositEth(activeAccount, {
          value: parseEther(depositAmount),
          gasLimit: 2300000,
        });
      } else if (
        depositToken?.name === "USDC" ||
        depositToken?.name === "USDT"
      ) {
        const erc20Contract = new Contract(
          baseTokensAddress[depositToken?.name],
          ERC20.abi,
          signer
        );
        // need to add check that is already have allowance or not
        const allowance = await erc20Contract.allowance(
          account,
          baseAddressList.accountManagerContractAddress
        );
        if (allowance < Number(depositAmount)) {
          await erc20Contract.approve(
            baseAddressList.accountManagerContractAddress,
            parseUnits(String(Number(depositAmount) - allowance), 6),
            { gasLimit: 2300000 }
          );
          await sleep(3000);
        }

        await accountManagerContract.deposit(
          activeAccount,
          baseTokensAddress[depositToken?.name],
          parseUnits(depositAmount, 6),
          { gasLimit: 2300000 }
        );
      } else {
        const erc20Contract = new Contract(
          baseTokensAddress[depositToken?.name],
          ERC20.abi,
          signer
        );
        const allowance = await erc20Contract.allowance(
          account,
          baseAddressList.accountManagerContractAddress
        );

        if (allowance < Number(depositAmount)) {
          await erc20Contract.approve(
            baseAddressList.accountManagerContractAddress,
            parseEther(String(Number(depositAmount) - allowance)),
            { gasLimit: 2300000 }
          );
          await sleep(3000);
        }

        await accountManagerContract.deposit(
          activeAccount,
          baseTokensAddress[depositToken?.name],
          parseEther(depositAmount),
          { gasLimit: 2300000 }
        );
      }
    }
  };

  const withdraw = async () => {
    if (!currentNetwork) return;
    const signer = await library?.getSigner();
    let accountManagerContract;
    if (currentNetwork.id === ARBITRUM_NETWORK) {
      accountManagerContract = new Contract(
        arbAddressList.accountManagerContractAddress,
        AccountManager.abi,
        signer
      );
      if (borrowToken?.name === undefined || !accountManagerContract) return;
      else if (borrowToken?.name === "WETH") {
        await accountManagerContract.withdrawEth(
          activeAccount,
          parseEther(borrowAmount),
          { gasLimit: 2300000 }
        );
      } else if (borrowToken?.name === "USDC" || borrowToken?.name === "USDT") {
        await accountManagerContract.withdraw(
          activeAccount,
          arbTokensAddress[borrowToken?.name],
          parseUnits(borrowAmount, 6),
          { gasLimit: 2300000 }
        );
      } else {
        await accountManagerContract.withdraw(
          activeAccount,
          arbTokensAddress[borrowToken?.name],
          parseEther(borrowAmount),
          { gasLimit: 2300000 }
        );
      }
    } else if (currentNetwork.id === OPTIMISM_NETWORK) {
      accountManagerContract = new Contract(
        opAddressList.accountManagerContractAddress,
        AccountManager.abi,
        signer
      );
      if (borrowToken?.name === undefined || !accountManagerContract) return;
      else if (borrowToken?.name === "WETH") {
        await accountManagerContract.withdraw(
          activeAccount,
          opTokensAddress[borrowToken?.name],
          parseEther(borrowAmount),
          { gasLimit: 2300000 }
        );
      } else if (borrowToken?.name === "USDC" || borrowToken?.name === "USDT") {
        await accountManagerContract.withdraw(
          activeAccount,
          opTokensAddress[borrowToken?.name],
          parseUnits(borrowAmount, 6),
          { gasLimit: 2300000 }
        );
      } else {
        await accountManagerContract.withdraw(
          activeAccount,
          opTokensAddress[borrowToken?.name],
          parseEther(borrowAmount),
          { gasLimit: 2300000 }
        );
      }
    } else if (currentNetwork.id === BASE_NETWORK) {
      accountManagerContract = new Contract(
        baseAddressList.accountManagerContractAddress,
        AccountManager.abi,
        signer
      );
      if (borrowToken?.name === undefined || !accountManagerContract) return;
      else if (borrowToken?.name === "WETH") {
        await accountManagerContract.withdrawEth(
          activeAccount,
          parseEther(borrowAmount),
          { gasLimit: 2300000 }
        );
      } else if (borrowToken?.name === "USDC" || borrowToken?.name === "USDT") {
        await accountManagerContract.withdraw(
          activeAccount,
          baseTokensAddress[borrowToken?.name],
          parseUnits(borrowAmount, 6),
          { gasLimit: 2300000 }
        );
      } else {
        await accountManagerContract.withdraw(
          activeAccount,
          baseTokensAddress[borrowToken?.name],
          parseEther(borrowAmount),
          { gasLimit: 2300000 }
        );
      }
    }
  };

  const borrow = async () => {
    if (!currentNetwork) return;
    const signer = await library?.getSigner();
    let accountManagerContract;
    if (currentNetwork.id === ARBITRUM_NETWORK) {
      accountManagerContract = new Contract(
        arbAddressList.accountManagerContractAddress,
        AccountManager.abi,
        signer
      );
      if (borrowToken === undefined || !accountManagerContract) return;
      else if (borrowToken?.name === "USDC" || borrowToken?.name === "USDT") {
        await accountManagerContract.borrow(
          activeAccount,
          arbTokensAddress[borrowToken?.name],
          parseUnits(borrowAmount, 6),
          { gasLimit: 2300000 }
        );
      } else {
        await accountManagerContract.borrow(
          activeAccount,
          arbTokensAddress[borrowToken?.name],
          parseEther(borrowAmount),
          { gasLimit: 2300000 }
        );
      }
    } else if (currentNetwork.id === OPTIMISM_NETWORK) {
      accountManagerContract = new Contract(
        opAddressList.accountManagerContractAddress,
        AccountManager.abi,
        signer
      );
      if (borrowToken === undefined || !accountManagerContract) return;
      else if (borrowToken?.name === "USDC" || borrowToken?.name === "USDT") {
        await accountManagerContract.borrow(
          activeAccount,
          opTokensAddress[borrowToken?.name],
          parseUnits(borrowAmount, 6),
          { gasLimit: 2300000 }
        );
      } else {
        await accountManagerContract.borrow(
          activeAccount,
          opTokensAddress[borrowToken?.name],
          parseEther(borrowAmount),
          { gasLimit: 2300000 }
        );
      }
    } else if (currentNetwork.id === BASE_NETWORK) {
      accountManagerContract = new Contract(
        baseAddressList.accountManagerContractAddress,
        AccountManager.abi,
        signer
      );
      if (borrowToken === undefined || !accountManagerContract) return;
      else if (borrowToken?.name === "USDC" || borrowToken?.name === "USDT") {
        await accountManagerContract.borrow(
          activeAccount,
          baseTokensAddress[borrowToken?.name],
          parseUnits(borrowAmount, 6),
          { gasLimit: 2300000 }
        );
      } else {
        await accountManagerContract.borrow(
          activeAccount,
          baseTokensAddress[borrowToken?.name],
          parseEther(borrowAmount),
          { gasLimit: 2300000 }
        );
      }
    }
  };

  const repay = async () => {
    if (!currentNetwork) return;
    const signer = await library?.getSigner();
    let accountManagerContract;
    if (currentNetwork.id === ARBITRUM_NETWORK) {
      accountManagerContract = new Contract(
        arbAddressList.accountManagerContractAddress,
        AccountManager.abi,
        signer
      );
      if (depositToken === undefined || !accountManagerContract) return;
      else if (depositToken?.name === "USDC" || depositToken?.name === "USDT") {
        await accountManagerContract.repay(
          activeAccount,
          arbTokensAddress[depositToken?.name],
          parseUnits(depositAmount, 6),
          { gasLimit: 2300000 }
        );
      } else {
        await accountManagerContract.repay(
          activeAccount,
          arbTokensAddress[depositToken?.name],
          parseEther(depositAmount),
          { gasLimit: 2300000 }
        );
      }
    } else if (currentNetwork.id === OPTIMISM_NETWORK) {
      accountManagerContract = new Contract(
        opAddressList.accountManagerContractAddress,
        AccountManager.abi,
        signer
      );
      if (depositToken === undefined || !accountManagerContract) return;
      else if (depositToken?.name === "USDC" || depositToken?.name === "USDT") {
        await accountManagerContract.repay(
          activeAccount,
          opTokensAddress[depositToken?.name],
          parseUnits(depositAmount, 6),
          { gasLimit: 2300000 }
        );
      } else {
        await accountManagerContract.repay(
          activeAccount,
          opTokensAddress[depositToken?.name],
          parseEther(depositAmount),
          { gasLimit: 2300000 }
        );
      }
    } else if (currentNetwork.id === BASE_NETWORK) {
      accountManagerContract = new Contract(
        baseAddressList.accountManagerContractAddress,
        AccountManager.abi,
        signer
      );
      if (depositToken === undefined || !accountManagerContract) return;
      else if (depositToken?.name === "USDC" || depositToken?.name === "USDT") {
        await accountManagerContract.repay(
          activeAccount,
          baseTokensAddress[depositToken?.name],
          parseUnits(depositAmount, 6),
          { gasLimit: 2300000 }
        );
      } else {
        await accountManagerContract.repay(
          activeAccount,
          baseTokensAddress[depositToken?.name],
          parseEther(depositAmount),
          { gasLimit: 2300000 }
        );
      }
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-10 text-base text-baseBlack dark:text-baseWhite">
      <div className="w-full mx-auto mb-6">
        <div className="bg-baseComplementary dark:bg-baseDarkComplementary p-2 rounded-3xl w-full">
          <div className="flex mb-8 text-lg">
            <div
              className={clsx(
                "flex-1 p-[1px] rounded-2xl",
                isLeverage
                  ? "bg-gradient-to-r from-gradient-1 to-gradient-2"
                  : ""
              )}
            >
              <button
                className={clsx(
                  "w-full py-3 px-2 rounded-2xl",
                  isLeverage ? "bg-white dark:bg-baseDark" : "bg-transparent"
                )}
                onClick={() => handleToggle("leverage")}
              >
                Leverage
              </button>
            </div>
            <div
              className={clsx(
                "flex-1 p-[1px] rounded-2xl",
                !isLeverage
                  ? "bg-gradient-to-r from-gradient-1 to-gradient-2"
                  : ""
              )}
            >
              <button
                className={clsx(
                  "w-full py-3 px-2 rounded-2xl",
                  !isLeverage ? "bg-white dark:bg-baseDark" : "bg-transparent"
                )}
                onClick={() => handleToggle("withdraw")}
              >
                Withdraw
              </button>
            </div>
          </div>

          <div className="px-4">
            <div className="bg-white dark:bg-baseDark rounded-2xl p-4 mb-3">
              <div className="flex justify-between mb-2">
                <div className="flex flex-col">
                  <span className="font-medium text-sm mb-2">
                    {isLeverage ? "Deposit" : "Repay"}
                  </span>
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="w-full dark:bg-baseDark text-2xl font-bold outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="0"
                    min={0}
                  />
                </div>
                <div className="flex">
                  <TokenDropdown
                    onSelect={handleDepositTokenSelect}
                    defaultValue={depositToken}
                    options={
                      isLeverage
                        ? [ethPoolObj, ...poolsPlaceholder]
                        : poolsPlaceholder
                    }
                  />
                </div>
              </div>
              <div className="mt-2 flex justify-between text-xs text-neutral-500">
                <div>{formatUSD(expected)}</div>
                <div>
                  {depositBalance
                    ? ceilWithPrecision(String(depositBalance), 5) +
                      " " +
                      depositToken?.name
                    : depositBalance}{" "}
                </div>
              </div>
            </div>

            <div className="flex justify-between mb-10">
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

            <div className="bg-white dark:bg-baseDark rounded-2xl p-4 mb-10">
              <div className="flex justify-between mb-2">
                <div className="flex flex-col">
                  <span className="font-medium text-sm mb-2">
                    {isLeverage ? "Borrow" : "Withdraw"}
                  </span>
                  <input
                    type="number"
                    value={borrowAmount}
                    onChange={(e) => setBorrowAmount(e.target.value)}
                    className="w-full dark:bg-baseDark text-2xl font-bold outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="0"
                    min={0}
                  />
                </div>
                <div className="flex">
                  <TokenDropdown
                    onSelect={handleBorrowTokenSelect}
                    defaultValue={borrowToken}
                  />
                </div>
              </div>
              <div className="flex justify-between items-center mt-2 text-xs text-neutral-500">
                <div>{formatUSD(leverageAmount)}</div>
                <div className="flex">
                  <div className="mr-2">
                    {borrowBalance
                      ? ceilWithPrecision(String(borrowBalance), 5) +
                        " " +
                        borrowToken?.name
                      : borrowBalance}{" "}
                  </div>
                  <button
                    className="py-0.5 px-1 bg-gradient-to-r from-gradient-1 to-gradient-2 text-xs rounded-md text-baseWhite"
                    onClick={handleMaxClick}
                  >
                    Max
                  </button>
                </div>
              </div>
            </div>

            {isLeverage && (
              <div className="flex justify-between items-center mb-14">
                <Slider value={leverageValue} onChange={handleLeverageChange} />
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between sm:items-center text-xl mb-8 gap-2 sm:gap-0">
              <div className="flex items-center">
                <span className="mr-1">Health Factor</span>
                <span className="text-baseSuccess-300">
                  &nbsp;<u>{healthFactor !== "-" ? healthFactor : ""}</u>&nbsp;
                </span>
                <Tooltip content={"Target token"}>
                  <Question size={24} color="#2ea88e" weight="fill" />
                </Tooltip>
              </div>
              <div className="flex items-center">
                <span className="font-semibold">LTV &nbsp;{ltv}%</span>
                &nbsp;&nbsp;
                <span className="text-xs text-neutral-500 mr-2 self-end">
                  from 900%
                </span>
              </div>
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
            {account && activeAccount === undefined && !loading && (
              <button
                className="w-full bg-purple text-white py-3 rounded-2xl font-semibold text-xl mb-6"
                onClick={() => setIsModalOpen(true)}
              >
                Create your Margin Account
              </button>
            )}
            {account &&
              activeAccount !== undefined &&
              !loading &&
              disableBtn && (
                <button className="w-full bg-neutral-500 text-white py-3 rounded-2xl font-semibold text-xl mb-6">
                  {btnValue}
                </button>
              )}
            {account &&
              activeAccount !== undefined &&
              !loading &&
              !disableBtn && (
                <button
                  className="w-full bg-purple text-white py-3 rounded-2xl font-semibold text-xl mb-6"
                  onClick={process}
                >
                  {btnValue}
                </button>
              )}
          </div>
        </div>
      </div>
      <div className="flex-none w-full lg:w-2/5 xl:w-1/3 space-y-6 font-medium">
        <AccountOverview
          creditToken={borrowToken}
          activeAccount={activeAccount}
        />
      </div>

      <CreateSmartAccountModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

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
    </div>
  );
};

export default LevrageWithdraw;
