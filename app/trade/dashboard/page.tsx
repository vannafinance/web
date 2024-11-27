"use client";

import OptionPayoffChart from "@/app/ui/dashboard/option-payoff-chart";
import { SimpleTableComponent } from "@/app/ui/dashboard/simple-table";
import { calculateRemainingTime, ceilWithPrecision } from "@/app/lib/helper";
import FutureDropdown from "@/app/ui/future/future-dropdown";
import { CheckSquare, Square } from "@phosphor-icons/react";
import { useNetwork } from "@/app/context/network-context";
import { useWeb3React } from "@web3-react/core";
import { useEffect, useRef, useState } from "react";
import {
  ARBITRUM_NETWORK,
  OPTIMISM_NETWORK,
  BASE_NETWORK,
} from "@/app/lib/constants";
import { formatUSD } from "@/app/lib/number-format-helper";
import {
  arbAddressList,
  opAddressList,
  baseAddressList,
  codeToAsset,
} from "@/app/lib/web3-constants";
import axios from "axios";
import { Contract } from "ethers";
import { formatUnits } from "ethers/lib/utils";
import ClearingHouse from "../../abi/vanna/v1/out/ClearingHouse.sol/ClearingHouse.json";
import ERC20 from "../../abi/vanna/v1/out/ERC20.sol/ERC20.json";
import LiquidityPool from "../../abi/vanna/v1/out/LiquidityPool.sol/LiquidityPool.json";
import OptimismFetchPosition from "../../abi/vanna/v1/out/OptimismFetchPosition.sol/OptimismFetchPosition.json";
import Registry from "../../abi/vanna/v1/out/Registry.sol/Registry.json";
import RiskEngine from "../../abi/vanna/v1/out/RiskEngine.sol/RiskEngine.json";

