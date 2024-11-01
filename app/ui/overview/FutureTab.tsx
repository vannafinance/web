import { useEffect, useState } from "react";
import InfoRow from "./InfoRowProps";
import {
  ARBITRUM_NETWORK,
  OPTIMISM_NETWORK,
  BASE_NETWORK,
} from "@/app/lib/constants";
import { ceilWithPrecision } from "@/app/lib/helper";
import { formatUSD } from "@/app/lib/number-format-helper";
import {
  arbAddressList,
  codeToAsset,
  opAddressList,
} from "@/app/lib/web3-constants";
import { Contract } from "ethers";
import { useNetwork } from "@/app/context/network-context";
import { useWeb3React } from "@web3-react/core";
import ClearingHouse from "../../abi/vanna/v1/out/ClearingHouse.sol/ClearingHouse.json";
import LiquidityPool from "../../abi/vanna/v1/out/LiquidityPool.sol/LiquidityPool.json";
import OptimismFetchPosition from "../../abi/vanna/v1/out/OptimismFetchPosition.sol/OptimismFetchPosition.json";
import axios from "axios";

const FutureTab: React.FC = () => {
  const { library } = useWeb3React();
  const { currentNetwork } = useNetwork();

  const [assetsPrice, setAssetsPrice] = useState([]);
  // const [activeAccount, setActiveAccount] = useState<string | undefined>();

  const [market, setMarket] = useState("");
  const [size, setSize] = useState("");
  const [collateral, setCollateral] = useState("");
  const [entryPrice, setEntryPrice] = useState("");
  const [liquidationPrice, setLiquidationPrice] = useState("");
  const [profitLoss, setProfitLoss] = useState("");
  const [profitLossPercentage, setProfitLossPercentage] = useState("");

  // TODO: delete below useEffect
  useEffect(() => {
    setMarket("");
    setSize("");
    setCollateral("");
    setEntryPrice("");
    setLiquidationPrice("");
    setProfitLoss("");
    setProfitLossPercentage("");
  }, []);

  useEffect(() => {
    const intervalId = setInterval(getAssetPrice, 1000); // Calls fetchData every second
    return () => clearInterval(intervalId); // This is the cleanup function
  }, []);

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
    assetName = market
    // shouldSetMarketPrice = true
  ) => {
    const rsp = await axios.get("https://app.mux.network/api/liquidityAsset", {
      timeout: 10 * 1000,
    });
    const price = getPriceFromAssetsArray(assetName, rsp.data.assets);
    setAssetsPrice(rsp.data.assets);

    // if (shouldSetMarketPrice && price) {
    //   setMarketPrice(price);
    // }

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

  // const fetchPositions = async (account?: { toString: () => string }) => {
  //   if (!currentNetwork) return;

  //   if (account) {
  //     if (currentNetwork.id === ARBITRUM_NETWORK) {
  //       const renderedRows: MarketPosition[] = [];
  //       const signer = await library?.getSigner();
  //       const liquidityPoolContract = new Contract(
  //         arbAddressList.muxLiquidityPoolAddress,
  //         LiquidityPool.abi,
  //         signer
  //       );

  //       // let price = 0;
  //       let subAccountId;

  //       // for (let i = 0; i < 5; i++) {
  //       const i = 3;
  //       for (let j = 3; j < 5; j++) {
  //         for (let k = 0; k < 2; k++) {
  //           subAccountId =
  //             account.toString() +
  //             "0" +
  //             i +
  //             "0" +
  //             j +
  //             "0" +
  //             k +
  //             "000000000000000000";
  //           const result = await liquidityPoolContract.getSubAccount(
  //             subAccountId
  //           );
  //           const size = result.size / 1e18;

  //           if (size != 0) {
  //             const indexPrice = await getAssetPrice(
  //               codeToAsset["0" + j]
  //               // false
  //             );
  //             if (indexPrice) {
  //               const netValue = indexPrice * size;
  //               const collateralPrice = result.collateral / 1e18;
  //               const entryPrice = result.entryPrice / 1e18;
  //               const liquidation =
  //                 entryPrice - (collateralPrice * entryPrice) / size;
  //               const pnl = calcPnl(indexPrice, entryPrice, size, k);
  //               // price += pnl;

  //               const row: MarketPosition = {
  //                 market: "",
  //                 isLong: false,
  //                 netValue: "",
  //                 collateral: 0,
  //                 entryPrice: "",
  //                 indexPrice: "",
  //                 liqPrice: "",
  //                 pnlAndRow: "",
  //                 actions: <div></div>, // or some default JSX
  //               };

  //               row["market"] = "ETH/USD";
  //               row["isLong"] = k === 1;
  //               row["netValue"] = formatUSD(netValue);
  //               row["collateral"] = collateralPrice;
  //               row["entryPrice"] = formatUSD(entryPrice);
  //               row["indexPrice"] = formatUSD(indexPrice);
  //               row["liqPrice"] = formatUSD(liquidation);
  //               row["pnlAndRow"] = formatUSD(pnl);

  //               renderedRows.push(row);
  //             }
  //           }
  //         }
  //         // }
  //       }

  //     } else if (currentNetwork.id === OPTIMISM_NETWORK) {
  //       const signer = await library?.getSigner();

  //       const OptimismFetchPositionContract = new Contract(
  //         opAddressList.optimismFetchPositionContractAddress,
  //         OptimismFetchPosition.abi,
  //         signer
  //       );

  //       const getNetVal =
  //         await OptimismFetchPositionContract.getTotalPositionValue(
  //           account,
  //           opAddressList.vETH
  //         );
  //       const netValue = getNetVal / 1e18;

  //       if (netValue != 0) {
  //         const getETHMarketPrice =
  //           await OptimismFetchPositionContract.getMarkPrice(
  //             opAddressList.vETH
  //           );
  //         const indexPrice = getETHMarketPrice / 1e18;

  //         const getTotalPositionSize =
  //           await OptimismFetchPositionContract.getTotalPositionSize(
  //             account,
  //             opAddressList.vETH
  //           );
  //         const totalPositionSize = ceilWithPrecision(
  //           String(getTotalPositionSize / 1e18)
  //         );

  //         const getPnlResult =
  //           await OptimismFetchPositionContract.getPnlAndPendingFee(account);
  //         const pnl = ceilWithPrecision(String(getPnlResult[1] / 1e18));

  //         const ClearingHouseContract = new Contract(
  //           opAddressList.ClearingHouse,
  //           ClearingHouse.abi,
  //           signer
  //         );
  //         const getCollateral = await ClearingHouseContract.getAccountValue(
  //           account
  //         );
  //         const collateralPrice = ceilWithPrecision(
  //           String(getCollateral / 1e18)
  //         );
  //         // const collateralPriceInUSDC = ceilWithPrecision(collateralPrice * indexPrice);

  //         const row: MarketPosition = {
  //           market: "",
  //           isLong: false,
  //           netValue: "",
  //           collateral: 0,
  //           entryPrice: "",
  //           indexPrice: "",
  //           liqPrice: "",
  //           pnlAndRow: "",
  //           actions: <div></div>, // or some default JSX
  //         };
  //         row["market"] = "ETH";
  //         row["isLong"] = false; // TODO: @vatsal add logic here for long / short
  //         row["netValue"] = formatUSD(netValue);
  //         row["collateral"] = Number(collateralPrice);
  //         // row["entryPrice"] = (
  //         //   <p style={{ color: "white", fontWeight: "400", fontSize: "14px" }}>
  //         //     -{/* {formatUSD(entryPrice)} */}
  //         //   </p>
  //         // );
  //         row["entryPrice"] = formatUSD(totalPositionSize);
  //         row["indexPrice"] = formatUSD(indexPrice);
  //         // row["liqPrice"] = (
  //         //   <p style={{ color: "white", fontWeight: "400", fontSize: "14px" }}>
  //         //     -{/* {formatUSD(liquidation)} */}
  //         //   </p>
  //         // );
  //         row["liqPrice"] = formatUSD(netValue);
  //         row["pnlAndRow"] = formatUSD(pnl);
  //       }
  //     } else if (currentNetwork.id === BASE_NETWORK) {
  //     }
  //   }
  // };

  return (
    <div className="grid grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-5">
      <InfoRow label="Market" value={market} />
      <InfoRow label="Size" value={size} />
      <InfoRow label="Collateral" value={collateral} />
      <InfoRow label="Entry Price" value={entryPrice} />
      <InfoRow label="Liq. Price" value={liquidationPrice} />
      <InfoRow label="PNL" value={profitLoss} subValue={profitLossPercentage} />
    </div>
  );
};

export default FutureTab;
