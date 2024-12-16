/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import {
  ARBITRUM_NETWORK,
  BASE_NETWORK,
  OPTIMISM_NETWORK,
  oneMonthTimestampInterval,
  referralCode,
} from "@/app/lib/constants";
// import { Calculator } from "@phosphor-icons/react";
import { useWeb3React } from "@web3-react/core";
import clsx from "clsx";
import React, { useEffect, useState } from "react";
import FutureDropdown from "./future-dropdown";
import FutureSlider from "./future-slider";
import axios from "axios";
import {
  ceilWithPrecision,
  formatBignumberToUnits,
  formatStringToUnits,
  sleep,
} from "@/app/lib/helper";
import { BigNumber, Contract } from "ethers";
import {
  arbAddressList,
  arbTokensAddress,
  baseAddressList,
  baseTokensAddress,
  codeToAsset,
  CollateralAssetCode,
  opAddressList,
  opTokensAddress,
} from "@/app/lib/web3-constants";
import { Interface, parseEther } from "ethers/lib/utils";
import { useNetwork } from "@/app/context/network-context";
import { formatUSD } from "@/app/lib/number-format-helper";
import Notification from "../components/notification";
import Loader from "../components/loader";
import CreateSmartAccountModal from "../components/create-smart-account-model";
import AccountManager from "../../abi/vanna/v1/out/AccountManager.sol/AccountManager.json";
import AccountManagerop from "../../abi/vanna/v1/out/AccountManager-op.sol/AccountManager-op.json";
import MUX from "../../abi/vanna/v1/out/MUX.sol/MUX.json";
import PerpVault from "../../abi/vanna/v1/out/PerpVault.sol/PerpVault.json";
import ClearingHouse from "../../abi/vanna/v1/out/ClearingHouse.sol/ClearingHouse.json";
import ERC20 from "../../abi/vanna/v1/out/ERC20.sol/ERC20.json";
import Registry from "../../abi/vanna/v1/out/Registry.sol/Registry.json";
import Multicall from "../../abi/vanna/v1/out/Multicall.sol/Multicall.json";
import RiskEngine from "../../abi/vanna/v1/out/RiskEngine.sol/RiskEngine.json";
import VEther from "../../abi/vanna/v1/out/VEther.sol/VEther.json";
import VToken from "../../abi/vanna/v1/out/VToken.sol/VToken.json";
import LiquidityPool from "../../abi/vanna/v1/out/LiquidityPool.sol/LiquidityPool.json";
import OptimismFetchPosition from "../../abi/vanna/v1/out/OptimismFetchPosition.sol/OptimismFetchPosition.json";
import AccountManager_op from "../../abi/vanna/v1/out/AccountManager-op.sol/AccountManager-op.json";
import { defaultTokenOptions } from "@/app/lib/static-values";

