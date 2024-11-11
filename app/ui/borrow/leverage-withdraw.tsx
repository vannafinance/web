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
import { parseEther, parseUnits } from "ethers/lib/utils";
import {
  ceilWithPrecision,
  formatBignumberToUnits,
  sleep,
} from "@/app/lib/helper";
import AccountOverview from "./account-overview";
import CreateSmartAccountModal from "./create-smart-account-model";
import Loader from "../components/loader";
import {
  ARBITRUM_NETWORK,
  BASE_NETWORK,
  OPTIMISM_NETWORK,
  percentageClickValues,
} from "@/app/lib/constants";
import { useNetwork } from "@/app/context/network-context";
import { poolsPlaceholder } from "@/app/lib/static-values";
import axios from "axios";
import { formatUSD } from "@/app/lib/number-format-helper";

const LevrageWithdraw = () => {
  const { account, library } = useWeb3React();
  const { currentNetwork } = useNetwork();

  const [market, setMarket] = useState("ETH");
  const [marketPrice, setMarketPrice] = useState(0.0);
  const [assetsPrice, setAssetsPrice] = useState([]);

  const [loading, setLoading] = useState(false);
  const [disableBtn, setDisableBtn] = useState(true);
  const [btnValue, setBtnValue] = useState("Enter an amount");

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [isLeverage, setIsLeverage] = useState(true);
  const [depositAmount, setDepositAmount] = useState<number | undefined>();
  const [borrowAmount, setBorrowAmount] = useState<number | undefined>();
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
        Number(((depositBalance * percentage) / 100).toFixed(3))
      );
    }
  };

  const handleDepositTokenSelect = (token: PoolTable) => {
    setDepositToken(token);
    getTokenBalance(token);
  };

  const handleBorrowTokenSelect = (token: PoolTable) => {
    setBorrowToken(token);
  };

  const handleMaxClick = () => {
    setBorrowAmount(borrowBalance);
    setLeverageValue(10);
  };

  const handleLeverageChange = (num: number) => {
    if (depositAmount === undefined) {
      setBorrowAmount(undefined);
      return;
    }

    const depositAmountInDollar = getPriceFromAssetsArray(depositToken.name);
    const borrowAmountInDollar = getPriceFromAssetsArray(borrowToken.name);
    const val =
      (depositAmount * depositAmountInDollar * num) / borrowAmountInDollar;

    setBorrowAmount(Number(ceilWithPrecision(String(val))));
    setLeverageValue(num);
  };

  useEffect(() => {
    const tokenName = depositToken ? depositToken.name : "";
    if (
      (depositAmount === undefined && borrowAmount === undefined) ||
      (depositAmount === undefined &&
        borrowAmount !== undefined &&
        borrowAmount <= 0) ||
      (borrowAmount === undefined &&
        depositAmount !== undefined &&
        depositAmount <= 0) ||
      (depositAmount !== undefined &&
        depositAmount <= 0 &&
        borrowAmount !== undefined &&
        borrowAmount <= 0)
    ) {
      setBtnValue("Enter an amount");
      setDisableBtn(true);
    } else if (
      depositBalance &&
      depositAmount &&
      Number(depositBalance) * 1.0 < depositAmount * 1.0
    ) {
      setBtnValue("Insufficient " + tokenName + " balance");
      setDisableBtn(true);
    } else {
      setBtnValue(
        isLeverage
          ? depositAmount && borrowAmount
            ? tokenName === "WETH"
              ? "Deposit & Borrow"
              : "Approve - Deposit & Borrow"
            : !borrowAmount || borrowAmount <= 0
            ? tokenName === "WETH"
              ? "Deposit"
              : "Approve - Deposit"
            : "Borrow"
          : depositAmount && borrowAmount
          ? "Repay & Withdraw"
          : !borrowAmount || borrowAmount <= 0
          ? "Repay"
          : "Withdraw"
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

  const getTokenBalance = async (token = depositToken) => {
    try {
      if (token?.name === undefined) return;

      if (account && currentNetwork) {
        const signer = await library?.getSigner();
        let depositBalance;
        // let borrowBalance;

        if (isLeverage) {
          if (token?.name == "WETH") {
            depositBalance = await library?.getBalance(account);
            // if (activeAccount) {
            //   borrowBalance = await library?.getBalance(activeAccount);
            // }
          } else {
            let contract;
            if (currentNetwork.id === ARBITRUM_NETWORK) {
              contract = new Contract(
                arbTokensAddress[token?.name],
                ERC20.abi,
                signer
              );
            } else if (currentNetwork.id === OPTIMISM_NETWORK) {
              contract = new Contract(
                opTokensAddress[token?.name],
                ERC20.abi,
                signer
              );
            } else if (currentNetwork.id === BASE_NETWORK) {
              contract = new Contract(
                baseTokensAddress[token?.name],
                ERC20.abi,
                signer
              );
            }

            if (contract) {
              depositBalance = await contract.balanceOf(account);
              // if (activeAccount) {
              //   borrowBalance = await contract.balanceOf(activeAccount);
              // }
            }
          }

          const depositBalanceInNumber = formatBignumberToUnits(
            token?.name,
            depositBalance
          );
          // const borrowBalanceInNumber = Number(depositBalanceInNumber) * 10;
          setDepositBalance(
            Number(ceilWithPrecision(String(depositBalanceInNumber)))
          );
          // setBorrowBalance(
          //   Number(ceilWithPrecision(String(borrowBalanceInNumber)))
          // );
        } else {
          if (!currentNetwork) return;

          if (currentNetwork.id === ARBITRUM_NETWORK) {
          } else if (currentNetwork.id === OPTIMISM_NETWORK) {
            let daiContract;
            let wethContract;
            let usdcContract;
            let usdtContract;
            let wbtcContract;
            daiContract = new Contract(
              arbAddressList.daiTokenAddress,
              ERC20.abi,
              signer
            );
            usdcContract = new Contract(
              arbAddressList.usdcTokenAddress,
              ERC20.abi,
              signer
            );
            usdtContract = new Contract(
              arbAddressList.usdtTokenAddress,
              ERC20.abi,
              signer
            );
            wethContract = new Contract(
              arbAddressList.wethTokenAddress,
              ERC20.abi,
              signer
            );
            wbtcContract = new Contract(
              arbAddressList.wbtcTokenAddress,
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

            // @Withdraw balance code
            let accountBalance = await library?.getBalance(account); // here account is active Account
            accountBalance = accountBalance / 1e18;
            let borrowedBalance =
              await vEtherContract.callStatic.getBorrowBalance(activeAccount);
            borrowedBalance = borrowedBalance / 1e18;
            // debt1 = accountBalance - borrowedBalance;
            // USDC
            // accountBalance = erc20conatract(USDC).balanceOf(account);
            // borrowedBalance =
            //   await vUsdcContract.callStatic.getBorrowBalance(activeAccount);

            // TODO: @vatsal add repay balanc in setDepositeBalance();
            console.log("Here at reapy balance")
            let repayBalance; 
            if (token?.name == "WETH") {
              console.log("after If ")
              repayBalance = (await vEtherContract.callStatic.getBorrowBalance(activeAccount))/1e18;
              console.log("repayBalance",repayBalance);

            }
            else if (token?.name == "WBTC") {
              repayBalance = await vWbtcContract.callStatic.getBorrowBalance(activeAccount);
              

            }
            else if (token?.name == "USDC") {
              repayBalance = await vUsdcContract.callStatic.getBorrowBalance(activeAccount);
              console.log("repayBalance",repayBalance);

            }
            else if (token?.name == "USDT") {
              repayBalance = await vUsdtContract.callStatic.getBorrowBalance(activeAccount);

            }
            else if (token?.name == "DAI") {
              repayBalance = await vDaiContract.callStatic.getBorrowBalance(activeAccount);

            }
            // @meet: need to get the precesion data, also deal with 1e18 and 1e6 
            // console.log("with numer ", repayBalance/1e6);
            // console.log("Number(ceilWithPrecision(String(repayBalance/1e18),8))",Number(ceilWithPrecision(String(repayBalance/1e18),8)));
            setDepositBalance(Number(ceilWithPrecision(String(repayBalance),8)));


            // TODO @vatsal: add withdraw balance in setBorrowBalance();
            // task: find the total balance of the account and then subtract the borrowed balance 

            //@MEET : neeed to look at here 
            // fetching the total Balance 
            let ethRepayBalance;
            let btcRepayBalance;
            let usdcRepayBalance;
            let usdtRepayBalance;
            let daiRepaybalance;
            if (borrowToken?.name == "WETH") {
              ethRepayBalance = await vEtherContract.callStatic.getBorrowBalance(activeAccount);
              

            }
            else if (borrowToken?.name == "WBTC") {
              btcRepayBalance = await vWbtcContract.callStatic.getBorrowBalance(activeAccount);
              

            }
            else if (borrowToken?.name == "USDC") {
              usdcRepayBalance = await vUsdcContract.callStatic.getBorrowBalance(activeAccount);

            }
            else if (borrowToken?.name == "USDT") {
              usdtRepayBalance = await vUsdtContract.callStatic.getBorrowBalance(activeAccount);

            }
            else if (borrowToken?.name == "DAI") {
              daiRepaybalance = await vDaiContract.callStatic.getBorrowBalance(activeAccount);

            }
            let totalBalance; 
            if (borrowToken?.name == "WETH") {
              totalBalance = await library?.getBalance(account);
              // also including the WETH balance 
              let contract;
              contract = new Contract(
                opTokensAddress[token?.name],
                ERC20.abi,
                signer
              );
              if (contract) {
                totalBalance += await contract.balanceOf(account);
              }
              borrowedBalance = totalBalance - ethRepayBalance;
              contract = new Contract(
                opTokensAddress[token?.name],
                ERC20.abi,
                signer
              );
              if (contract) {
                totalBalance = await contract.balanceOf(account);
                borrowedBalance = totalBalance - usdcRepayBalance;
              }


            }




            setBorrowBalance(borrowedBalance);
          } else if (currentNetwork.id === BASE_NETWORK) {
          }
        }
      }
    } catch (e) {
      console.error(e);
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
  }, [account, activeAccount, currentNetwork]);

  useEffect(() => {
    const val = getPriceFromAssetsArray(borrowToken.name);
    if (borrowAmount && borrowAmount > 0) {
      setLeverageAmount(
        borrowAmount * (leverageValue < 2 ? 1 : leverageValue) * val
      );
    } else {
      setLeverageAmount(0);
    }
  }, [leverageValue, borrowAmount, borrowToken]);

  const calc = async () => {
    const signer = await library?.getSigner();
    const val = getPriceFromAssetsArray(depositToken.name);
    if (depositAmount !== undefined) {
      setExpected(depositAmount * val);
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
    if (depositAmount !== undefined && borrowAmount !== undefined) {
      healthFactor =
        (balanceInNum +
          depositAmount * depositAmountInDollar +
          borrowAmount * borrowAmountInDollar) /
        (borrowBalanceInNum + borrowAmount * borrowAmountInDollar);
    } else if (depositAmount !== undefined && borrowAmount === undefined) {
      healthFactor =
        (balanceInNum + depositAmount * depositAmountInDollar) /
        borrowBalanceInNum;
    } else if (depositAmount === undefined && borrowAmount !== undefined) {
      healthFactor =
        (balanceInNum + borrowAmount * borrowAmountInDollar) /
        (borrowBalanceInNum + borrowAmount * borrowAmountInDollar);
    } else {
      healthFactor = balanceInNum / borrowBalanceInNum;
    }

    setHealthFactor(ceilWithPrecision(String(healthFactor), 2));


    // TODO @vatsal: 'depositAmount' is the variable which will have current input value entered in Deosit input box. Use it as required and update the above formula to add health Factor

    let leverageUse;
    if (depositAmount !== undefined && borrowAmount !== undefined) {
      leverageUse =
        (borrowBalanceInNum + borrowAmount * borrowAmountInDollar) /
        (balanceInNum +
          depositAmount * depositAmountInDollar +
          borrowAmount * borrowAmountInDollar -
          borrowBalanceInNum +
          borrowAmount * borrowAmountInDollar +
          1);
    } else if (depositAmount !== undefined && borrowAmount === undefined) {
      leverageUse =
        borrowBalanceInNum /
        (balanceInNum +
          depositAmount * depositAmountInDollar -
          borrowBalanceInNum +
          1);
    } else if (depositAmount === undefined && borrowAmount !== undefined) {
      leverageUse =
        (borrowBalanceInNum + borrowAmount * borrowAmountInDollar) /
        (balanceInNum +
          borrowAmount * borrowAmountInDollar -
          borrowBalanceInNum +
          borrowAmount * borrowAmountInDollar +
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
    if (isLeverage && depositAmount !== undefined) {
      const depositAmountInDollar = getPriceFromAssetsArray(depositToken.name);
      const borrowAmountInDollar = getPriceFromAssetsArray(borrowToken.name);
      const val =
        (depositAmount * depositAmountInDollar * 10) / borrowAmountInDollar;
      setBorrowBalance(val);
      setBorrowAmount(val / 10);
    } else {
      setBorrowBalance(0);
      setBorrowAmount(0);
    }
    setLeverageValue(1);
  }, [depositAmount, depositToken, borrowToken]);

  const process = async () => {
    if (isLeverage) {
      if (btnValue === "Deposit") {
        deposit();
      } else if (btnValue === "Borrow") {
        borrow();
      } else {
        deposit();
        borrow();
      }
    } else {
      if (btnValue === "Repay") {
        repay();
      } else if (btnValue === "Withdraw") {
        withdraw();
      } else {
        repay();
        withdraw();
      }
    }
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
        depositAmount === undefined ||
        !activeAccount ||
        !accountManagerContract
      )
        return;
      else if (depositToken?.name === "WETH") {
        await accountManagerContract.depositEth(activeAccount, {
          value: parseEther(String(depositAmount)),
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
        if (allowance < depositAmount) {
          await erc20Contract.approve(
            arbAddressList.accountManagerContractAddress,
            parseUnits(String(depositAmount - allowance), 6),
            { gasLimit: 2300000 }
          );
          await sleep(3000);
        }

        await accountManagerContract.deposit(
          activeAccount,
          arbTokensAddress[depositToken?.name],
          parseUnits(String(depositAmount), 6),
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

        if (allowance < depositAmount) {
          await erc20Contract.approve(
            arbAddressList.accountManagerContractAddress,
            parseEther(String(depositAmount - allowance)),
            { gasLimit: 2300000 }
          );
          await sleep(3000);
        }

        await accountManagerContract.deposit(
          activeAccount,
          arbTokensAddress[depositToken?.name],
          parseEther(String(depositAmount)),
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
        depositAmount === undefined ||
        !activeAccount ||
        !accountManagerContract
      )
        return;
      else if (depositToken?.name === "WETH") {
        await accountManagerContract.depositEth(activeAccount, {
          value: parseEther(String(depositAmount)),
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

        const allowance = await erc20Contract.allowance(
          account,
          opAddressList.accountManagerContractAddress
        );
        if (allowance < depositAmount) {
          await erc20Contract.approve(
            opAddressList.accountManagerContractAddress,
            parseUnits(String(depositAmount - allowance), 6),
            { gasLimit: 2300000 }
          );
          await sleep(3000);
        }

        await accountManagerContract.deposit(
          activeAccount,
          opTokensAddress[depositToken?.name],
          parseUnits(String(depositAmount), 6),
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

        if (allowance < depositAmount) {
          await erc20Contract.approve(
            opAddressList.accountManagerContractAddress,
            parseEther(String(depositAmount - allowance)),
            { gasLimit: 2300000 }
          );
          await sleep(3000);
        }

        await accountManagerContract.deposit(
          activeAccount,
          opTokensAddress[depositToken?.name],
          parseEther(String(depositAmount)),
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
        depositAmount === undefined ||
        !activeAccount ||
        !accountManagerContract
      )
        return;
      else if (depositToken?.name === "WETH") {
        await accountManagerContract.depositEth(activeAccount, {
          value: parseEther(String(depositAmount)),
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
        if (allowance < depositAmount) {
          await erc20Contract.approve(
            baseAddressList.accountManagerContractAddress,
            parseUnits(String(depositAmount - allowance), 6),
            { gasLimit: 2300000 }
          );
          await sleep(3000);
        }

        await accountManagerContract.deposit(
          activeAccount,
          baseTokensAddress[depositToken?.name],
          parseUnits(String(depositAmount), 6),
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

        if (allowance < depositAmount) {
          await erc20Contract.approve(
            baseAddressList.accountManagerContractAddress,
            parseEther(String(depositAmount - allowance)),
            { gasLimit: 2300000 }
          );
          await sleep(3000);
        }

        await accountManagerContract.deposit(
          activeAccount,
          baseTokensAddress[depositToken?.name],
          parseEther(String(depositAmount)),
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
          parseEther(String(borrowAmount)),
          { gasLimit: 2300000 }
        );
      } else if (borrowToken?.name === "USDC" || borrowToken?.name === "USDT") {
        await accountManagerContract.withdraw(
          activeAccount,
          arbTokensAddress[borrowToken?.name],
          parseUnits(String(borrowAmount), 6),
          { gasLimit: 2300000 }
        );
      } else {
        await accountManagerContract.withdraw(
          activeAccount,
          arbTokensAddress[borrowToken?.name],
          parseEther(String(borrowAmount)),
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
        await accountManagerContract.withdrawEth(
          activeAccount,
          parseEther(String(borrowAmount)),
          { gasLimit: 2300000 }
        );
      } else if (borrowToken?.name === "USDC" || borrowToken?.name === "USDT") {
        await accountManagerContract.withdraw(
          activeAccount,
          opTokensAddress[borrowToken?.name],
          parseUnits(String(borrowAmount), 6),
          { gasLimit: 2300000 }
        );
      } else {
        await accountManagerContract.withdraw(
          activeAccount,
          opTokensAddress[borrowToken?.name],
          parseEther(String(borrowAmount)),
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
          parseEther(String(borrowAmount)),
          { gasLimit: 2300000 }
        );
      } else if (borrowToken?.name === "USDC" || borrowToken?.name === "USDT") {
        await accountManagerContract.withdraw(
          activeAccount,
          baseTokensAddress[borrowToken?.name],
          parseUnits(String(borrowAmount), 6),
          { gasLimit: 2300000 }
        );
      } else {
        await accountManagerContract.withdraw(
          activeAccount,
          baseTokensAddress[borrowToken?.name],
          parseEther(String(borrowAmount)),
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
          parseUnits(String(borrowAmount), 6),
          { gasLimit: 2300000 }
        );
      } else {
        await accountManagerContract.borrow(
          activeAccount,
          arbTokensAddress[borrowToken?.name],
          parseEther(String(borrowAmount)),
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
          parseUnits(String(borrowAmount), 6),
          { gasLimit: 2300000 }
        );
      } else {
        await accountManagerContract.borrow(
          activeAccount,
          opTokensAddress[borrowToken?.name],
          parseEther(String(borrowAmount)),
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
          parseUnits(String(borrowAmount), 6),
          { gasLimit: 2300000 }
        );
      } else {
        await accountManagerContract.borrow(
          activeAccount,
          baseTokensAddress[borrowToken?.name],
          parseEther(String(borrowAmount)),
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
          parseUnits(String(depositAmount), 6),
          { gasLimit: 2300000 }
        );
      } else {
        await accountManagerContract.repay(
          activeAccount,
          arbTokensAddress[depositToken?.name],
          parseEther(String(depositAmount)),
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
          parseUnits(String(depositAmount), 6),
          { gasLimit: 2300000 }
        );
      } else {
        await accountManagerContract.repay(
          activeAccount,
          opTokensAddress[depositToken?.name],
          parseEther(String(depositAmount)),
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
          parseUnits(String(depositAmount), 6),
          { gasLimit: 2300000 }
        );
      } else {
        await accountManagerContract.repay(
          activeAccount,
          baseTokensAddress[depositToken?.name],
          parseEther(String(depositAmount)),
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
                    onChange={(e) =>
                      setDepositAmount(
                        e.target.value === ""
                          ? undefined
                          : Number(e.target.value)
                      )
                    }
                    className="w-full dark:bg-baseDark text-2xl font-bold outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="0"
                    min={0}
                  />
                </div>
                <div className="flex">
                  <TokenDropdown
                    onSelect={handleDepositTokenSelect}
                    defaultValue={depositToken}
                  />
                </div>
              </div>
              <div className="mt-2 flex justify-between text-xs text-neutral-500">
                <div>{formatUSD(expected)}</div>
                <div>
                  Balance:{" "}
                  {depositBalance
                    ? ceilWithPrecision(String(depositBalance),5)
                    : depositBalance}{" "}
                  {depositBalance !== undefined ? depositToken?.name : "-"}
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
                    onChange={(e) =>
                      setBorrowAmount(
                        e.target.value === ""
                          ? undefined
                          : Number(e.target.value)
                      )
                    }
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
                      ? ceilWithPrecision(String(borrowBalance))
                      : borrowBalance}{" "}
                    {borrowBalance !== undefined ? borrowToken?.name : "-"}
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
    </div>
  );
};

export default LevrageWithdraw;
