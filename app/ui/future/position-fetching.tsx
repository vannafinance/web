import { arbAddressList, baseAddressList, codeToAsset, opAddressList } from "@/app/lib/web3-constants";
import { useWeb3React } from "@web3-react/core";
import axios from "axios";
import { Contract } from "ethers";
import { useEffect, useState } from "react";
import AccountManager from "../../abi/vanna/v1/out/AccountManager.sol/AccountManager.json";
import LiquidityPool from "../../abi/vanna/v1/out/LiquidityPool.sol/LiquidityPool.json";
import Registry from "../../abi/vanna/v1/out/Registry.sol/Registry.json";
import MUX from "../../abi/vanna/v1/out/MUX.sol/MUX.json";
import {
  ARBITRUM_NETWORK,
  BASE_NETWORK,
  OPTIMISM_NETWORK,
  oneMonthTimestampInterval,
  referralCode,
} from "@/app/lib/constants";
import { useNetwork } from "@/app/context/network-context";
import { formatUSD } from "@/app/lib/number-format-helper";
import { Interface } from "ethers/lib/utils";
import { sleep } from "@/app/lib/helper";

const PositionFetching = () =>
  // closePosition: (arg0: number, arg1: number, arg2: number, arg3: any) => void
  {
    const { account, library } = useWeb3React();
    const { currentNetwork } = useNetwork();

    const [market, setMarket] = useState("ETH");
    const [marketPrice, setMarketPrice] = useState(0.0);
    const [assetsPrice, setAssetsPrice] = useState([]);

    const [activeAccount, setActiveAccount] = useState<string | undefined>();
    const [loading, setLoading] = useState(false);

    const [rows, setRows] = useState<MarketPosition[]>([]);

    const accountCheck = async () => {
      if (localStorage.getItem("isWalletConnected") === "true") {
        if (account && currentNetwork) {
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
          }
        } else {
          setActiveAccount(undefined);
        }
      }
    };
  
    useEffect(() => {
      accountCheck();
    }, [account, library]);
  
    useEffect(() => {
      // getTokenBalance();
      fetchPositions(activeAccount);
    }, [activeAccount]);

    const getPriceFromAssetsArray = (
      tokenSymbol: string,
      assets: MuxPriceFetchingResponseObject[] = assetsPrice
    ) => {
      tokenSymbol = tokenSymbol === "WETH" ? "ETH" : tokenSymbol;
      for (const asset of assets) {
        if (asset.symbol === tokenSymbol) {
          return asset.price;
        }
      }
      return null;
    };

    const getAssetPrice = async (
      assetName = market,
      shouldSetMarketPrice = true
    ) => {
      const rsp = await axios.get(
        "https://app.mux.network/api/liquidityAsset",
        { timeout: 10 * 1000 }
      );
      const price = getPriceFromAssetsArray(assetName, rsp.data.assets);
      setAssetsPrice(rsp.data.assets);

      if (shouldSetMarketPrice && price) {
        setMarketPrice(price);
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
      if (!currentNetwork) return;

      if (account) {
        if (currentNetwork.id === ARBITRUM_NETWORK) {
          let renderedRows: MarketPosition[] = [];
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

              console.log(i, j, k, size);

              if (size != 0) {
                const indexPrice = await getAssetPrice(
                  codeToAsset["0" + j],
                  false
                );
                if (indexPrice) {
                  const netValue = indexPrice * size;
                  const collateralPrice = result.collateral / 1e18;
                  const entryPrice = result.entryPrice / 1e18;
                  const liquidation =
                    entryPrice - (collateralPrice * entryPrice) / size;
                  const pnl = calcPnl(indexPrice, entryPrice, size, k);
                  // price += pnl;

                  let row: MarketPosition = {
                    market: "",
                    isLong: false,
                    netValue: "",
                    collateral: 0,
                    entryPrice: "",
                    indexPrice: "",
                    liqPrice: "",
                    pnlAndRow: "",
                    actions: <div></div>, // or some default JSX
                  };

                  row["market"] = "ETH/USD";
                  row["isLong"] = k === 1;
                  row["netValue"] = formatUSD(netValue);
                  row["collateral"] = collateralPrice;
                  row["entryPrice"] = formatUSD(entryPrice);
                  row["indexPrice"] = formatUSD(indexPrice);
                  row["liqPrice"] = formatUSD(liquidation);
                  row["pnlAndRow"] = formatUSD(pnl);
                  row["actions"] = (
                    <button
                      className="bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-2 px-4 border border-blue-500 hover:border-transparent rounded"
                      onClick={() => {
                        closePosition(i, j, k, result.size);
                      }}
                    >
                      Close
                    </button>
                  );

                  console.log(row);

                  renderedRows.push(row);
                }
              }
            }
            // }
          }

          setRows(renderedRows);
          // return price;
        } else if (currentNetwork.id === OPTIMISM_NETWORK) {
        } else if (currentNetwork.id === BASE_NETWORK) {
        }
      }
    };

    const closePosition = async (
      assetCode: string | number,
      collateralCode: string | number,
      longShort: string | number,
      size: any
    ) => {
      setLoading(true);
      try {
        if (!activeAccount) return;

        const subAccountId =
          activeAccount.toString() +
          "0" +
          assetCode +
          "0" +
          collateralCode +
          "0" +
          longShort +
          "000000000000000000";

        let collateralAmountForPosition = 0;

        // this will changes, temporary static value
        const flags = 96;

        // fetch transaction -> determine long / short ? -> if long get asset code if short get colletral code
        const profitTokenId = longShort == 1 ? collateralCode : 0;

        const tsplDeadline =
          Math.floor(Date.now() / 1000) + oneMonthTimestampInterval;

        const positionOrderExtras = {
          tpPrice: 0,
          slPrice: 0,
          tpslProfitTokenId: profitTokenId,
          tpslDeadline: tsplDeadline,
        };

        let iface = new Interface(MUX.abi);

        let encodedData = iface.encodeFunctionData("placePositionOrder3", [
          subAccountId,
          collateralAmountForPosition,
          size,
          0,
          profitTokenId,
          flags,
          0,
          referralCode,
          positionOrderExtras,
        ]);

        const signer = await library?.getSigner();

        const accountManagerContract = new Contract(
          arbAddressList.accountManagerContractAddress,
          AccountManager.abi,
          signer
        );

        await accountManagerContract.exec(
          activeAccount,
          arbAddressList.muxFutureContractAddress,
          collateralAmountForPosition,
          encodedData,
          { gasLimit: 2300000 }
        );

        await sleep(3000);
        fetchPositions(activeAccount);
        // getTokenBalance();
        // setMessage("Transaction successfull.");
        // setIsAlert(true);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };

    // const rows: MarketPosition[] = [
    //   {
    //     market: "ETH/USD",
    //     isLong: true,
    //     netValue: "$543.40",
    //     collateral: 0.2016,
    //     entryPrice: "$2,173.9",
    //     indexPrice: "$2,353.9",
    //     liqPrice: "$1,450.5",
    //     pnlAndRow: "+$68.72",
    //     actions: (
    //       <button className="bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-2 px-4 border border-blue-500 hover:border-transparent rounded">
    //         Close
    //       </button>
    //     ),
    //   },
    // ];

    return (
      <div className="w-full mx-auto">
        <div className="hidden md:block min-w-full text-base font-medium text-baseBlack dark:text-baseWhite text-center">
          {/* Header */}
          <div className="bg-baseComplementary dark:bg-baseDarkComplementary grid grid-cols-8 rounded-xl px-3 py-1.5 md:py-4 font-semibold">
            <div>Market</div>
            <div>Net Value</div>
            <div>Collateral</div>
            <div>Entry Price</div>
            <div>Index Price</div>
            <div>Liq. Price</div>
            <div>PNL & ROE</div>
            <div>Actions</div>
          </div>

          {/* Body */}
          <div className="bg-white dark:bg-baseDark text-center pt-6 text-base font-medium">
            {rows.map((item, index) => (
              <div
                className="grid grid-cols-8 px-3 py-1.5 md:py-4 whitespace-nowrap transition-all duration-200 ease-in-out rounded-xl items-center"
                key={index}
              >
                <div>
                  {item.market}
                  <p className="text-xs">{item.isLong ? "Long" : "Short"}</p>
                </div>
                <div>{item.netValue}</div>
                <div>{item.collateral}</div>
                <div>{item.entryPrice}</div>
                <div>{item.indexPrice}</div>
                <div>{item.liqPrice}</div>
                <div>{item.pnlAndRow}</div>
                <div>{item.actions}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

export default PositionFetching;
