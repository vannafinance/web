/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

// import { useNetwork } from "@/app/context/network-context";
import {
  ceilWithPrecision,
  formatBignumberToUnits,
  formatStringToUnits,
  sleep,
} from "@/app/lib/helper";
import {
  arbAddressList,
  arbTokensAddress,
  baseAddressList,
  opAddressList,
  opTokensAddress,
} from "@/app/lib/web3-constants";
import TokenDropdown from "@/app/ui/components/token-dropdown";
import Loader from "@/app/ui/components/loader";
import { ethPoolObj, poolsPlaceholder } from "@/app/lib/static-values";
import { CaretDown, CaretUp, Lightning } from "@phosphor-icons/react";
import { useWeb3React } from "@web3-react/core";
import { Contract } from "ethers";
import { formatUnits, Interface } from "ethers/lib/utils";
import Image from "next/image";
import { useEffect, useState } from "react";

import AccountManager from "../../abi/vanna/v1/out/AccountManager.sol/AccountManager.json";
import AccountManagerOp from "../../abi/vanna/v1/out/AccountManager-op.sol/AccountManager-op.json";
import ERC20 from "../../abi/vanna/v1/out/ERC20.sol/ERC20.json";
import ISwapRouterV3 from "../../abi/vanna/v1/out/ISwapRouterV3.sol/ISwapRouterV3.json";
import Registry from "../../abi/vanna/v1/out/Registry.sol/Registry.json";
import {
  ARBITRUM_NETWORK,
  BASE_NETWORK,
  OPTIMISM_NETWORK,
} from "@/app/lib/constants";
import { useNetwork } from "@/app/context/network-context";
import axios from "axios";
import { formatUSD } from "@/app/lib/number-format-helper";
import CreateSmartAccountModal from "@/app/ui/components/create-smart-account-model";
import Notification from "@/app/ui/components/notification";

