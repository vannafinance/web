"use client";

// import { useNetwork } from "@/app/context/network-context";
import {
  ARBITRUM_NETWORK,
  BASE_NETWORK,
  // ARBITRUM_NETWORK,
  oneMonthTimestampInterval,
  OPTIMISM_NETWORK,
  referralCode,
} from "@/app/lib/constants";
// import { Calculator } from "@phosphor-icons/react";
import { useWeb3React } from "@web3-react/core";
import clsx from "clsx";
import React, { useEffect, useState } from "react";
import FutureDropdown from "./future-dropdown";
import FutureSlider from "./future-slider";
import axios from "axios";
import { formatStringToUnits, sleep } from "@/app/lib/helper";
import { BigNumber, Contract } from "ethers";
import {
  arbAddressList,
  // arbTokensAddress,
  // codeToAsset,
  CollateralAssetCode,
  opAddressList,
} from "@/app/lib/web3-constants";
import AccountManager from "../../abi/vanna/v1/out/AccountManager.sol/AccountManager.json";
import MUX from "../../abi/vanna/v1/out/MUX.sol/MUX.json";
import PerpVault from "../../abi/vanna/v1/out/PerpVault.sol/PerpVault.json";
import ClearingHouse from "../../abi/vanna/v1/out/ClearingHouse.sol/ClearingHouse.json";
// import OptimismFetchPosition from "../../abi/vanna/v1/out/OptimismFetchPosition.sol/OptimismFetchPosition.json";
// import ERC20 from "../../abi/vanna/v1/out/ERC20.sol/ERC20.json";
import Registry from "../../abi/vanna/v1/out/Registry.sol/Registry.json";
// import LiquidityPool from "../../abi/vanna/v1/out/LiquidityPool.sol/LiquidityPool.json";
import { Interface, parseEther } from "ethers/lib/utils";
import { useNetwork } from "@/app/context/network-context";


