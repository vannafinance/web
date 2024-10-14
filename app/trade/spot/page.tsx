/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

// import { useNetwork } from "@/app/context/network-context";
import {
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
import { poolsPlaceholder } from "@/app/lib/static-values";
import { CaretDown, CaretUp, Lightning } from "@phosphor-icons/react";
import { useWeb3React } from "@web3-react/core";
import { Contract } from "ethers";
import { Interface } from "ethers/lib/utils";
import Image from "next/image";
import { useEffect, useState } from "react";

import AccountManager from "../../abi/vanna/v1/out/AccountManager.sol/AccountManager.json";
import AccountManagerOp from "../../abi/vanna/v1/out/AccountManager-op.sol/AccountManager-op.json";
import ERC20 from "../../abi/vanna/v1/out/ERC20.sol/ERC20.json";
import ISwapRouterV3 from "../../abi/vanna/v1/out/ISwapRouterV3.sol/ISwapRouterV3.json";
import Registry from "../../abi/vanna/v1/out/Registry.sol/Registry.json";
import { ARBITRUM_NETWORK, BASE_NETWORK, OPTIMISM_NETWORK } from "@/app/lib/constants";
import { useNetwork } from "@/app/context/network-context";

export default function Page() {
  const { account, library } = useWeb3React();
  const [activeAccount, setActiveAccount] = useState();
  const { currentNetwork } = useNetwork();
  const [loading, setLoading] = useState(false);
  const [disableBtn, setDisableBtn] = useState(true);
  const [btnValue, setBtnValue] = useState("Enter an amount");

  const [payInput, setPayInput] = useState<number | undefined>();
  const [receiveInput, setReceiveInput] = useState<number | undefined>();
  const [isOpen, setIsOpen] = useState(false);
  const [payCoin, setPayCoin] = useState(poolsPlaceholder[0]);
  const [receiveCoin, setReceiveCoin] = useState(poolsPlaceholder[2]);
  const [balList, setBalList] = useState<{ [key: string]: string } | undefined>(
    undefined
  );
  const [payBalance, setPayBalance] = useState<number | undefined>();
  // const [receiveBalance, setReceiveBalance] = useState<number | undefined>();
  const [payAmountInDollar, setPayAmountInDollar] = useState<
    number | undefined
  >();
  const [receiveAmountInDollar, setReceiveAmountInDollar] = useState<
    number | undefined
  >();
  const [maxSlippage, setMaxSlippage] = useState<string | undefined>();
  const [receiveAtLeast, setReceiveAtLeast] = useState<string | undefined>();
  const [fee, setFee] = useState<string | undefined>();
  const [networkCost, setNetworkCost] = useState<string | undefined>();
  const [orderRouting, setOrderRouting] = useState<string | undefined>();

  const toggleOpen = () => setIsOpen(!isOpen);

  const handleFromSelect = (token: PoolTable) => {
    setPayCoin(token);
  };

  const handleToSelect = (token: PoolTable) => {
    setReceiveCoin(token);
  };

  const accountCheck = async () => {
    if (localStorage.getItem("isWalletConnected") === "true") {
      if (account) {
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
    setLoading(false);
  };

  useEffect(() => {
    accountCheck();
  }, [account, library]);

  const balanceFetch = async () => {
    try {
      if (activeAccount) {
        const signer = await library?.getSigner();
        const daiContract = new Contract(
          arbAddressList.daiTokenAddress,
          ERC20.abi,
          signer
        );
        const usdcContract = new Contract(
          arbAddressList.usdcTokenAddress,
          ERC20.abi,
          signer
        );
        const usdtContract = new Contract(
          arbAddressList.usdtTokenAddress,
          ERC20.abi,
          signer
        );
        const wbtcContract = new Contract(
          arbAddressList.wbtcTokenAddress,
          ERC20.abi,
          signer
        );

        const ethBalOfSA = await library?.getBalance(activeAccount);
        const daiBalOfSA = await daiContract.balanceOf(activeAccount);
        const usdcBalOfSA = await usdcContract.balanceOf(activeAccount);
        const usdtBalOfSA = await usdtContract.balanceOf(activeAccount);
        const wbtcBalOfSA = await wbtcContract.balanceOf(activeAccount);

        const listOfBalance: { [key: string]: string } = {};

        listOfBalance["WETH"] = formatBignumberToUnits("WETH", ethBalOfSA);
        listOfBalance["WBTC"] = formatBignumberToUnits("WBTC", daiBalOfSA);
        listOfBalance["USDC"] = formatBignumberToUnits("USDC", usdcBalOfSA);
        listOfBalance["USDT"] = formatBignumberToUnits("USDT", usdtBalOfSA);
        listOfBalance["DAI"] = formatBignumberToUnits("DAI", wbtcBalOfSA);

        // setBalList(listOfBalance);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    balanceFetch();
  }, [activeAccount]);

  useEffect(() => {
    // update setToCoin, setPayInDollarAmount, setRecieveInDollarAmount
  }, [payInput]);

  useEffect(() => {
    if (balList !== undefined) {
      const bal = Number(balList[payCoin.name]);
      setPayBalance(bal);
    }
  }, [payCoin, balList]);

  useEffect(() => {
    const tokenName = payCoin.name ? payCoin.name : "";
    if (payInput === undefined || payInput <= 0) {
      setBtnValue("Enter an amount");
      setDisableBtn(true);
    } else if (payBalance && payInput && payBalance * 1.0 < payInput * 1.0) {
      setBtnValue("Insufficient " + tokenName + " balance");
      setDisableBtn(true);
    } else {
      setBtnValue(tokenName === "WETH" ? "Swap" : "Approve - Swap");
      setDisableBtn(false);
    }
  }, [payInput, payBalance, payCoin]);

  const spot = async () => {
    try {
      if (!payInput) {
        return;
      }
      if (currentNetwork.id === ARBITRUM_NETWORK) {
        const signer = await library?.getSigner();
        // struct Data
        const tokenIn = arbTokensAddress[payCoin.name];
        const tokenOut = arbTokensAddress[receiveCoin.name];
        const fee = 3000;
        const amountIn = formatStringToUnits(payCoin.name, payInput);
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

        await sleep(3000);
        await balanceFetch();
        setPayInput(undefined);
        setReceiveInput(undefined);
      } else if (currentNetwork.id === OPTIMISM_NETWORK) {
        const signer = await library?.getSigner();
        // struct Data
        const tokenIn = opTokensAddress[payCoin.name];
        const tokenOut = opTokensAddress[receiveCoin.name];
        const fee = 3000;
        const amountIn = formatStringToUnits(payCoin.name, payInput);
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

        if (
          //AnyToken <=> WETH
          (payCoin.name === "WBTC" ||
            payCoin.name === "DAI" ||
            payCoin.name === "USDT" ||
            payCoin.name === "USDC") &&
          tokenOut === opAddressList.wethTokenAddress
        ) {
          
          
          //struct
          const ExactInputSingleParams = {
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            fee: fee,
            recipient: opAddressList.uniswapRouterAddress, // here 1st reciver is router and then unwrap happen
            amountIn: amountIn,
            amountOutMinimum: amountOut,
            sqrtPriceLimitX96: sqrtPriceLimitX96,
          };
          // @TODO: check allowance
          // Approve
          await accountManagerContract.approve(
            activeAccount,
            tokenIn,
            opAddressList.uniswapRouterAddress,
            amountIn
          );

          await sleep(3000);
          // swapping from anycoin to WETH and WETH to ETH
          let data = [];
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
          target.push(opAddressList.uniswapRouterAddress);
          console.log('here', ExactInputSingleParams);
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
          target.push(opAddressList.uniswapRouterAddress);
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
            iface.encodeFunctionData("exactInputSingle", [
              ExactInputSingleParams,
            ])
          );
          target.push(opAddressList.uniswapRouterAddress);
          // execute
          await accountManagerContract.exec(activeAccount, target, 0, data, {
            gasLimit: 2300000,
          });
        }

        await sleep(3000);
        await balanceFetch();
        setPayInput(undefined);
        setReceiveInput(undefined);
        // setPayBalance(ceilWithPrecision(balList[payCoin], 6));
        // setReceiveBalance(ceilWithPrecision(balList[receiveCoin], 6));
      }

      // setPayBalance(ceilWithPrecision(balList[payCoin], 6));
      // setReceiveBalance(ceilWithPrecision(balList[receiveCoin], 6);
    } catch (e) {
      console.error(e);
    }
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
                onChange={(e) => setPayInput(Number(e.target.value))}
                className="w-full text-[2.5rem] font-medium outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none dark:bg-baseDark"
                placeholder="0"
                inputMode="decimal"
                autoComplete="off"
                autoCorrect="off"
                type="text"
                pattern="^[0-9]*[.,]?[0-9]*$"
                minLength={1}
                maxLength={79}
              />
            </div>
            <div className="flex">
              <TokenDropdown
                onSelect={handleFromSelect}
                defaultValue={payCoin}
              />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-medium">
              {payAmountInDollar ? payAmountInDollar : "-"}
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
                inputMode="decimal"
                autoComplete="off"
                autoCorrect="off"
                type="text"
                pattern="^[0-9]*[.,]?[0-9]*$"
                minLength={1}
                maxLength={79}
              />
            </div>
            <div className="flex">
              <TokenDropdown
                onSelect={handleToSelect}
                defaultValue={receiveCoin}
              />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-medium">
              {receiveAmountInDollar ? receiveAmountInDollar : "-"}
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
          // onClick={() => setIsModalOpen(true)}
        >
          Create your Smart Account
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

      {payInput !== undefined && payInput > 0 && (
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
    </div>
  );
}