export default function Page() {
  const { account, library } = useWeb3React();
  const [activeAccount, setActiveAccount] = useState<string | undefined>();
  const { currentNetwork } = useNetwork();
  const [notifications, setNotifications] = useState<
    Array<{ id: number; type: NotificationType; message: string }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [disableBtn, setDisableBtn] = useState(true);
  const [btnValue, setBtnValue] = useState("Enter an amount");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [payInput, setPayInput] = useState<string>("");
  const [receiveInput, setReceiveInput] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);
  const [payCoin, setPayCoin] = useState(poolsPlaceholder[0]);
  const [receiveCoin, setReceiveCoin] = useState(poolsPlaceholder[2]);
  const [balList, setBalList] = useState<{ [key: string]: string } | undefined>(
    undefined
  );
  const [payBalance, setPayBalance] = useState<number | undefined>();
  const [receiveBalance, setReceiveBalance] = useState<number | undefined>();
  const [payAmountInDollar, setPayAmountInDollar] = useState<number>();
  const [receiveAmountInDollar, setReceiveAmountInDollar] = useState<number>(0);
  const [maxSlippage, setMaxSlippage] = useState<string | undefined>();
  const [receiveAtLeast, setReceiveAtLeast] = useState<string | undefined>();
  const [fee, setFee] = useState<string | undefined>();
  const [networkCost, setNetworkCost] = useState<string | undefined>();
  const [orderRouting, setOrderRouting] = useState<string | undefined>();

  const toggleOpen = () => setIsOpen(!isOpen);

  const handleFromSelect = (token: PoolTable) => {
    setPayCoin(token);
    if (balList) setPayBalance(Number(balList[token?.name]));
  };

  const handleToSelect = (token: PoolTable) => {
    setReceiveCoin(token);
    if (balList) setReceiveBalance(Number(balList[token?.name]));
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
    setLoading(false);
  };

  useEffect(() => {
    accountCheck();
  }, []);

  useEffect(() => {
    accountCheck();
  }, [account, library, currentNetwork]);

  useEffect(() => {
    accountCheck();
  }, [isModalOpen]);

  const balanceFetch = async () => {
    try {
      if (activeAccount && currentNetwork) {
        const signer = await library?.getSigner();
        let daiContract;
        let usdcContract;
        let usdtContract;
        let wbtcContract;
        let wethContract;

        if (currentNetwork.id === ARBITRUM_NETWORK) {
          wethContract = new Contract(
            arbAddressList.wethTokenAddress,
            ERC20.abi,
            signer
          );
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
          wbtcContract = new Contract(
            arbAddressList.wbtcTokenAddress,
            ERC20.abi,
            signer
          );
        } else if (currentNetwork.id === OPTIMISM_NETWORK) {
          wethContract = new Contract(
            opAddressList.wethTokenAddress,
            ERC20.abi,
            signer
          );
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
          wbtcContract = new Contract(
            opAddressList.wbtcTokenAddress,
            ERC20.abi,
            signer
          );
        } else if (currentNetwork.id === BASE_NETWORK) {
          wethContract = new Contract(
            baseAddressList.wethTokenAddress,
            ERC20.abi,
            signer
          );
          daiContract = new Contract(
            baseAddressList.daiTokenAddress,
            ERC20.abi,
            signer
          );
          usdcContract = new Contract(
            baseAddressList.usdcTokenAddress,
            ERC20.abi,
            signer
          );
          usdtContract = new Contract(
            baseAddressList.usdtTokenAddress,
            ERC20.abi,
            signer
          );
          wbtcContract = new Contract(
            baseAddressList.wbtcTokenAddress,
            ERC20.abi,
            signer
          );
        }

        const ethBalOfSA = wethContract
          ? await wethContract.balanceOf(activeAccount)
          : 0;
        const daiBalOfSA = daiContract
          ? await daiContract.balanceOf(activeAccount)
          : 0;
        const usdcBalOfSA = usdcContract
          ? await usdcContract.balanceOf(activeAccount)
          : 0;
        const usdtBalOfSA = usdtContract
          ? await usdtContract.balanceOf(activeAccount)
          : 0;
        const wbtcBalOfSA = wbtcContract
          ? await wbtcContract.balanceOf(activeAccount)
          : 0;

        const listOfBalance: { [key: string]: string } = {};

        listOfBalance["WETH"] = ceilWithPrecision(
          formatBignumberToUnits("WETH", ethBalOfSA),
          6
        );
        listOfBalance["WBTC"] = ceilWithPrecision(
          formatBignumberToUnits("WBTC", wbtcBalOfSA),
          4
        );
        listOfBalance["USDC"] = ceilWithPrecision(
          formatBignumberToUnits("USDC", usdcBalOfSA)
        );
        listOfBalance["USDT"] = ceilWithPrecision(
          formatBignumberToUnits("USDT", usdtBalOfSA)
        );
        listOfBalance["DAI"] = ceilWithPrecision(
          formatBignumberToUnits("DAI", wbtcBalOfSA)
        );

        setBalList(listOfBalance);

        setPayBalance(Number(listOfBalance[payCoin.name]));
        setReceiveBalance(Number(listOfBalance[receiveCoin.name]));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getPriceFromAssetsArray = async (tokenSymbol: string) => {
    const rsp = await axios.get("https://app.mux.network/api/liquidityAsset", {
      timeout: 10 * 1000,
    });

    const assets = rsp.data.assets;

    tokenSymbol =
      tokenSymbol === "WETH" || tokenSymbol === "WBTC"
        ? tokenSymbol.substring(1)
        : tokenSymbol;

    for (let asset of assets) {
      if (asset.symbol === tokenSymbol) {
        return asset.price;
      }
    }
    return 1;
  };

  useEffect(() => {
    updatePayInput(payInput);
  }, [payCoin, receiveCoin]);

  const updatePayInput = async (amt: string | number) => {
    if (amt === "") {
      setPayInput("");
      setReceiveInput("");
      // setReceiveUpdated();
    } else {
      setPayInput(String(amt));

      const currentPriceOfPay = await getPriceFromAssetsArray(payCoin.name);
      const currentPriceOfReceive = await getPriceFromAssetsArray(
        receiveCoin.name
      );
      const receive = (currentPriceOfPay * Number(amt)) / currentPriceOfReceive;

      setReceiveInput(String(receive));
      setPayAmountInDollar(Number(amt) * currentPriceOfPay);
      setReceiveAmountInDollar(receive * currentPriceOfReceive);
      // setReceiveUpdated(receive);
    }
  };

  useEffect(() => {
    balanceFetch();
  }, [account, activeAccount, currentNetwork]);

  useEffect(() => {
    const tokenName = payCoin.name ? payCoin.name : "";
    if (payInput === "" || Number(payInput) <= 0) {
      setBtnValue("Enter an amount");
      setDisableBtn(true);
    } else if (
      payBalance &&
      payInput &&
      payInput !== "" &&
      payBalance * 1.0 < Number(payInput) * 1.0
    ) {
      setBtnValue("Insufficient " + tokenName + " balance");
      setDisableBtn(true);
    } else {
      setBtnValue(tokenName === "ETH" ? "Swap" : "Approve - Swap");
      setDisableBtn(false);
    }
  }, [payInput, payBalance, payCoin]);

  const spot = async () => {
    setLoading(true);

    try {
      if (payInput === "" || !currentNetwork) {
        return;
      }
      if (currentNetwork.id === ARBITRUM_NETWORK) {
        const signer = await library?.getSigner();
        // struct Data
        const tokenIn = arbTokensAddress[payCoin.name];
        const tokenOut = arbTokensAddress[receiveCoin.name];
        const fee = 3000;
        const amountIn = formatStringToUnits(payCoin.name, Number(payInput));
        const amountOut = 0;
        const sqrtPriceLimitX96 = 0;

        // Instance
        const accountManagerContract = new Contract(
          arbAddressList.accountManagerContractAddress,
          AccountManager.abi,
          signer
        );
        // const SwapRouterContract = new Contract(
        //   arbAddressList.uniswapRouterAddress,
        //   ISwapRouterV3.abi,
        //   signer
        // )

        if (
          //AnyToken <=> WETH
          (payCoin.name === "WBTC" ||
            payCoin.name === "DAI" ||
            payCoin.name === "USDT" ||
            payCoin.name === "USDC") &&
          tokenOut === arbAddressList.wethTokenAddress
        ) {
          //struct
          const ExactInputSingleParams = {
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            fee: fee,
            recipient: arbAddressList.uniswapRouterAddress, // here 1st reciver is router and then unwrap happen
            amountIn: amountIn,
            amountOutMinimum: amountOut,
            sqrtPriceLimitX96: sqrtPriceLimitX96,
          };
          // @TODO: check allowance
          // Approve
          await accountManagerContract.approve(
            activeAccount,
            tokenIn,
            arbAddressList.uniswapRouterAddress,
            amountIn
          );
          await sleep(3000);
          // swapping from anycoin to WETH and WETH to ETH
          const data = [];
          let target = [];
          let multiData = [];

          // combine two transaction exactInputSingle and unwrapWETH9
          const iface = new Interface(ISwapRouterV3.abi);
          multiData.push(
            iface.encodeFunctionData("exactInputSingle", [
              ExactInputSingleParams,
            ])
          );
          multiData.push(
            iface.encodeFunctionData("unwrapWETH9(uint256,address)", [
              0,
              activeAccount,
            ])
          );

          // adding that combine transaction
          data.push(
            iface.encodeFunctionData("multicall(bytes[])", [multiData])
          );
          target.push(arbAddressList.uniswapRouterAddress);

          // execute
          await accountManagerContract.exec(
            activeAccount,
            target,
            0, // amount in is anytoken
            data,
            { gasLimit: 2300000 }
          );
        } else if (payCoin.name === "WETH") {
          // WETH <=> AnyToken native ETH
          // struct
          const ExactInputSingleParams = {
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            fee: fee,
            recipient: activeAccount,
            amountIn: amountIn,
            amountOutMinimum: amountOut,
            sqrtPriceLimitX96: sqrtPriceLimitX96,
          };
          //encoding
          let data = [];
          let target = [];
          const iface = new Interface(ISwapRouterV3.abi);
          data.push(
            iface.encodeFunctionData("exactInputSingle", [
              ExactInputSingleParams,
            ])
          );
          target.push(arbAddressList.uniswapRouterAddress);
          // execute
          await accountManagerContract.exec(
            activeAccount,
            target,
            amountIn, // change to ZERO if the paycoin is WETH (here it's payable because swaping from native ETH )
            data,
            { gasLimit: 2300000 }
          );
        } else {
          // ANYTOKEN <=> ANYTOKEN
          //struct
          const ExactInputSingleParams = {
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            fee: fee,
            recipient: arbAddressList.uniswapRouterAddress,
            amountIn: amountIn,
            amountOutMinimum: amountOut,
            sqrtPriceLimitX96: sqrtPriceLimitX96,
          };

          // Approve
          await accountManagerContract.approve(
            activeAccount,
            tokenIn,
            arbAddressList.uniswapRouterAddress,
            amountIn
          );

          await sleep(3000);
          let data = [];
          let target = [];

          const iface = new Interface(ISwapRouterV3.abi);
          data.push(
            iface.encodeFunctionData("exactInputSingle", [
              ExactInputSingleParams,
            ])
          );
          target.push(arbAddressList.uniswapRouterAddress);
          // execute
          await accountManagerContract.exec(activeAccount, target, 0, data, {
            gasLimit: 2300000,
          });
        }
      } else if (currentNetwork.id === OPTIMISM_NETWORK) {
        const signer = await library?.getSigner();
        // struct Data
        const tokenIn = opTokensAddress[payCoin.name];
        const tokenOut = opTokensAddress[receiveCoin.name];
        const fee = 3000;
        const amountIn = formatStringToUnits(payCoin.name, Number(payInput));
        const amountOut = 0;
        const sqrtPriceLimitX96 = 0;

        // Instance
        const accountManagerContract = new Contract(
          opAddressList.accountManagerContractAddress,
          AccountManagerOp.abi,
          signer
        );
        const SwapRouterContract = new Contract(
          opAddressList.uniswapRouterAddress,
          ISwapRouterV3.abi,
          signer
        );
        // TODO: not using eth as amount out also
        // if (
        //   //AnyToken <=> WETH
        //   (payCoin.name === "WBTC" ||
        //     payCoin.name === "DAI" ||
        //     payCoin.name === "USDT" ||
        //     payCoin.name === "USDC") &&
        //   tokenOut === opAddressList.wethTokenAddress
        // ) {
        //   //struct
        //   const ExactInputSingleParams = {
        //     tokenIn: tokenIn,
        //     tokenOut: tokenOut,
        //     fee: fee,
        //     recipient: opAddressList.uniswapRouterAddress, // here 1st reciver is router and then unwrap happen
        //     amountIn: amountIn,
        //     amountOutMinimum: amountOut,
        //     sqrtPriceLimitX96: sqrtPriceLimitX96,
        //   };
        //   // @TODO: check allowance
        //   // Approve
        //   await accountManagerContract.approve(
        //     activeAccount,
        //     tokenIn,
        //     opAddressList.uniswapRouterAddress,
        //     amountIn
        //   );

        //   await sleep(3000);
        //   // swapping from anycoin to WETH and WETH to ETH
        //   let data = [];
        //   let target = [];
        //   let multiData = [];

        //   // combine two transaction exactInputSingle and unwrapWETH9
        //   const iface = new Interface(ISwapRouterV3.abi);
        //   multiData.push(
        //     iface.encodeFunctionData("exactInputSingle", [
        //       ExactInputSingleParams,
        //     ])
        //   );
        //   multiData.push(
        //     iface.encodeFunctionData("unwrapWETH9(uint256,address)", [
        //       0,
        //       activeAccount,
        //     ])
        //   );

        //   // adding that combine transaction
        //   data.push(
        //     iface.encodeFunctionData("multicall(bytes[])", [multiData])
        //   );
        //   target.push(opAddressList.uniswapRouterAddress);

        //   // execute
        //   await accountManagerContract.exec(
        //     activeAccount,
        //     target,
        //     0, // amount in is anytoken
        //     data,
        //     { gasLimit: 2300000 }
        //   );
        // }
        //TODO: not using native WETH that's way
        // else if (payCoin.name === "ETH") {
        //   console.log("Here at WETH");
        //   // WETH <=> AnyToken native ETH
        //   // struct
        //   const ExactInputSingleParams = {
        //     tokenIn: tokenIn,
        //     tokenOut: tokenOut,
        //     fee: fee,
        //     recipient: activeAccount,
        //     amountIn: amountIn,
        //     amountOutMinimum: amountOut,
        //     sqrtPriceLimitX96: sqrtPriceLimitX96,
        //   };
        //   //encoding
        //   let data = [];
        //   let target = [];
        //   const iface = new Interface(ISwapRouterV3.abi);
        //   data.push(
        //     iface.encodeFunctionData("exactInputSingle", [
        //       ExactInputSingleParams,
        //     ])
        //   );
        //   target.push(opAddressList.uniswapRouterAddress);
        //   // execute
        //   await accountManagerContract.exec(
        //     activeAccount,
        //     target,
        //     amountIn, // change to ZERO if the paycoin is WETH (here it's payable because swaping from native ETH )
        //     data,
        //     { gasLimit: 2300000 }
        //   );
        console.log("Here at WETH");
        // ANYTOKEN <=> ANYTOKEN
        //struct
        const ExactInputSingleParams = {
          tokenIn: tokenIn,
          tokenOut: tokenOut,
          fee: fee,
          recipient: opAddressList.uniswapRouterAddress,
          amountIn: amountIn,
          amountOutMinimum: amountOut,
          sqrtPriceLimitX96: sqrtPriceLimitX96,
        };

        // Approve
        await accountManagerContract.approve(
          activeAccount,
          tokenIn,
          opAddressList.uniswapRouterAddress,
          amountIn
        );
        await sleep(3000);
        let data = [];
        let target = [];

        const iface = new Interface(ISwapRouterV3.abi);
        data.push(
          iface.encodeFunctionData("exactInputSingle", [ExactInputSingleParams])
        );
        target.push(opAddressList.uniswapRouterAddress);
        // execute
        await accountManagerContract.exec(activeAccount, target, 0, data, {
          gasLimit: 2300000,
        });
      }
      // setPayBalance(ceilWithPrecision(balList[payCoin], 6));
      // setReceiveBalance(ceilWithPrecision(balList[receiveCoin], 6));

      // setPayBalance(ceilWithPrecision(balList[payCoin], 6));
      // setReceiveBalance(ceilWithPrecision(balList[receiveCoin], 6);

      await sleep(5000);
      addNotification("success", "Transaction Successful!");
    } catch (e) {
      console.error(e);
      addNotification("error", "Something went wrong, Please try again.");
    }

    setPayInput("");
    setReceiveInput("");
    setLoading(false);
    await balanceFetch();
  };

  const handlePayBalanceClick = () => {
    setPayInput(String(payBalance));
  };

  return (
    <div className="w-full lg:w-[35rem] xl:w-[40rem] mx-auto text-baseBlack dark:text-baseWhite">
      <p className="text-4xl font-bold mb-6">Spot</p>

      <div className="bg-baseComplementary dark:bg-baseDarkComplementary rounded-3xl p-4 relative mb-4">
        <div className="bg-white dark:bg-baseDark rounded-2xl p-4 mb-1">
          <div className="text-lg">From</div>
          <div className="flex justify-between mb-2">
            <div className="flex flex-col">
              <input
                value={payInput}
                onChange={(e) => updatePayInput(e.target.value)}
                className="w-full text-[2.5rem] font-medium outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none dark:bg-baseDark"
                placeholder="0"
                autoComplete="off"
                autoCorrect="off"
                type="number"
                min={0}
              />
            </div>
            <div className="flex">
              <TokenDropdown
                onSelect={handleFromSelect}
                defaultValue={payCoin}
                options={[ethPoolObj, ...poolsPlaceholder]}
              />
            </div>
          </div>
          <div className="mt-2 flex justify-between text-base">
            <div>{formatUSD(payAmountInDollar)}</div>
            <div>
              {payBalance !== undefined ? (
                <span onClick={handlePayBalanceClick}>
                  {payBalance + " " + payCoin.name}
                </span>
              ) : (
                "-"
              )}
            </div>
          </div>
        </div>

        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="w-16 h-16 bg-baseComplementary dark:bg-baseDarkComplementary rounded-full flex items-center justify-center p-1">
            <div className="w-full h-full bg-white dark:bg-baseDark rounded-full flex items-center justify-center">
              <Image src="/vanna-logo.svg" width={26} height={24} alt="Vanna" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-baseDark rounded-2xl p-4">
          <div className="text-lg">To</div>
          <div className="flex justify-between mb-2">
            <div className="flex flex-col">
              <input
                value={receiveInput}
                // onChange={(e) => setReceiveInput(e.target.value)}
                className="w-full text-[2.5rem] font-medium outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none dark:bg-baseDark"
                placeholder="0"
                autoComplete="off"
                autoCorrect="off"
                type="number"
                min={0}
              />
            </div>
            <div className="flex">
              <TokenDropdown
                onSelect={handleToSelect}
                defaultValue={receiveCoin}
                options={[ethPoolObj, ...poolsPlaceholder]}
              />
            </div>
          </div>
          <div className="mt-2 flex justify-between text-base">
            <div>{formatUSD(receiveAmountInDollar)}</div>
            <div>
              {receiveBalance !== undefined
                ? receiveBalance + " " + receiveCoin.name
                : "-"}
            </div>
          </div>
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
      {account && activeAccount !== undefined && !loading && disableBtn && (
        <button className="w-full bg-neutral-500 text-white py-3 rounded-2xl font-semibold text-xl mb-6">
          {btnValue}
        </button>
      )}
      {account && activeAccount !== undefined && !loading && !disableBtn && (
        <button
          className="w-full bg-purple text-white py-3 rounded-2xl font-semibold text-xl mb-6"
          onClick={spot}
        >
          {btnValue}
        </button>
      )}

      {payInput !== "" && Number(payInput) > 0 && (
        <div className="w-full lg:max-w-md mx-auto bg-white dark:bg-baseDark rounded-lg p-6">
          <div
            className="flex justify-between items-center cursor-pointer"
            onClick={toggleOpen}
          >
            <span className="text-base font-medium">
              {payInput} {payCoin.name} ≈ {receiveInput} {receiveCoin.name}
              {/* ({ TODO: ask what to add here }) */}
            </span>
            {isOpen ? <CaretUp size={20} /> : <CaretDown size={20} />}
          </div>

          {isOpen && (
            <div className="mt-4 space-y-2 text-sm text-neutral-500">
              <div className="flex justify-between">
                <span>Max Slippage</span>
                <span>{maxSlippage ? maxSlippage : "-"}</span>
              </div>
              <div className="flex justify-between">
                <span>Receive at least</span>
                <span>{receiveAtLeast ? receiveAtLeast : "-"}</span>
              </div>
              <div className="flex justify-between">
                <span>Fee</span>
                <span>{fee ? fee : "-"}</span>
              </div>
              <div className="flex justify-between">
                <span>Network cost</span>
                <span className="flex items-center">
                  <Lightning size={16} className="text-purple-500 mr-1" />
                  {networkCost ? networkCost : "-"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Order routing</span>
                <span>{orderRouting ? orderRouting : "-"}</span>
              </div>
            </div>
          )}
        </div>
      )}

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
}