const PositionOpenClose: React.FC<PositionOpenCloseProps> = ({
  market,
  setMarket,
  marketOption,
  setDataFetching,
}) => {
  const { account, library } = useWeb3React();
  const { currentNetwork } = useNetwork();
  const [notifications, setNotifications] = useState<
    Array<{ id: number; type: NotificationType; message: string }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fetching, setFetching] = useState(false);

  // const protocolOptions: Option[] = [
  //   { value: "MUX", label: "MUX" },
  //   ...(currentNetwork.id === ARBITRUM_NETWORK
  //     ? [{ value: "dYdX", label: "dYdX" }]
  //     : []),
  // ];
  const optionType: Option[] = [
    { value: "Market", label: "Market" },
    // { value: "Limit", label: "Limit" },
  ];
  const markOption: Option[] = [{ value: "Mark", label: "Mark" }];

  const [tokenOptions, setTokenOptions] = useState(defaultTokenOptions);

  const [isOpen, setIsOpen] = useState(true);
  // const [selectedProtocol, setSelectedProtocol] = useState<Option>(
  //   protocolOptions[0]
  // );
  const [selectedOptionType, setSelectedOptionType] = useState<Option>(
    optionType[0]
  );
  const [selectedMarkOption, setSelectedMarkOption] = useState<Option>(
    markOption[0]
  );
  const [stopUsdcValue, setStopUsdcValue] = useState("");
  const [coin, setCoin] = useState<Option>(tokenOptions[0]);
  const [marketToken, setMarketToken] = useState<Option>(marketOption[0]);
  const [leverageValue, setLeverageValue] = useState<number>(1);
  const [isEnabled, setIsEnabled] = useState(false);
  const [takeProfit, setTakeProfit] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [collateralAmount, setCollateralAmount] = useState<string>("");
  const [assetAmount, setAssetAmount] = useState<string>("");

  const [marketPrice, setMarketPrice] = useState(1);
  const [assetsPrice, setAssetsPrice] = useState([]);
  const [activeAccount, setActiveAccount] = useState<string | undefined>(
    undefined
  );
  const [coinBalance, setCoinBalance] = useState(0);
  const [useValue, setUseValue] = useState("0");
  const [longValue, setLongValue] = useState("0");

  const [maxOpen, setMaxOpen] = useState<string | undefined>();
  const [cost, setCost] = useState<string | undefined>();
  const [margin, setMargin] = useState<string | undefined>();
  const [estLiqPrice, setEstLiqPrice] = useState<string | undefined>();

  const handleToggle = (value: string) => {
    if ((value === "close" && isOpen) || (value === "open" && !isOpen)) {
      setIsOpen(!isOpen);
    }
  };

  const toggleOptions = () => {
    setIsEnabled(!isEnabled);
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

  // useEffect(() => {
  //   setSelectedProtocol(protocolOptions[0]);
  // }, [currentNetwork]);

  // const getMarketTokenFromMarketOption = () => {

  // }

  // useEffect(() => {
  //   setMarket(marketToken);
  // }, [marketToken]);

  // useEffect(() => {
  //   setMarketToken(market);
  // }, [market]);

  const accountCheck = async () => {
    setLoading(true);
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

  useEffect(() => {
    accountCheck();
    getAssetPrice();

    const intervalId = setInterval(getAssetPrice, 1000); // Calls fetchData every second
    return () => clearInterval(intervalId); // This is the cleanup function
  }, []);

  useEffect(() => {
    const options =
      currentNetwork && currentNetwork.id === OPTIMISM_NETWORK
        ? isOpen
          ? [{ value: "USDC", label: "USDC", icon: "/usdc-icon.svg" }]
          : [{ value: "WETH", label: "WETH", icon: "/eth-icon.svg" }]
        : defaultTokenOptions;
    setTokenOptions(options);
    setCoin(options[0]);
  }, [currentNetwork, isOpen]);

  useEffect(() => {
    accountCheck();
  }, [account, library, currentNetwork]);

  useEffect(() => {
    accountCheck();
  }, [isModalOpen]);

  const getAssetPrice = async (
    assetName = marketToken.value,
    shouldSetMarketPrice = true
  ) => {
    const rsp = await axios.get("https://app.mux.network/api/liquidityAsset", {
      timeout: 10 * 1000,
    });
    const price = getPriceFromAssetsArray(assetName, rsp.data.assets);
    setAssetsPrice(rsp.data.assets);

    if (shouldSetMarketPrice) {
      setMarketPrice(price);
    }

    return price;
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

  useEffect(() => {
    if (collateralAmount !== "") {
      updateCollateralAmount(collateralAmount);
    }
  }, [leverageValue]);

  const getTokenBalance = async (tokenName = coin.value) => {
    try {
      setCoinBalance(0);

      if (activeAccount && currentNetwork) {
        const signer = await library?.getSigner();

        if (isOpen) {
          let daiContract;
          let wethContract;
          let usdcContract;
          let usdtContract;
          let wbtcContract;
          let vEtherContract;
          let vDaiContract;
          let vUsdcContract;
          let vUsdtContract;
          let vWbtcContract;

          if (currentNetwork.id === ARBITRUM_NETWORK) {
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
            daiContract = new Contract(
              opAddressList.daiTokenAddress,
              ERC20.abi,
              signer
            );
            usdcContract = new Contract(
              opAddressList.usdcTokenAddress,
              ERC20.abi,
              signer
            );
            usdtContract = new Contract(
              opAddressList.usdtTokenAddress,
              ERC20.abi,
              signer
            );
            wethContract = new Contract(
              opAddressList.wethTokenAddress,
              ERC20.abi,
              signer
            );
            wbtcContract = new Contract(
              opAddressList.wbtcTokenAddress,
              ERC20.abi,
              signer
            );
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
          }

          if (
            !daiContract ||
            !wethContract ||
            !usdcContract ||
            !usdtContract ||
            !wbtcContract ||
            !vEtherContract ||
            !vDaiContract ||
            !vUsdcContract ||
            !vUsdtContract ||
            !vWbtcContract
          )
            return;

          let accountBalance;
          if (tokenName === "WETH") {
            accountBalance = (await library?.getBalance(activeAccount)) / 1e18;
            accountBalance +=
              (await wethContract.balanceOf(activeAccount)) / 1e18;
            accountBalance = accountBalance;

            // accountBalance = Number(accountBalance) + Number(waccountBalance);
          } else if (tokenName === "WBTC") {
            accountBalance = await wbtcContract.balanceOf(activeAccount);
            accountBalance = accountBalance / 1e18;
          } else if (tokenName === "USDC") {
            accountBalance = await usdcContract.balanceOf(activeAccount);
            accountBalance = accountBalance / 1e6;
          } else if (tokenName === "USDT") {
            accountBalance = await usdtContract.balanceOf(activeAccount);
            accountBalance = accountBalance / 1e6;
          } else if (tokenName === "DAI") {
            accountBalance = await daiContract.balanceOf(activeAccount);
            accountBalance = accountBalance / 1e18;
          }

          if (accountBalance) {
            setCoinBalance(
              Number(ceilWithPrecision(String(accountBalance), 5))
            );
          }
        } else {
          if (currentNetwork.id === ARBITRUM_NETWORK) {
            const liquidityPoolContract = new Contract(
              arbAddressList.muxLiquidityPoolAddress,
              LiquidityPool.abi,
              signer
            );

            let subAccountId;

            // for (let i = 0; i < 5; i++) {
            const i = 3;
            for (let j = 3; j < 5; j++) {
              for (let k = 0; k < 2; k++) {
                subAccountId =
                  activeAccount.toString() +
                  "0" +
                  i +
                  "0" +
                  j +
                  "0" +
                  k +
                  "000000000000000000";
                const result = await liquidityPoolContract.getSubAccount(
                  subAccountId
                );
                const size = result.size / 1e18;

                if (size != 0) {
                  const indexPrice = await getAssetPrice(codeToAsset["0" + j]);

                  if (indexPrice) {
                    const netValue = indexPrice * size;
                    setCoinBalance(netValue);
                  }
                }
              }
              // }
            }
          } else if (currentNetwork.id === OPTIMISM_NETWORK) {
            const OptimismFetchPositionContract = new Contract(
              opAddressList.optimismFetchPositionContractAddress,
              OptimismFetchPosition.abi,
              signer
            );

            const getNetVal =
              await OptimismFetchPositionContract.getTotalPositionSize(
                activeAccount,
                opAddressList.vETH
              );
            const netValue = getNetVal / 1e18;

            setCoinBalance(Number(ceilWithPrecision(String(netValue), 5)));
          } else if (currentNetwork.id === BASE_NETWORK) {
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    getTokenBalance();
    updateCollateralAmount(collateralAmount);
  }, [activeAccount, coin, currentNetwork, collateralAmount, isOpen]);

  const updateCollateralAmount = (amt: string | number) => {
    if (amt === "") {
      setCollateralAmount("");
      setAssetAmount("");
      setUseValue("0");
      setLongValue("0");
    } else {
      setCollateralAmount(String(amt));
      let price = getPriceFromAssetsArray(coin.value);
      price = price ? price : 1;
      const val = (Number(amt) * leverageValue) / (marketPrice / price);
      setAssetAmount(String(val));
      const useVal = Number(amt) * price;
      setUseValue(ceilWithPrecision(String(useVal)));
      const longVal = val * marketPrice;
      setLongValue(ceilWithPrecision(String(longVal)));
    }
  };

  const updateAssetAmount = (amt: string | number) => {
    if (amt === "") {
      setAssetAmount("");
      setCollateralAmount("");
    } else {
      setAssetAmount(String(amt));
      let price = getPriceFromAssetsArray(coin.value);
      price = price ? price : 1;
      const value = (Number(amt) * (marketPrice / price)) / leverageValue;
      setCollateralAmount(String(value));
    }
  };

  const openPosition = async (buySell: string) => {
    setLoading(true);

    try {
      if (!currentNetwork) return;
      // order type = fixed
      // check if balance have colletral
      if (currentNetwork.id === ARBITRUM_NETWORK) {
        if (activeAccount === undefined) return;
        const longShort = buySell === "buy" ? "01" : "00";
        const subAccountId =
          activeAccount +
          CollateralAssetCode[coin.value] +
          CollateralAssetCode[marketToken.value] +
          longShort +
          "000000000000000000";
        const collateralAmountForPosition = BigNumber.from(
          formatStringToUnits(
            coin.value,
            collateralAmount !== "" ? Number(collateralAmount) : 0
          )
        );
        // let units = 18;
        // if (coin.value == "USDC" || coin.value == "USDT") {
        //   units = 6;
        // }
        const size = BigNumber.from(
          formatStringToUnits(
            coin.value,
            collateralAmount !== ""
              ? Number(collateralAmount)
              : 1 * leverageValue
          )
        );
        // this will changes, temporary static value
        const flags = 192;
        const tsplDeadline =
          Math.floor(Date.now() / 1000) + oneMonthTimestampInterval;
        const signer = await library?.getSigner();
        const accountManagerContract = new Contract(
          arbAddressList.accountManagerContractAddress,
          AccountManager.abi,
          signer
        );
        // const contract = new Contract(arbTokensAddress[coin.value], ERC20.abi, signer);
        // const approveMuxContract = await contract.approve(
        //   arbAddressList .muxFutureContractAddress,
        //   collateralAmountForPosition
        // );
        // await sleep(3000);
        const positionOrderExtras = {
          tpPrice: 0,
          slPrice: 0,
          tpslProfitTokenId: 0,
          tpslDeadline: tsplDeadline,
        };
        const iface = new Interface(MUX.abi);
        const encodedData = iface.encodeFunctionData("placePositionOrder3", [
          subAccountId,
          collateralAmountForPosition,
          size,
          0,
          0,
          flags,
          0,
          referralCode,
          positionOrderExtras,
        ]);
        await accountManagerContract.exec(
          activeAccount,
          arbAddressList.muxFutureContractAddress,
          collateralAmountForPosition,
          encodedData,
          { gasLimit: 2300000 }
        );
      } else if (currentNetwork.id === OPTIMISM_NETWORK) {
        const isBaseToQuote = buySell === "buy" ? false : true;
        const isExactInput = buySell === "buy" ? true : false;
        if (!activeAccount || collateralAmount === "") return;
        const signer = await library?.getSigner();

        const accountManagerContract = new Contract(
          opAddressList.accountManagerContractAddress,
          AccountManagerop.abi,
          signer
        );
        const depositAmount = BigNumber.from(
          formatStringToUnits(
            "USDC",
            collateralAmount === "" ? 0 : Number(collateralAmount)
          )
        );

        // const positionSize = BigNumber.from(
        //   formatBignumberToUnits(coin.value, collateralAmount.toString())
        // );
        // const asset = pairIndex[marketToken];
        await accountManagerContract.approve(
          activeAccount,
          opAddressList.usdcTokenAddress,
          opAddressList.vault,
          parseEther("1"),
          { gasLimit: 2300000 }
        );
        let withSlipedAmount;
        let OppositeAmountBound;
        let OppositeAmountBoundBN;
        let amount;
        if(isBaseToQuote == true){ // for short positon 
          withSlipedAmount =
          Number(collateralAmount);
          OppositeAmountBound =
            (withSlipedAmount * leverageValue) / getPriceFromAssetsArray("WETH");
          OppositeAmountBoundBN = BigNumber.from(
            formatStringToUnits("WETH", OppositeAmountBound + (OppositeAmountBound * 1)/100)
          );
          amount = BigNumber.from(
            formatStringToUnits("WETH", Number(collateralAmount) * leverageValue)
          );
        }
        else { // for long position 
          withSlipedAmount =
          Number(collateralAmount) - (Number(collateralAmount) * 1) / 100;
          OppositeAmountBound =
            (withSlipedAmount * leverageValue) / getPriceFromAssetsArray("WETH");
          OppositeAmountBoundBN = BigNumber.from(
            formatStringToUnits("WETH", OppositeAmountBound)
          );
          amount = BigNumber.from(
            formatStringToUnits("WETH", Number(collateralAmount) * leverageValue)
          );
          
        }
        
         // open short : https://optimistic.etherscan.io/tx/0xfeda6d5bc67be178a0e695dba37f3ba682db664b6eaf33f5110475cd19f30cb5
        //  0	params.baseToken	address	0x8C835DFaA34e2AE61775e80EE29E2c724c6AE2BB
        //  0	params.isBaseToQuote	bool
        //  true
        //  0	params.isExactInput	bool
        //  false
        //  0	params.amount	uint256
        //  5000000000000000000
        //  0	params.oppositeAmountBound	uint256
        //  1389047538637164
        //  0	params.deadline	uint256
        //  115792089237316195423570985008687907853269984665640564039457584007913129639935
        //  0	params.sqrtPriceLimitX96	uint160
        //  0
        //  0	params.referralCode	bytes32

        const openPositionParams = {
          baseToken: opAddressList.vETH, // vETH of perp
          isBaseToQuote: isBaseToQuote, //(base: USDC and Quote: ETH)
          isExactInput: isExactInput,
          amount: amount,
          oppositeAmountBound: OppositeAmountBoundBN,
          deadline:
            "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
          sqrtPriceLimitX96: 0,
          referralCode:
            "0x0000000000000000000000000000000000000000000000000000000000000000",
        };

        const data = [];
        const target = [];
        const iface = new Interface(PerpVault.abi);
        data.push(
          iface.encodeFunctionData("deposit", [
            opAddressList.usdcTokenAddress,
            depositAmount,
          ])
        );

        const iface1 = new Interface(ClearingHouse.abi);
        data.push(
          iface1.encodeFunctionData("openPosition", [openPositionParams])
        );
        target.push(opAddressList.vault);
        target.push(opAddressList.ClearingHouse);
        await accountManagerContract.exec(activeAccount, target, 0, data, {
          gasLimit: 2300000,
        });
      } else if (currentNetwork.id === BASE_NETWORK) {
      }

      await sleep(15000);
      addNotification("success", "Transaction Successful!");
      getTokenBalance();
      setFetching(!fetching);
      setDataFetching(!fetching);
    } catch (e) {
      console.error(e);
      addNotification("error", "Something went wrong, Please try again.");
    }

    updateAssetAmount("");
    setLoading(false);
  };

  const closePosition = async (buySell: string) => {
    setLoading(true);

    try {
      if (!currentNetwork) return;

      const isLong = buySell === "buy";

      if (currentNetwork.id === ARBITRUM_NETWORK) {
        // add code here according to close a long position / short
      } else if (currentNetwork.id === OPTIMISM_NETWORK) {
         // open short : https://optimistic.etherscan.io/tx/0xfeda6d5bc67be178a0e695dba37f3ba682db664b6eaf33f5110475cd19f30cb5
        //  0	params.baseToken	address	0x8C835DFaA34e2AE61775e80EE29E2c724c6AE2BB
        //  0	params.isBaseToQuote	bool
        //  true
        //  0	params.isExactInput	bool
        //  false
        //  0	params.amount	uint256
        //  5000000000000000000
        //  0	params.oppositeAmountBound	uint256
        //  1389047538637164
        //  0	params.deadline	uint256
        //  115792089237316195423570985008687907853269984665640564039457584007913129639935
        //  0	params.sqrtPriceLimitX96	uint160
        //  0
        //  0	params.referralCode	bytes32
         
        const signer = await library?.getSigner();

        const accountManagerOpContract = new Contract(
          opAddressList.accountManagerContractAddress,
          AccountManager_op.abi,
          signer
        );
        const ClearingHouseContract = new Contract(
          opAddressList.ClearingHouse,
          ClearingHouse.abi,
          signer
        );
        const PerpVaultContract = new Contract(
          opAddressList.vault,
          PerpVault.abi,
          signer
        );
        let oppositeAmountBound = Number(
          formatStringToUnits("ETH", Number(collateralAmount))
        );

        const parmas = {
          baseToken: "0x8C835DFaA34e2AE61775e80EE29E2c724c6AE2BB",
          sqrtPriceLimitX96: 0,
          oppositeAmountBound: oppositeAmountBound,
          deadline:
            "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
          referralCode:
            "0x0000000000000000000000000000000000000000000000000000000000000000",
        };

        const data = [];
        const target = [];
        const data1 = [];
        const target1 = [];
        const iface = new Interface(ClearingHouse.abi);
        target.push(opAddressList.ClearingHouse);
        data.push(iface.encodeFunctionData("closePosition", [parmas]));
        const x = await accountManagerOpContract.exec(
          activeAccount,
          target,
          0,
          data,
          { gasLimit: 2300000 }
        );
        addNotification("info", "Please wait until transaction is processing!");
        await sleep(10000);
        await x.wait();

        const withdrawAmount = await PerpVaultContract.getSettlementTokenValue(
          activeAccount
        );

        oppositeAmountBound = withdrawAmount / 1e6;

        oppositeAmountBound = Number(
          formatStringToUnits("USDC", oppositeAmountBound)
        );

        oppositeAmountBound = oppositeAmountBound - 100;

        const iface1 = new Interface(PerpVault.abi);

        target1.push(opAddressList.vault);
        data1.push(
          iface1.encodeFunctionData("withdraw", [
            opAddressList.usdcTokenAddress,
            oppositeAmountBound,
          ])
        );

        // data.push()
        await accountManagerOpContract.exec(activeAccount, target1, 0, data1, {
          gasLimit: 2300000,
        });
      } else if (currentNetwork.id === BASE_NETWORK) {
        // add code here according to close a long position / short
      }

      await sleep(15000);
      addNotification("success", "Transaction Successful!");
      getTokenBalance();
      setFetching(!fetching);
      setDataFetching(!fetching);
    } catch (e) {
      console.error(e);
      addNotification("error", "Something went wrong, Please try again.");
    }

    updateAssetAmount("");
    setLoading(false);
  };

  return (
    <>
      <div className="bg-baseComplementary dark:bg-baseDarkComplementary p-2 pb-6 rounded-3xl w-full text-baseBlack dark:text-baseWhite">
        <div className="flex mb-5 p-1 text-lg">
          <div
            className={clsx(
              "flex-1 p-[1px] rounded-2xl",
              isOpen ? "bg-gradient-to-r from-gradient-1 to-gradient-2" : ""
            )}
          >
            <button
              className={clsx(
                "w-full py-3 px-2 rounded-2xl",
                isOpen ? "bg-white dark:bg-baseDark" : "bg-transparent"
              )}
              onClick={() => handleToggle("open")}
            >
              Open
            </button>
          </div>
          <div
            className={clsx(
              "flex-1 p-[1px] rounded-2xl",
              !isOpen ? "bg-gradient-to-r from-gradient-1 to-gradient-2" : ""
            )}
          >
            <button
              className={clsx(
                "w-full py-3 px-2 rounded-2xl",
                !isOpen ? "bg-white dark:bg-baseDark" : "bg-transparent"
              )}
              onClick={() => handleToggle("close")}
            >
              Close
            </button>
          </div>
        </div>

        <div className="flex mb-5">
          <div className="w-full text-center p-2.5 bg-white dark:bg-baseDark rounded-xl">
            ISOLATED
          </div>
          {isOpen && (
            <div className="w-fit text-center ml-2.5 p-2.5 bg-white dark:bg-baseDark rounded-xl">
              {leverageValue}X
            </div>
          )}
        </div>

        <div className="flex justify-end mb-2">
          {/* <div className="rounded-xl flex flex-col gap-2.5">
          <Calculator size={20} color="#7B44E1" />
          <span className="text-xs text-baseBlack">Avail: 0.00 USD</span>
        </div> */}
          <div className="flex items-center text-base bg-white dark:bg-baseDark px-2 py-2.5 rounded-xl">
            <FutureDropdown
              options={optionType}
              defaultValue={selectedOptionType}
              onChange={setSelectedOptionType}
            />
          </div>
        </div>

        {/* {!isOpen && (
        <div className="flex flex-row justify-between mb-2 rounded-xl bg-white dark:bg-baseDark py-2">
          <div className="flex self-stretch pl-2">
            <input
              type="number"
              value={stopUsdcValue}
              onChange={(e) => setStopUsdcValue(e.target.value)}
              className="w-full dark:bg-baseDark text-base outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              placeholder="Stop (USDC)"
              min={0}
            />
          </div>
          <div className="flex items-center text-base px-2 rounded-xl">
            <FutureDropdown
              options={markOption}
              defaultValue={selectedMarkOption}
              onChange={setSelectedMarkOption}
            />
          </div>
        </div>
      )} */}

        <div className="flex flex-col mb-2 rounded-xl bg-white dark:bg-baseDark py-2">
          <div className="mb-3 flex flex-row justify-between px-2 text-xs text-neutral-500">
            <div>Use : {formatUSD(useValue)}</div>
            <div>
              {coinBalance !== undefined
                ? coinBalance + " " + coin?.label
                : "-"}
            </div>
          </div>
          <div className="flex flex-row justify-between">
            <div className="flex self-stretch pl-2">
              <input
                type="number"
                value={collateralAmount}
                onChange={(e) => updateCollateralAmount(e.target.value)}
                className="w-full dark:bg-baseDark text-base outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="Enter Amount"
                min={0}
              />
            </div>
            <div className="flex items-center text-base px-2 rounded-xl">
              <FutureDropdown
                options={tokenOptions}
                defaultValue={coin}
                onChange={setCoin}
              />
            </div>
          </div>
        </div>

        {isOpen && (
          <div className="flex flex-col mb-2 rounded-xl bg-white dark:bg-baseDark py-2">
            <div className="mb-3 flex flex-row justify-between px-2">
              <div className="text-xs text-neutral-500">
                Long : {longValue !== undefined ? longValue : "-"}
              </div>
            </div>
            <div className="flex flex-row justify-between">
              <div className="flex self-stretch pl-2">
                <input
                  type="number"
                  value={assetAmount}
                  onChange={(e) => updateAssetAmount(e.target.value)}
                  className="w-full dark:bg-baseDark text-base outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="Enter Amount"
                  min={0}
                />
              </div>
              <div className="flex items-center text-base px-2 rounded-xl">
                <FutureDropdown
                  options={marketOption}
                  defaultValue={marketToken}
                  onChange={setMarketToken}
                />
              </div>
            </div>
          </div>
        )}

        {selectedOptionType.value === "Limit" && isOpen && (
          <div className="flex flex-row justify-between mb-5 rounded-xl bg-white dark:bg-baseDark py-2">
            <div className="flex self-stretch pl-2">
              <input
                type="number"
                value={stopUsdcValue}
                onChange={(e) => setStopUsdcValue(e.target.value)}
                className="w-full dark:bg-baseDark text-base outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="Stop (USDC)"
                min={0}
              />
            </div>
            <div className="flex items-center text-base px-2 rounded-xl">
              <FutureDropdown
                options={markOption}
                defaultValue={selectedMarkOption}
                onChange={setSelectedMarkOption}
              />
            </div>
          </div>
        )}

        {isOpen && (
          <>
            <div className="flex justify-between items-center mb-5">
              <FutureSlider value={leverageValue} onChange={setLeverageValue} />
            </div>

            <div>
              <div
                className="flex items-center justify-between mb-1 cursor-pointer"
                onClick={toggleOptions}
              >
                <div className="flex flex-row items-center">
                  <div
                    className={`w-5 h-5 rounded mr-2 flex items-center justify-center ${
                      isEnabled ? "bg-purple" : "bg-neutral-500"
                    }`}
                  >
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  <span
                    className={clsx(
                      "font-normal text-xs",
                      isEnabled
                        ? "text-purple"
                        : "text-baseBlack dark:text-baseWhite"
                    )}
                  >
                    TP/SL
                  </span>
                </div>
                <div>
                  <span className="font-normal text-xs text-purple">
                    Advanced
                  </span>
                </div>
              </div>

              {isEnabled && (
                <div>
                  <div className="flex flex-row justify-between mb-1 rounded-xl bg-white dark:bg-baseDark py-2">
                    <div className="flex self-stretch pl-2">
                      <input
                        type="number"
                        value={takeProfit}
                        onChange={(e) => setTakeProfit(e.target.value)}
                        className="w-full dark:bg-baseDark text-base outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="Take Profit"
                        min={0}
                      />
                    </div>
                    <div className="flex items-center text-base px-2 rounded-xl">
                      <FutureDropdown
                        options={markOption}
                        defaultValue={selectedMarkOption}
                        onChange={setSelectedMarkOption}
                      />
                    </div>
                  </div>
                  <div className="flex flex-row justify-between rounded-xl bg-white dark:bg-baseDark py-2">
                    <div className="flex self-stretch pl-2">
                      <input
                        type="number"
                        value={stopLoss}
                        onChange={(e) => setStopLoss(e.target.value)}
                        className="w-full dark:bg-baseDark text-base outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="Stop Loss"
                        min={0}
                      />
                    </div>
                    <div className="flex items-center text-base px-2 rounded-xl">
                      <FutureDropdown
                        options={markOption}
                        defaultValue={selectedMarkOption}
                        onChange={setSelectedMarkOption}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        <div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-5 mb-4 font-normal text-xs">
            <div className="flex flex-row justify-between items-center">
              <p className="text-neutral-500">Max Open</p>
              <p>{maxOpen != undefined ? maxOpen : "-"}</p>
            </div>
            <div className="flex flex-row justify-between items-center">
              <p className="text-neutral-500">Max Open</p>
              <p>{maxOpen != undefined ? maxOpen : "-"}</p>
            </div>
            <div className="flex flex-row justify-between items-center">
              <p className="text-neutral-500">Cost</p>
              <p>{cost != undefined ? cost : "-"}</p>
            </div>
            <div className="flex flex-row justify-between items-center">
              <p className="text-neutral-500">Cost</p>
              <p>{cost != undefined ? cost : "-"}</p>
            </div>
            <div className="flex flex-row justify-between items-center">
              <p className="text-neutral-500">Margin</p>
              <p>{margin != undefined ? margin : "-"}</p>
            </div>
            <div className="flex flex-row justify-between items-center">
              <p className="text-neutral-500">Margin</p>
              <p>{margin != undefined ? margin : "-"}</p>
            </div>
            <div className="flex flex-row justify-between items-center">
              <p className="text-neutral-500">Est.Liq.Price</p>
              <p>{estLiqPrice != undefined ? estLiqPrice : "-"}</p>
            </div>
            <div className="flex flex-row justify-between items-center">
              <p className="text-neutral-500">Est.Liq.Price</p>
              <p>{estLiqPrice != undefined ? estLiqPrice : "-"}</p>
            </div>
          </div>
        </div>

        {!account && (
          <button className="w-full bg-neutral-500 text-white py-3 rounded-2xl font-semibold text-xl mb-6">
            Connect Wallet
          </button>
        )}
        {account && activeAccount === undefined && !loading && (
          <button
            className="w-full bg-neutral-500 text-white py-3 rounded-2xl font-semibold text-xl mb-6"
            onClick={() => setIsModalOpen(true)}
          >
            Create your Margin Account
          </button>
        )}
        {account && loading && (
          <div className="flex justify-between gap-4">
            <button className="flex-1 bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition-colors flex justify-center">
              <Loader />
            </button>
            <button className="flex-1 bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 transition-colors flex justify-center">
              <Loader />
            </button>
          </div>
        )}
        {account && activeAccount !== undefined && !loading && isOpen && (
          <div className="flex justify-between gap-4">
            <button
              className="flex-1 bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition-colors"
              onClick={() => openPosition("buy")}
            >
              Open Long {<br />} (Buy)
            </button>
            <button
              className="flex-1 bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 transition-colors"
              onClick={() => openPosition("sell")}
            >
              Open Short {<br />} (Sell)
            </button>
          </div>
        )}
        {account && activeAccount !== undefined && !loading && !isOpen && (
          <div className="flex justify-between gap-4">
            <button
              className="flex-1 bg-green-500 text-white py-5 px-4 rounded-md hover:bg-green-600 transition-colors"
              onClick={() => closePosition("buy")}
            >
              Close Long
            </button>
            <button
              className="flex-1 bg-red-500 text-white py-5 px-4 rounded-md hover:bg-red-600 transition-colors"
              onClick={() => closePosition("sell")}
            >
              Close Short
            </button>
          </div>
        )}
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
    </>
  );
};

export default PositionOpenClose;