const PositionOpenClose: React.FC<PositionOpenCloseProps> = ({ market }) => {
  const { account, library } = useWeb3React();
  const { currentNetwork } = useNetwork();

  // const pairOptions: Option[] = [
  //   { value: "ETH/USD", label: "ETH/USD", icon: "/eth-icon.svg" },
  //   { value: "BTC/USD", label: "BTC/USD", icon: "/btc-icon.svg" },
  // ];
  // const protocolOptions: Option[] = [
  //   { value: "MUX", label: "MUX" },
  //   ...(currentNetwork.id === ARBITRUM_NETWORK
  //     ? [{ value: "dYdX", label: "dYdX" }]
  //     : []),
  // ];
  const optionType: Option[] = [
    { value: "Market", label: "Market" },
    { value: "Limit", label: "Limit" },
  ];
  const markOption: Option[] = [{ value: "Mark", label: "Mark" }];
  const tokenOptions: Option[] = [
    { value: "WETH", label: "WETH", icon: "/eth-icon.svg" },
    { value: "WBTC", label: "WBTC", icon: "/btc-icon.svg" },
    { value: "USDC", label: "USDC", icon: "/usdc-icon.svg" },
    { value: "USDT", label: "USDT", icon: "/usdt-icon.svg" },
    { value: "DAI", label: "DAI", icon: "/dai-icon.svg" },
  ];

  const [isOpen, setIsOpen] = useState(true);
  // const [selectedPair, setSelectedPair] = useState<Option>(pairOptions[0]);
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
  const [selectedToken, setSelectedToken] = useState<Option>(tokenOptions[0]);
  // const [amount, setAmount] = useState("");
  const [leverageValue, setLeverageValue] = useState<number>(1);
  const [isEnabled, setIsEnabled] = useState(false);
  const [takeProfit, setTakeProfit] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [collateralAmount, setCollateralAmount] = useState<string | undefined>(
    undefined
  );
  const [assetAmount, setAssetAmount] = useState<string | undefined>(undefined);

  // const [marketPrice, setMarketPrice] = useState(0.0);
  const [assetsPrice, setAssetsPrice] = useState();
  const [activeAccount, setActiveAccount] = useState();
  // const [coinBalance, setCoinBalance] = useState(0); // balance of selectedToken
  const [coin, setCoin] = useState("");
  const [useValue, setUseValue] = useState("");
  const [longValue, setLongValue] = useState("");
  const [coinBalance, setCoinBalance] = useState("");

  const [maxOpen, setMaxOpen] = useState<string | undefined>();
  const [cost, setCost] = useState<string | undefined>();
  const [margin, setMargin] = useState<string | undefined>();
  const [estLiqPrice, setEstLiqPrice] = useState<string | undefined>();

  // TODO: delete below useEffect
  useEffect(() => {
    setUseValue("");
    setLongValue("");
    setCoinBalance("");
    setMaxOpen("");
    setCost("");
    setMargin("");
    setEstLiqPrice("");
  }, []);

  const handleToggle = (value: string) => {
    if ((value === "close" && isOpen) || (value === "open" && !isOpen)) {
      setIsOpen(!isOpen);
    }
  };

  const toggleOptions = () => {
    setIsEnabled(!isEnabled);
  };

  // useEffect(() => {
  //   setSelectedProtocol(protocolOptions[0]);
  // }, [currentNetwork]);

  useEffect(() => {
    setCoin(selectedToken.value);
  }, [selectedToken]);

  useEffect(() => {
    const fetchPrice = async () => {
      await getAssetPrice(market);
    };
    fetchPrice();
  }, [market]);

  const accountCheck = async () => {
    if (localStorage.getItem("isWalletConnected") === "true") {
      if (account && !activeAccount) {
        try {
          const signer = await library?.getSigner();

          const regitstryContract = new Contract(
            arbAddressList.registryContractAddress,
            Registry.abi,
            signer
          );

          const accountsArray = await regitstryContract.accountsOwnedBy(
            account
          );
          let tempAccount;

          if (accountsArray.length > 0) {
            tempAccount = accountsArray[0];
            setActiveAccount(tempAccount);
          }
        } catch (e) {
          console.error(e);
        }
      } else {
        setActiveAccount(undefined);
      }
    }
  };

  useEffect(() => {
    accountCheck();
  }, [account, library]);

  const getAssetPrice = async (
    assetName = market,
    shouldSetMarketPrice = true
  ) => {
    const rsp = await axios.get("https://app.mux.network/api/liquidityAsset", {
      timeout: 10 * 1000,
    });
    const price = getPriceFromAssetsArray(assetName, rsp.data.assets);
    setAssetsPrice(rsp.data.assets);

    if (shouldSetMarketPrice) {
      // setMarketPrice(price);
    }

    return price;
  };

  const getPriceFromAssetsArray = (
    tokenSymbol: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    assets: { [key: string]: any } | undefined = assetsPrice
  ) => {
    tokenSymbol = tokenSymbol === "WETH" ? "ETH" : tokenSymbol;
    if (assets) {
      if (Array.isArray(assets)) {
        for (const asset of assets) {
          if (asset?.symbol === tokenSymbol) {
            return asset.price;
          }
        }
      }
    }
    return null;
  };

  useEffect(() => {
    getAssetPrice();
  }, []);

  useEffect(() => {
    if (collateralAmount) {
      setAssetAmount(String(Number(collateralAmount) * Number(leverageValue)));
    }
  }, [leverageValue]);

  // const getTokenBalance = async (tokenName = coin) => {
  //   try {
  //     if (activeAccount) {
  //       const signer = await library?.getSigner();
  //       let bal = 0;

  //       if (tokenName == "WETH") {
  //         bal = await library?.getBalance(activeAccount);
  //       } else {
  //         const contract = new Contract(
  //           arbTokensAddress[tokenName],
  //           ERC20.abi,
  //           signer
  //         );
  //         bal = await contract.balanceOf(activeAccount);
  //       }

  //       // setCoinBalance(
  //       //   ceilWithPrecision6(formatBignumberToUnits(tokenName, bal))
  //       // );
  //     }
  //   } catch (e) {
  //     console.error(e);
  //   }
  // };

  // useEffect(() => {
  //   getTokenBalance();
  // }, [activeAccount]);

  // const calcPnl = (
  //   currentPrice: number,
  //   entryPrice: number,
  //   size: number,
  //   IsLong: number
  // ) => {
  //   let PNL;
  //   if (IsLong == 1) {
  //     PNL = (currentPrice - entryPrice) * size;
  //   } else {
  //     PNL = (entryPrice - currentPrice) * size;
  //   }
  //   return PNL;
  // };

  // const fetchPositions = async (account: string) => {
  //   if (account) {
  //     // let renderedRows = [];
  //     const signer = await library?.getSigner();
  //     const liquidityPoolContract = new Contract(
  //       arbAddressList.muxLiquidityPoolAddress,
  //       LiquidityPool.abi,
  //       signer
  //     );

  //     // let price = 0;
  //     let subAccountId;

  //     // for (let i = 0; i < 5; i++) {
  //     const i = 3;
  //     for (let j = 3; j < 5; j++) {
  //       for (let k = 0; k < 2; k++) {
  //         subAccountId =
  //           account.toString() +
  //           "0" +
  //           i +
  //           "0" +
  //           j +
  //           "0" +
  //           k +
  //           "000000000000000000";
  //         const result = await liquidityPoolContract.getSubAccount(
  //           subAccountId
  //         );
  //         const size = result.size / 1e18;

  //         if (size != 0) {
  //           const indexPrice = await getAssetPrice(codeToAsset["0" + j], false);
  //           // const netValue = indexPrice * size;
  //           const collateralPrice = result.collateral / 1e18;
  //           const entryPrice = result.entryPrice / 1e18;
  //           // const liquidation =
  //           //   entryPrice - (collateralPrice * entryPrice) / size;
  //           // const pnl = calcPnl(indexPrice, entryPrice, size, k);
  //           // price += pnl;

  //           // let row = {};
  //           // row["market"] = (
  //           //   <>
  //           //     <p style={{ color: "white", fontWeight: "400", fontSize: "14px" }}>ETH/USD</p>
  //           //     <p style={{ color: "white", fontWeight: "400", fontSize: "10px" }}>
  //           //       {k === 1 ? "Long" : "Short"}
  //           //     </p>
  //           //   </>
  //           // );
  //           // row["netValue"] = (
  //           //   <p style={{ color: "white", fontWeight: "400", fontSize: "14px" }}>
  //           //     {formatUSD(netValue)}
  //           //   </p>
  //           // );
  //           // row["collateral"] = (
  //           //   <p style={{ color: "white", fontWeight: "400", fontSize: "14px" }}>
  //           //     {collateralPrice}
  //           //   </p>
  //           // );
  //           // row["entryPrice"] = (
  //           //   <p style={{ color: "white", fontWeight: "400", fontSize: "14px" }}>
  //           //     {formatUSD(entryPrice)}
  //           //   </p>
  //           // );
  //           // row["indexPrice"] = (
  //           //   <p style={{ color: "white", fontWeight: "400", fontSize: "14px" }}>
  //           //     {formatUSD(indexPrice)}
  //           //   </p>
  //           // );
  //           // row["liqPrice"] = (
  //           //   <p style={{ color: "white", fontWeight: "400", fontSize: "14px" }}>
  //           //     {formatUSD(liquidation)}
  //           //   </p>
  //           // );
  //           // row["pnlAndRow"] = (
  //           //   <p style={{ color: "white", fontWeight: "400", fontSize: "14px" }}>
  //           //     {formatUSD(pnl)}
  //           //   </p>
  //           // );
  //           // row["actions"] = (
  //           //   <VuiButton
  //           //     className={"btn-option"}
  //           //     onClick={() => {
  //           //       closePosition(i, j, k, result.size);
  //           //     }}
  //           //   >
  //           //     Close
  //           //   </VuiButton>
  //           // );

  //           // renderedRows.push(row);
  //         }
  //       }
  //       // }
  //     }

  //     // setRows(renderedRows);
  //     // return price;
  //   }
  // };

  const openPosition = async (buySell: string) => {
    try {
      // order type = fixed
      // check if balance have colletral
      if (currentNetwork.id === ARBITRUM_NETWORK) {
        if (activeAccount === undefined) return;
        const longShort = buySell === "buy" ? "01" : "00";
        const subAccountId =
          activeAccount +
          CollateralAssetCode[coin] +
          CollateralAssetCode[market] +
          longShort +
          "000000000000000000";
        const collateralAmountForPosition = BigNumber.from(
          formatStringToUnits(
            coin,
            collateralAmount ? Number(collateralAmount) : 0
          )
        );
        // let units = 18;
        // if (coin == "USDC" || coin == "USDT") {
        //   units = 6;
        // }
        const size = BigNumber.from(
          formatStringToUnits(
            coin,
            collateralAmount ? Number(collateralAmount) : 1 * leverageValue
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
        // const contract = new Contract(arbTokensAddress[coin], ERC20.abi, signer);
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
      }
      else if(currentNetwork.id === OPTIMISM_NETWORK){
        if(!activeAccount || !collateralAmount) return;
          const signer = await library?.getSigner();
    
          const accountManagerContract = new Contract(
            opAddressList.accountManagerContractAddress,
            AccountManager.abi,
            signer
          );
          const depositAmount = BigNumber.from(
            formatStringToUnits("USDC", collateralAmount ? Number(collateralAmount) : 0)
          );
          console.log("depi",depositAmount);
    
          // const positionSize = BigNumber.from(
          //   formatBignumberToUnits(coin, collateralAmount.toString())
          // );
          // const asset = pairIndex[market];
          await accountManagerContract.approve(
            activeAccount,
            opAddressList.usdcTokenAddress,
            opAddressList.vault,
            parseEther("1"),
            { gasLimit: 2300000 }
          );
          
          
         
          
          let Amount = (Number(collateralAmount) * leverageValue); 
          Amount = Amount;
          console.log("Amount",Amount);
          const withSlipedAmount = Number(collateralAmount) - (Number(collateralAmount)*1)/100;
          console.log("withSlipedAmount",withSlipedAmount);
          const  OppositeAmountBound = ((withSlipedAmount * leverageValue/getPriceFromAssetsArray("WETH")));
          const OppositeAmountBoundBN = BigNumber.from(
            formatStringToUnits("WETH", OppositeAmountBound)
          );
          const AmountBN = BigNumber.from(
            formatStringToUnits("WETH", Amount)
          );
          console.log("leverageValue",leverageValue);
          console.log("assetsPrice",AmountBN);
          console.log("collateralAmount",OppositeAmountBoundBN);
          
          const openPositionParams ={
            baseToken :  opAddressList.vETH, // vETH of perp 
            isBaseToQuote : false, //(base: USDC and Quote: ETH)
            isExactInput : true,
            amount : AmountBN,
            oppositeAmountBound : OppositeAmountBoundBN,
            deadline : "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
            sqrtPriceLimitX96 : 0,
            referralCode : "0x0000000000000000000000000000000000000000000000000000000000000000",
          }
          console.log("openPositionParams",openPositionParams);
          const data = [];
          const target = [];
          const iface = new Interface(PerpVault.abi);
          data.push(iface.encodeFunctionData("deposit", [
            opAddressList.usdcTokenAddress,
            depositAmount
          ]));
    
          const iface1 = new Interface(ClearingHouse.abi);
          data.push(iface1.encodeFunctionData("openPosition", [
            openPositionParams
          ]));
          target.push(opAddressList.vault);
          target.push(opAddressList.ClearingHouse);
          await accountManagerContract.exec(
            activeAccount,
            target,
            0,
            data,
            { gasLimit: 2300000 }
          );
    
          await sleep(3000);
          // fetchPositions(activeAccount);
          
        }
      
      else if(currentNetwork.id === BASE_NETWORK){

      }
      await sleep(3000);
      // getTokenBalance();
    } catch (e) {
      console.error(e);
    }
  };
  // const closePosition = async (
  //   assetCode: string,
  //   collateralCode: string,
  //   longShort: string | number,
  //   size: any
  // ) => {
  //   try {
  //     if (activeAccount == undefined) {
  //       return;
  //     }
  //     const subAccountId =
  //       activeAccount +
  //       "0" +
  //       assetCode +
  //       "0" +
  //       collateralCode +
  //       "0" +
  //       longShort +
  //       "000000000000000000";

  //     let collateralAmountForPosition = 0;

  //     // this will changes, temporary static value
  //     const flags = 96;

  //     // fetch transaction -> determine long / short ? -> if long get asset code if short get colletral code
  //     const profitTokenId = longShort == 1 ? collateralCode : 0;

  //     const tsplDeadline =
  //       Math.floor(Date.now() / 1000) + oneMonthTimestampInterval;

  //     const positionOrderExtras = {
  //       tpPrice: 0,
  //       slPrice: 0,
  //       tpslProfitTokenId: profitTokenId,
  //       tpslDeadline: tsplDeadline,
  //     };

  //     let iface = new Interface(MUX.abi);

  //     let encodedData = iface.encodeFunctionData("placePositionOrder3", [
  //       subAccountId,
  //       collateralAmountForPosition,
  //       size,
  //       0,
  //       profitTokenId,
  //       flags,
  //       0,
  //       referralCode,
  //       positionOrderExtras,
  //     ]);

  //     const signer = await library?.getSigner();

  //     const accountManagerContract = new Contract(
  //       arbAddressList.accountManagerContractAddress,
  //       AccountManager.abi,
  //       signer
  //     );

  //     await accountManagerContract.exec(
  //       activeAccount,
  //       arbAddressList.muxFutureContractAddress,
  //       collateralAmountForPosition,
  //       encodedData,
  //       { gasLimit: 2300000 }
  //     );

  //     await sleep(3000);
  //     fetchPositions(activeAccount);
  //     getTokenBalance();
  //   } catch (e) {
  //     console.error(e);
  //   }
  // };

  // useEffect(() => {
  //   const intervalId = setInterval(getAssetPrice, 1000); // Calls fetchData every second
  //   return () => clearInterval(intervalId); // This is the cleanup function
  // }, []);

  return (
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

      {!isOpen && (
        <div className="flex flex-row justify-between mb-2 rounded-xl bg-white dark:bg-baseDark py-2">
          <div className="flex self-stretch pl-2">
            <input
              type="number"
              value={stopUsdcValue}
              onChange={(e) => setStopUsdcValue(e.target.value)}
              className="w-full dark:bg-baseDark text-base outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              placeholder="Stop (USDC)"
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

      <div className="flex flex-col mb-2 rounded-xl bg-white dark:bg-baseDark py-2">
        <div className="mb-3 flex flex-row justify-between px-2 text-xs text-neutral-500">
          <div>Use {useValue ? " : $" + useValue : ""}</div>
          <div>Balance {coinBalance ? " : " + coinBalance : ""}</div>
        </div>
        <div className="flex flex-row justify-between">
          <div className="flex self-stretch pl-2">
            <input
              type="number"
              value={collateralAmount}
              onChange={(e) => setCollateralAmount(e.target.value)}
              className="w-full dark:bg-baseDark text-base outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              placeholder="Enter Amount"
            />
          </div>
          <div className="flex items-center text-base px-2 rounded-xl">
            <FutureDropdown
              options={tokenOptions}
              defaultValue={selectedToken}
              onChange={setSelectedToken}
            />
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="flex flex-col mb-2 rounded-xl bg-white dark:bg-baseDark py-2">
          <div className="mb-3 flex flex-row justify-between px-2">
            <div className="text-xs text-neutral-500">
              Long {longValue ? " : " + longValue : ""}
            </div>
          </div>
          <div className="flex flex-row justify-between">
            <div className="flex self-stretch pl-2">
              <input
                type="number"
                value={assetAmount}
                onChange={(e) => setAssetAmount(e.target.value)}
                className="w-full dark:bg-baseDark text-base outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="Enter Amount"
              />
            </div>
            <div className="flex items-center text-base px-2 rounded-xl">
              <FutureDropdown
                options={tokenOptions}
                defaultValue={selectedToken}
                onChange={setSelectedToken}
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
    </div>
  );
};

export default PositionOpenClose;