export default function Page() {
  const { account, library } = useWeb3React();
  const { currentNetwork } = useNetwork();
  const [activeAccount, setActiveAccount] = useState<string | undefined>();

  const pairOptions: Option[] = [
    { value: "ETH", label: "ETH/USD", icon: "/eth-icon.svg" },
    { value: "BTC", label: "BTC/USD", icon: "/btc-icon.svg" },
  ];

  const [userData, setUserData] = useState<UserData>({
    availableBalance: "-",
    marginUsage: "-",
    totalPnl: "-",
    healthFactor: "-",
    borrowRate: "-",
  });

  const expiryOptions: Option[] = [
    { value: "2024-11-15", label: "15 November 2024" },
    { value: "2024-11-22", label: "22 November 2024" },
    { value: "2024-11-29", label: "29 November 2024" },
    { value: "2024-12-27", label: "27 December 2024" },
    { value: "2025-01-31", label: "31 January 2025" },
  ];

  const [optionPositions, setOptionPositions] = useState<OptionPosition[]>([
    // {
    //   id: 1,
    //   selected: true,
    //   strikePrice: 44.0,
    //   cp: "CE",
    //   units: 16000,
    //   traded: 0.5,
    //   price: 0.39,
    //   delta: 0.5,
    //   iv: 43.5,
    // },
    // {
    //   id: 2,
    //   selected: false,
    //   strikePrice: 50.0,
    //   cp: "PE",
    //   units: 16000,
    //   traded: 0.2437,
    //   price: 3.37,
    //   delta: 0.6,
    //   iv: 40.5,
    // },
    // {
    //   id: 3,
    //   selected: false,
    //   strikePrice: 44.0,
    //   cp: "CE",
    //   units: 16000,
    //   traded: 0.5,
    //   price: 7.37,
    //   delta: 0.4,
    //   iv: 40.54,
    // },
    // {
    //   id: 4,
    //   selected: false,
    //   strikePrice: 44.0,
    //   cp: "CE",
    //   units: 16000,
    //   traded: 0.4379,
    //   price: 0.58,
    //   delta: 0.8,
    //   iv: 85.05,
    // },
    // {
    //   id: 5,
    //   selected: false,
    //   strikePrice: 70.0,
    //   cp: "PE",
    //   units: 16000,
    //   traded: 0.7916,
    //   price: 0.39,
    //   delta: 1.0,
    //   iv: 95.5,
    // },
    // {
    //   id: 6,
    //   selected: false,
    //   strikePrice: 83.0,
    //   cp: "CE",
    //   units: 16000,
    //   traded: 0.5,
    //   price: 0.8,
    //   delta: 0.2,
    //   iv: 43.5,
    // },
  ]);

  const [futuresPositions, setFuturesPositions] = useState<FuturePosition[]>([
    // {
    //   id: 1,
    //   selected: true,
    //   marketPrice: 0.0,
    //   entryPrice: 0.0,
    //   size: 0.0,
    //   leverage: 0.0,
    //   liqPrice: 0.0,
    //   delta: 0.5,
    //   pnl: 0.0,
    // },
    // {
    //   id: 2,
    //   selected: false,
    //   marketPrice: 0.0,
    //   entryPrice: 0.0,
    //   size: 0.0,
    //   leverage: 0.0,
    //   liqPrice: 0.0,
    //   delta: 0.6,
    //   pnl: 0.0,
    // },
    // {
    //   id: 3,
    //   selected: false,
    //   marketPrice: 0.0,
    //   entryPrice: 0.0,
    //   size: 0.0,
    //   leverage: 0.0,
    //   liqPrice: 0.0,
    //   delta: 0.4,
    //   pnl: 0.0,
    // },
    // {
    //   id: 4,
    //   selected: false,
    //   marketPrice: 0.0,
    //   entryPrice: 0.0,
    //   size: 0.0,
    //   leverage: 0.0,
    //   liqPrice: 0.0,
    //   delta: 0.8,
    //   pnl: 0.0,
    // },
    // {
    //   id: 5,
    //   selected: false,
    //   marketPrice: 0.0,
    //   entryPrice: 0.0,
    //   size: 0.0,
    //   leverage: 0.0,
    //   liqPrice: 0.0,
    //   delta: 1.0,
    //   pnl: 0.0,
    // },
    // {
    //   id: 6,
    //   selected: false,
    //   marketPrice: 0.0,
    //   entryPrice: 0.0,
    //   size: 0.0,
    //   leverage: 0.0,
    //   liqPrice: 0.0,
    //   delta: 0.2,
    //   pnl: 0.0,
    // },
  ]);

  const [portfolioSummary, setPortfolioSummary] = useState({
    future: "-",
    premium: "-",
    option: "-",
    grossPnl: "-",
    netBal: "-",
    theta: "-",
    vega: "-",
    gamma: "-",
  });

  const [options, setOptions] = useState({
    delta: { call: "$0.00", put: "$0.00", total: "$0.00" },
    theta: { call: "$0.00", put: "$0.00", total: "$0.00" },
    vega: { call: "$0.00", put: "$0.00", total: "$0.00" },
    gamma: { call: "$0.00", put: "$0.00", total: "$0.00" },
    long: { call: "$0.00", put: "$0.00", total: "$0.00" },
    short: { call: "$0.00", put: "$0.00", total: "$0.00" },
    net: { call: "$0.00", put: "$0.00", total: "$0.00" },
  });

  const [futures, setFutures] = useState({
    prevBal: { equity: "$0.00", future: "$0.00", average: "$0.00" },
    todays: { equity: "$0.00", future: "$0.00", average: "$0.00" },
    net: { equity: "$0.00", future: "$0.00", average: "$0.00" },
    traded: { equity: "$0.00", future: "$0.00", average: "$0.00" },
  });

  const handleOptionPositionSelect = (id: number) => {
    setOptionPositions(
      optionPositions.map((position) =>
        position.id === id
          ? { ...position, selected: !position.selected }
          : position
      )
    );
  };

  const handleFuturePositionSelect = (id: number) => {
    setFuturesPositions((positions) =>
      positions.map((position) =>
        position.id === id
          ? { ...position, selected: !position.selected }
          : position
      )
    );
  };

  const [selectedPair, setSelectedPair] = useState<Option>(pairOptions[0]);
  const selectedPairRef = useRef(selectedPair);
  const [marketPrice, setMarketPrice] = useState<number>(1);

  const [selectedExpiry, setSelectedExpiry] = useState<Option>(
    expiryOptions[4]
  );

  const today = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const accountCheck = async () => {
    if (
      localStorage.getItem("isWalletConnected") === "true" &&
      account &&
      currentNetwork
    ) {
      try {
        const signer = await library?.getSigner();

        let registryContract;
        if (currentNetwork.id === ARBITRUM_NETWORK) {
          registryContract = new Contract(
            arbAddressList.registryContractAddress,
            Registry.abi,
            signer
          );
        } else if (currentNetwork.id === OPTIMISM_NETWORK) {
          registryContract = new Contract(
            opAddressList.registryContractAddress,
            Registry.abi,
            signer
          );
        } else if (currentNetwork.id === BASE_NETWORK) {
          registryContract = new Contract(
            baseAddressList.registryContractAddress,
            Registry.abi,
            signer
          );
        }

        if (registryContract) {
          const accountsArray = await registryContract.accountsOwnedBy(account);
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
  };

  useEffect(() => {
    accountCheck();
  }, []);

  useEffect(() => {
    accountCheck();
  }, [account, library, currentNetwork]);

  useEffect(() => {
    // TODO: @vatsal add code here to get availableBalance, marginUsage, totalPnl, healthFactor, borrowRate in trade -> dashboard page
  }, []);

  useEffect(() => {
    selectedPairRef.current = selectedPair;
  }, [selectedPair]);

  useEffect(() => {
    const intervalId = setInterval(getAssetPrice, 1000); // Calls fetchData every second
    return () => clearInterval(intervalId); // This is the cleanup function
  }, []);

  const getPriceFromAssetsArray = (
    tokenSymbol: string,
    assets: MuxPriceFetchingResponseObject[]
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

  const getAssetPrice = async (assetName = selectedPairRef.current.value) => {
    const rsp = await axios.get("https://app.mux.network/api/liquidityAsset", {
      timeout: 10 * 1000,
    });

    const price = getPriceFromAssetsArray(assetName, rsp.data.assets);
    setMarketPrice(price);

    return price;
  };

  const calcPnl = (
    currentPrice: number,
    entryPrice: number,
    size: number,
    IsLong: number
  ) => {
    let PNL;
    if (IsLong == 1) {
      PNL = (currentPrice - entryPrice) * size;
    } else {
      PNL = (entryPrice - currentPrice) * size;
    }
    return PNL;
  };

  const fetchFuturePositions = async () => {
    if (!currentNetwork) return;

    let deltaCall = 0;
    let deltaPut = 0;
    let collateralSum = 0;

    // let collateralSumString;
    let deltaCallString;
    let deltaPutString;
    let deltaTotalString;
    let netBalanceString;
    let availaleBalanceString;
    let todayAverageString;
    let currhealthFactor;

    let riskEngineContract;
    let WETHContract;

    if (activeAccount) {
      if (currentNetwork.id === ARBITRUM_NETWORK) {
        const renderedRows: FuturePosition[] = [];
        const signer = await library?.getSigner();
        const liquidityPoolContract = new Contract(
          arbAddressList.muxLiquidityPoolAddress,
          LiquidityPool.abi,
          signer
        );

        // let price = 0;
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
              const indexPrice = await getAssetPrice(
                codeToAsset["0" + j]
                // false
              );
              if (indexPrice) {
                const netValue = indexPrice * size;
                const collateralPrice = result.collateral / 1e18;
                const entryPrice = result.entryPrice / 1e18;
                const liquidation =
                  entryPrice - (collateralPrice * entryPrice) / size;
                const pnl = calcPnl(indexPrice, entryPrice, size, k);
                // price += pnl;

                const row: FuturePosition = {
                  id: j + k,
                  selected: false,
                  marketPrice: "",
                  entryPrice: "",
                  size: "",
                  leverage: "",
                  liqPrice: "",
                  delta: "",
                  pnl: "",
                };

                row["marketPrice"] = formatUSD(indexPrice);
                row["entryPrice"] = formatUSD(entryPrice);
                row["size"] = formatUSD(netValue);
                row["leverage"] = ceilWithPrecision(String(netValue / collateralPrice));
                row["liqPrice"] = formatUSD(liquidation);
                row["delta"] = k === 1 ? "1" : "-1";
                row["pnl"] = formatUSD(pnl);

                if (k === 1) {
                  deltaCall += pnl;
                } else {
                  deltaPut += pnl;
                }
                collateralSum += collateralPrice;

                renderedRows.push(row);
              }
            }
          }
          // }
        }

        setFuturesPositions(renderedRows);

        riskEngineContract = new Contract(
          arbAddressList.riskEngineContractAddress,
          RiskEngine.abi,
          signer
        );
        WETHContract = new Contract(
          arbAddressList.wethTokenAddress,
          ERC20.abi,
          library
        );
      } else if (currentNetwork.id === OPTIMISM_NETWORK) {
        const renderedRows: FuturePosition[] = [];
        const signer = await library?.getSigner();

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

        if (netValue != 0) {
          const getETHMarketPrice =
            await OptimismFetchPositionContract.getMarkPrice(
              opAddressList.vETH
            );
          const indexPrice = getETHMarketPrice / 1e18;

          const getTotalPositionValue =
            await OptimismFetchPositionContract.getTotalPositionValue(
              activeAccount,
              opAddressList.vETH
            );
          const totalPositionValue = ceilWithPrecision(String(getTotalPositionValue / 1e18));

          const getPnlResult =
            await OptimismFetchPositionContract.getPnlAndPendingFee(
              activeAccount
            );
          const pnl = String(getPnlResult[1] / 1e18);

          const ClearingHouseContract = new Contract(
            opAddressList.ClearingHouse,
            ClearingHouse.abi,
            signer
          );
          const getCollateral = await ClearingHouseContract.getAccountValue(
            activeAccount
          );
          const collateralPrice = ceilWithPrecision(String(getCollateral / 1e18));
          // const collateralPriceInUSDC = ceilWithPrecision(collateralPrice * indexPrice);
          const leverage = Number(totalPositionValue)/ Number(collateralPrice);
          const row: FuturePosition = {
            id: 0,
            selected: false,
            marketPrice: "",
            entryPrice: "",
            size: "",
            leverage: "",
            liqPrice: "",
            delta: "",
            pnl: "",
          };
          let isLong;
          if(netValue > 0 ) {
            isLong = 1;
          }
          else {
            isLong = -1;
          }
          const entryPrice =  indexPrice - (Number(pnl)/netValue);
          const liquidation = ((netValue * entryPrice) - Number(collateralPrice))/ netValue;
          // row["isLong"] = false; // TODO: @vatsal add logic here for long / short

          row["marketPrice"] = formatUSD(indexPrice);
          row["entryPrice"] = formatUSD(entryPrice);
          row["size"] = ceilWithPrecision(String(netValue),5);
          row["leverage"] = ceilWithPrecision(String(leverage));
          row["liqPrice"] = formatUSD(liquidation);
          row["delta"] = ceilWithPrecision(String(isLong)); // add logic here if long then 1 if short then -1
          row["pnl"] = formatUSD(pnl);

          // if () { // add logic here to know if it's long / short
          //   deltaCall += pnl;
          // } else {
          //   deltaPut += pnl;
          // }
          collateralSum += Number(collateralPrice);

          renderedRows.push(row);

          riskEngineContract = new Contract(
            opAddressList.riskEngineContractAddress,
            RiskEngine.abi,
            signer
          );
          WETHContract = new Contract(
            opAddressList.wethTokenAddress,
            ERC20.abi,
            library
          );

          setFuturesPositions(renderedRows);
        }
      } else if (currentNetwork.id === BASE_NETWORK) {
      }

      if (riskEngineContract === undefined || WETHContract === undefined)
        return;

      let balance = await riskEngineContract.callStatic.getBalance(
        activeAccount
      );
      balance = balance / 1e18;
      let borrowBalance = await riskEngineContract.callStatic.getBorrows(
        activeAccount
      );
      borrowBalance = borrowBalance / 1e18;
      currhealthFactor = balance / borrowBalance;

      const currentEthPrice = await getAssetPrice("ETH");
      const bal = formatUnits(await WETHContract.balanceOf(activeAccount));
      const availaleBalance = Number(bal) * currentEthPrice;

      const deltaTotal = deltaCall + deltaPut;
      const netBalance = deltaTotal + availaleBalance;

      const collateralLoss = deltaTotal / currentEthPrice;
      const finalCollateral = collateralSum - collateralLoss;
      const todayAverage = (currentEthPrice * finalCollateral) / collateralSum;

      // collateralSumString = ceilWithPrecision(String(collateralSum), 6);
      deltaCallString = ceilWithPrecision(String(deltaCall));
      deltaPutString = ceilWithPrecision(String(deltaPut));
      deltaTotalString = ceilWithPrecision(String(deltaTotal));
      netBalanceString = ceilWithPrecision(String(netBalance));
      availaleBalanceString = ceilWithPrecision(String(availaleBalance));
      todayAverageString = isNaN(todayAverage)
        ? 0
        : ceilWithPrecision(String(todayAverage));

      // header params
      // collateralSumString // we were fetching this earlier, do we need ?
      const currentUserData = userData;
      currentUserData["availableBalance"] = formatUSD(availaleBalanceString); // check if this is correct value we are assigning, same we are assigning below as well. Check all instances ?
      currentUserData["healthFactor"] = ceilWithPrecision(
        String(currhealthFactor)
      );
      // --------------------------------

      // TODO: @vatsal add code here to fetch margin usage, total pnl & borrow rate and assign it to below
      // currentUserData["marginUsage"] = ;
      // currentUserData["totalPnl"] = ;
      // currentUserData["borrowRate"] = ;

      // -----------------------------
      setUserData(currentUserData);

      // option data from below onwards
      const currentOptions = options;
      currentOptions["delta"]["call"] = formatUSD(deltaCallString);
      currentOptions["delta"]["put"] = formatUSD(deltaPutString);
      currentOptions["delta"]["total"] = formatUSD(deltaTotalString);
      currentOptions["long"]["call"] = formatUSD(deltaCallString);
      currentOptions["long"]["total"] = formatUSD(deltaCallString);
      currentOptions["short"]["put"] = formatUSD(deltaPutString);
      currentOptions["short"]["total"] = formatUSD(deltaPutString);
      currentOptions["net"]["call"] = formatUSD(deltaCallString);
      currentOptions["net"]["put"] = formatUSD(deltaPutString);
      currentOptions["net"]["total"] = formatUSD(deltaTotalString);
      setOptions(currentOptions);

      // future data from below onwards
      const currentFutures = futures;
      currentFutures["todays"]["equity"] = formatUSD(availaleBalanceString);
      currentFutures["todays"]["future"] = formatUSD(deltaTotalString);
      currentFutures["todays"]["average"] = formatUSD(todayAverageString);
      setFutures(currentFutures);

      // portfolio summary data from below onwards
      const currentPorfolioSummary = portfolioSummary;
      currentPorfolioSummary["future"] = formatUSD(deltaTotalString);
      currentPorfolioSummary["grossPnl"] = formatUSD(availaleBalanceString);
      currentPorfolioSummary["netBal"] = formatUSD(netBalanceString);
      setPortfolioSummary(currentPorfolioSummary);
    }
  };

  useEffect(() => {
    fetchFuturePositions();
  }, [activeAccount, currentNetwork]);

  return (
    <div className="pt-5 sm:pt-7 lg:pt-10 pb-5 px-2.5 md:px-5 lg:px-7 xl:px-10 text-baseBlack dark:text-baseWhite">
      <div className="flex flex-col lg:flex-row space-y-2.5 mb-0 lg:mb-1.5 lg:space-y-0 lg:space-x-2.5 xl:space-x-5 text-base">
        <div className="flex flex-col w-fit lg:w-5/12 xl:w-4/12 h-[4.5rem] border border-neutral-100 dark:border-neutral-700 rounded-xl px-2 pt-2 font-semibold text-base xl:text-xl">
          <div className="text-neutral-500 text-xs font-medium mb-1">
            Select Pair
          </div>
          <div className="flex flex-row items-center">
            <FutureDropdown
              options={pairOptions}
              defaultValue={selectedPair}
              onChange={setSelectedPair}
            />
            <span className="text-green-500 font-normal ml-2">
              {marketPrice}
            </span>
            {/* <span className="text-xs xl:text-sm text-green-500 ml-1">+1.09%</span> */}
          </div>
        </div>

        <div className="w-full h-[4.5rem] flex flex-row justify-between px-2.5 xl:px-6 py-4 border border-neutral-100 dark:border-neutral-700 rounded-xl font-semibold">
          <div>
            <p className="text-neutral-500 font-normal text-xs">
              Available Balance
            </p>
            <p className="text-xs xl:text-sm">{userData.availableBalance}</p>
          </div>
          <div>
            <p className="text-neutral-500 font-normal text-xs">Margin Usage</p>
            <p className="text-xs xl:text-sm">{userData.marginUsage}</p>
          </div>
          <div>
            <p className="text-neutral-500 font-normal text-xs">Total P&L</p>
            <p className="text-xs xl:text-sm">{userData.totalPnl}</p>
          </div>
          <div>
            <p className="text-neutral-500 font-normal text-xs">
              Health Factor
            </p>
            <p className="text-xs xl:text-sm">{userData.healthFactor}</p>
          </div>
          <div>
            <p className="text-neutral-500 font-normal text-xs">Borrow Rate</p>
            <p className="text-xs xl:text-sm">{userData.borrowRate}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col-reverse xl:flex-row gap-5 text-base pt-2.5 lg:pt-1">
        <div className="flex-none xl:w-[50%]">
          <div className="mb-5 w-full">
            <OptionPayoffChart />
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <SimpleTableComponent
              title="Options"
              data={options}
              headers={["Assets", "call", "put", "total"]}
            />
            <SimpleTableComponent
              title="Futures"
              data={futures}
              headers={["Assets", "equity", "future", "average"]}
            />
          </div>
        </div>

        <div className="w-full">
          <div className="flex flex-col sm:flex-row gap-2.5 xl:gap-4">
            <div className="flex flex-col w-fit sm:w-full h-[4.5rem] border border-neutral-100 dark:border-neutral-700 rounded-xl px-2 pt-2 font-semibold text-base xl:text-lg">
              <div className="text-neutral-500 text-xs font-medium mb-1">
                Select Expiry
              </div>
              <div className="flex flex-row items-center">
                <FutureDropdown
                  options={expiryOptions}
                  defaultValue={selectedExpiry}
                  onChange={setSelectedExpiry}
                />
              </div>
            </div>

            <div className="flex-none w-full sm:w-2/3 lg:w-3/4 xl:w-[60%] 2xl:w-2/3 h-[4.5rem] flex flex-row justify-between px-2.5 xl:px-4 py-4 border border-neutral-100 dark:border-neutral-700 rounded-xl font-semibold mb-2.5">
              <div>
                <p className="text-neutral-500 font-normal text-xs">
                  Today&apos;s Date
                </p>
                <p className="text-xs xl:text-sm">{today}</p>
              </div>
              <div>
                <p className="text-neutral-500 font-normal text-xs">Rem Time</p>
                <p className="text-xs xl:text-sm">
                  {calculateRemainingTime(selectedExpiry.value)}
                </p>
              </div>
              <div>
                <p className="text-neutral-500 font-normal text-xs">CIV</p>
                <p className="text-xs xl:text-sm">16</p>
              </div>
              <div>
                <p className="text-neutral-500 font-normal text-xs">PIV</p>
                <p className="text-xs xl:text-sm">19</p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto border border-neutral-100 dark:border-neutral-700 rounded-xl mb-5">
            <table className="min-w-full mb-2">
              <thead>
                <tr className="border-b border-neutral-100 dark:border-neutral-700">
                  <th
                    className="py-2 px-3 text-left text-sm font-medium tracking-wider"
                    colSpan={8}
                  >
                    Futures-Positions
                  </th>
                </tr>
                <tr>
                  <th className="py-2 px-3 text-left text-xs font-semibold text-neutral-500 tracking-wider">
                    #
                  </th>
                  <th className="py-2 px-3 text-left text-xs font-semibold text-neutral-500 tracking-wider">
                    Market Price
                  </th>
                  <th className="py-2 px-3 text-left text-xs font-semibold text-neutral-500 tracking-wider">
                    Entry Price
                  </th>
                  <th className="py-2 px-3 text-left text-xs font-semibold text-neutral-500 tracking-wider">
                    Size
                  </th>
                  <th className="py-2 px-3 text-left text-xs font-semibold text-neutral-500 tracking-wider">
                    Leverage
                  </th>
                  <th className="py-2 px-3 text-left text-xs font-semibold text-neutral-500 tracking-wider">
                    Liq Price
                  </th>
                  <th className="py-2 px-3 text-left text-xs font-semibold text-neutral-500 tracking-wider">
                    Delta
                  </th>
                  <th className="py-2 px-3 text-left text-xs font-semibold text-neutral-500 tracking-wider">
                    P/L
                  </th>
                </tr>
              </thead>
              <tbody>
                {futuresPositions.map((position) => (
                  <tr
                    key={position.id}
                    className="hover:bg-baseComplementary dark:hover:bg-baseDarkComplementary text-sm font-normal"
                  >
                    <td className="pt-1 px-3 whitespace-nowrap">
                      <button
                        onClick={() => handleFuturePositionSelect(position.id)}
                        className="text-purple hover:text-purpleBG"
                      >
                        {position.selected ? (
                          <CheckSquare size={16} weight="fill" />
                        ) : (
                          <Square size={16} />
                        )}
                      </button>
                    </td>
                    <td className="pt-1 px-3 whitespace-nowrap">
                      {position.marketPrice}
                    </td>
                    <td className="pt-1 px-3 whitespace-nowrap">
                      {position.entryPrice}
                    </td>
                    <td className="pt-1 px-3 whitespace-nowrap">
                      {position.size} {" ETH"}
                    </td>
                    <td className="pt-1 px-3 whitespace-nowrap">
                      {position.leverage}
                    </td>
                    <td className="pt-1 px-3 whitespace-nowrap">
                      {position.liqPrice}
                    </td>
                    <td className="pt-1 px-3 whitespace-nowrap">
                      {position.delta}
                    </td>
                    <td className="pt-1 px-3 whitespace-nowrap">
                      {position.pnl}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="overflow-x-auto border border-neutral-100 dark:border-neutral-700 rounded-xl mb-5">
            <table className="min-w-full mb-2">
              <thead>
                <tr className="border-b border-neutral-100 dark:border-neutral-700">
                  <th
                    className="py-2 px-3 text-left text-sm font-medium tracking-wider"
                    colSpan={8}
                  >
                    Options-Positions
                  </th>
                </tr>
                <tr>
                  <th className="py-2 px-3 text-left text-xs font-semibold text-neutral-500 tracking-wider">
                    #
                  </th>
                  <th className="py-2 px-3 text-left text-xs font-semibold text-neutral-500 tracking-wider">
                    Strike Price
                  </th>
                  <th className="py-2 px-3 text-left text-xs font-semibold text-neutral-500 tracking-wider">
                    CP
                  </th>
                  <th className="py-2 px-3 text-left text-xs font-semibold text-neutral-500 tracking-wider">
                    Units
                  </th>
                  <th className="py-2 px-3 text-left text-xs font-semibold text-neutral-500 tracking-wider">
                    Traded
                  </th>
                  <th className="py-2 px-3 text-left text-xs font-semibold text-neutral-500 tracking-wider">
                    Price
                  </th>
                  <th className="py-2 px-3 text-left text-xs font-semibold text-neutral-500 tracking-wider">
                    Delta
                  </th>
                  <th className="py-2 px-3 text-left text-xs font-semibold text-neutral-500 tracking-wider">
                    IV
                  </th>
                </tr>
              </thead>
              <tbody>
                {optionPositions.map((position) => (
                  <tr
                    key={position.id}
                    className="hover:bg-baseComplementary dark:hover:bg-baseDarkComplementary text-sm font-normal"
                  >
                    <td className="pt-1 px-3 whitespace-nowrap">
                      <button
                        onClick={() => handleOptionPositionSelect(position.id)}
                        className="text-purple hover:text-purpleBG"
                      >
                        {position.selected ? (
                          <CheckSquare size={16} weight="fill" />
                        ) : (
                          <Square size={16} />
                        )}
                      </button>
                    </td>
                    <td className="pt-1 px-3 whitespace-nowrap">
                      ${position.strikePrice.toFixed(2)}
                    </td>
                    <td className="pt-1 px-3 whitespace-nowrap">
                      {position.cp}
                    </td>
                    <td className="pt-1 px-3 whitespace-nowrap">
                      {position.units.toLocaleString()}
                    </td>
                    <td className="pt-1 px-3 whitespace-nowrap">
                      {position.traded.toFixed(4)}
                    </td>
                    <td className="pt-1 px-3 whitespace-nowrap">
                      {position.price.toFixed(2)}
                    </td>
                    <td className="pt-1 px-3 whitespace-nowrap">
                      {position.delta.toFixed(1)}
                    </td>
                    <td className="pt-1 px-3 whitespace-nowrap">
                      {position.iv.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="w-full grid grid-cols-4 sm:grid-cols-8 gap-2.5 lg:gap-5 justify-between px-2.5 lg:px-5 py-5 border border-neutral-100 dark:border-neutral-700 rounded-xl font-semibold mb-2.5 text-xs">
        <div>
          <p className="text-neutral-500 font-normal">FUTURE</p>
          <p>{portfolioSummary.future}</p>
        </div>
        <div>
          <p className="text-neutral-500 font-normal">PREMIUM</p>
          <p>{portfolioSummary.premium}</p>
        </div>
        <div>
          <p className="text-neutral-500 font-normal">OPTION</p>
          <p>{portfolioSummary.option}</p>
        </div>
        <div>
          <p className="text-neutral-500 font-normal">GROSS PNL</p>
          <p>{portfolioSummary.grossPnl}</p>
        </div>
        <div>
          <p className="text-neutral-500 font-normal">NET BAL</p>
          <p>{portfolioSummary.netBal}</p>
        </div>
        <div>
          <p className="text-neutral-500 font-normal">THETA</p>
          <p>{portfolioSummary.theta}</p>
        </div>
        <div>
          <p className="text-neutral-500 font-normal">VEGA</p>
          <p>{portfolioSummary.vega}</p>
        </div>
        <div>
          <p className="text-neutral-500 font-normal">GAMMA</p>
          <p>{portfolioSummary.gamma}</p>
        </div>
      </div>
    </div>
  );
}
