import { useEffect, useRef, useState } from "react";
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
  baseAddressList,
  codeToAsset,
  opAddressList,
} from "@/app/lib/web3-constants";
import { Contract } from "ethers";
import { useNetwork } from "@/app/context/network-context";
import { useWeb3React } from "@web3-react/core";
import ClearingHouse from "../../abi/vanna/v1/out/ClearingHouse.sol/ClearingHouse.json";
import LiquidityPool from "../../abi/vanna/v1/out/LiquidityPool.sol/LiquidityPool.json";
import OptimismFetchPosition from "../../abi/vanna/v1/out/OptimismFetchPosition.sol/OptimismFetchPosition.json";
import Registry from "../../abi/vanna/v1/out/Registry.sol/Registry.json";
import axios from "axios";
import Loader from "../components/loader";

const FutureTab: React.FC = () => {
  const { account, library } = useWeb3React();
  const { currentNetwork } = useNetwork();
  const [loading, setLoading] = useState(false);

  const [assetsPrice, setAssetsPrice] = useState([]);
  const [activeAccount, setActiveAccount] = useState<string | undefined>();
  const [isActive, setIsActive] = useState(false);

  const [values, setValues] = useState<MarketPosition | undefined>();
  const valuesRef = useRef(values);

  const [market, setMarket] = useState("");
  const [size, setSize] = useState("");
  const [collateral, setCollateral] = useState("");
  const [entryPrice, setEntryPrice] = useState("");
  const [liquidationPrice, setLiquidationPrice] = useState("");
  const [profitLoss, setProfitLoss] = useState("");
  // const [profitLossPercentage, setProfitLossPercentage] = useState("");

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
  };

  useEffect(() => {
    setIsActive(true);
    accountCheck();
    getAssetPrice();

    const intervalId = setInterval(getAssetPrice, 1000); // Calls fetchData every second

    return () => {
      setIsActive(false);
      clearInterval(intervalId); // This is the cleanup function
    };
  }, []);

  useEffect(() => {
    accountCheck();
  }, [account, library, currentNetwork]);

  useEffect(() => {
    fetchPositions(activeAccount);
  }, [activeAccount, isActive]);

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

    if (valuesRef.current !== undefined) {
      setMarket(valuesRef.current["market"]);
      setSize(formatUSD(Number(valuesRef.current["netValue"]) * price));
      setCollateral(formatUSD(Number(valuesRef.current["collateral"]) * price));
      setEntryPrice(formatUSD(Number(valuesRef.current["entryPrice"]) * price));
      setLiquidationPrice(
        formatUSD(Number(valuesRef.current["liqPrice"]) * price)
      );
      setProfitLoss(formatUSD(Number(valuesRef.current["pnlAndRow"]) * price));
    }

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

  const fetchPositions = async (account?: { toString: () => string }) => {
    setLoading(true);

    if (currentNetwork && account) {
      const row: MarketPosition = {
        market: "ETH",
        isLong: false,
        netValue: "0",
        leverage: "",
        collateral: 0,
        entryPrice: "0",
        indexPrice: "0",
        liqPrice: "0",
        pnlAndRow: "0",
        actions: <div></div>, // or some default JSX
      };

      if (currentNetwork.id === ARBITRUM_NETWORK) {
        row["market"] = "ETH/USD";
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
              account.toString() +
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

                row["netValue"] = String(netValue + Number(row["netValue"]));
                row["collateral"] = collateralPrice + row["collateral"];
                row["entryPrice"] = String(
                  entryPrice + Number(row["entryPrice"])
                );
                row["liqPrice"] = String(liquidation + Number(row["liqPrice"]));
                row["pnlAndRow"] = String(pnl + Number(row["pnlAndRow"]));
              }
            }
          }
          // }
        }
      } else if (currentNetwork.id === OPTIMISM_NETWORK) {
        const signer = await library?.getSigner();

        const OptimismFetchPositionContract = new Contract(
          opAddressList.optimismFetchPositionContractAddress,
          OptimismFetchPosition.abi,
          signer
        );

        const getNetVal =
          await OptimismFetchPositionContract.getTotalPositionValue(
            account,
            opAddressList.vETH
          );
        const netValue = getNetVal / 1e18;

        if (netValue != 0) {
          const getTotalPositionSize =
            await OptimismFetchPositionContract.getTotalPositionSize(
              account,
              opAddressList.vETH
            );
          const totalPositionSize = ceilWithPrecision(
            String(getTotalPositionSize / 1e18)
          );

          const getPnlResult =
            await OptimismFetchPositionContract.getPnlAndPendingFee(account);
          const pnl = ceilWithPrecision(String(getPnlResult[1] / 1e18));

          const ClearingHouseContract = new Contract(
            opAddressList.ClearingHouse,
            ClearingHouse.abi,
            signer
          );
          const getCollateral = await ClearingHouseContract.getAccountValue(
            account
          );
          const collateralPrice = ceilWithPrecision(
            String(getCollateral / 1e18)
          );

          row["netValue"] = String(netValue + Number(row["netValue"]));
          row["collateral"] = Number(collateralPrice) + row["collateral"];
          row["entryPrice"] = String(
            totalPositionSize + Number(row["entryPrice"])
          );
          row["liqPrice"] = String(netValue + Number(row["liqPrice"]));
          row["pnlAndRow"] = String(pnl + Number(row["pnlAndRow"]));
        }
      } else if (currentNetwork.id === BASE_NETWORK) {
      }

      setValues(row);
      valuesRef.current = row;
    } else {
      valuesRef.current = undefined;
      setMarket("");
      setSize("");
      setCollateral("");
      setEntryPrice("");
      setLiquidationPrice("");
      setProfitLoss("");
    }

    setLoading(false);
  };

  return (
    <div className="grid grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-5">
      {loading ? <Loader /> : <InfoRow label="Market" value={market} />}
      {loading ? <Loader /> : <InfoRow label="Size" value={size} />}
      {loading ? <Loader /> : <InfoRow label="Collateral" value={collateral} />}
      {loading ? (
        <Loader />
      ) : (
        <InfoRow label="Entry Price" value={entryPrice} />
      )}
      {loading ? (
        <Loader />
      ) : (
        <InfoRow label="Liq. Price" value={liquidationPrice} />
      )}
      {loading ? (
        <Loader />
      ) : (
        <InfoRow
          label="PNL"
          value={profitLoss}
          // subValue={profitLossPercentage}
        />
      )}
    </div>
  );
};

export default FutureTab;
