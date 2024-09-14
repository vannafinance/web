/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useNetwork } from "@/app/context/network-context";
import { ceilWithPrecision, formatBignumberToUnits, formatStringToUnits, sleep } from "@/app/lib/helper";
import { arbAddressList, arbTokensAddress } from "@/app/lib/web3-constants";
import TokenDropdown from "@/app/ui/components/token-dropdown";
import { CaretDown, CaretUp, Lightning } from "@phosphor-icons/react";
import { useWeb3React } from "@web3-react/core";
import { Contract } from "ethers";
import { Interface } from "ethers/lib/utils";
import Image from "next/image";
import { useEffect, useState } from "react";

import AccountManager from "../../abi/vanna/v1/out/AccountManager.sol/AccountManager.json";
import ERC20 from "../../abi/vanna/v1/out/ERC20.sol/ERC20.json";
import ISwapRouterV3 from "../../abi/vanna/v1/out/ISwapRouterV3.sol/ISwapRouterV3.json";
import Registry from "../../abi/vanna/v1/out/Registry.sol/Registry.json";

export default function Page() {
  const { account, library } = useWeb3React();
  const [activeAccount, setActiveAccount] = useState();
  const { currentNetwork } = useNetwork();
  const [payInput, setPayInput] = useState("");
  const [receiveInput, setReceiveInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [payCoin, setPayCoin] = useState("WETH");
  const [receiveCoin, setReceiveCoin] = useState("USDC");
  const [balList, setBalList] = useState<{ [key: string]: string } | undefined>(undefined);
  const [payBalance, setPayBalance] = useState();
  const [receiveBalance, setReceiveBalance] = useState();

  const toggleOpen = () => setIsOpen(!isOpen);

  const handleFromSelect = (token: PoolTable) => {
    console.log("Selected token:", token);
    setPayCoin(token.name)
  };
  

  const handleToSelect = (token: PoolTable) => {
    console.log("Selected token:", token);
  };
  const accountCheck = async () => {
    if (localStorage?.getItem("isWalletConnected") === "true") {
      if (account && !activeAccount) {
        try {
          const signer = await library?.getSigner();

          const regitstryContract = new Contract(
            arbAddressList.registryContractAddress,
            Registry.abi,
            signer
          );

          const accountsArray = await regitstryContract.accountsOwnedBy(account);
          let tempAccount;

          if (accountsArray.length > 0) {
            tempAccount = accountsArray[0];
            setActiveAccount(tempAccount);
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
  };

  useEffect(() => {
    accountCheck();
  }, [account, library]);

  const balanceFetch = async () => {
    try {
      if (activeAccount) {
        const signer = await library?.getSigner();
        const daiContract = new Contract(arbAddressList.daiTokenAddress, ERC20.abi, signer);
        const usdcContract = new Contract(arbAddressList.usdcTokenAddress, ERC20.abi, signer);
        const usdtContract = new Contract(arbAddressList.usdtTokenAddress, ERC20.abi, signer);
        const wbtcContract = new Contract(arbAddressList.wbtcTokenAddress, ERC20.abi, signer);

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

        setBalList(listOfBalance);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    balanceFetch();
  }, [activeAccount]);

  const spot = async () => {
    
    try {
      const signer = await library?.getSigner();
      // struct Data
      const tokenIn = arbTokensAddress[payCoin];
      const tokenOut = arbTokensAddress[receiveCoin];
      const fee = 3000;
      const amountIn = formatStringToUnits(payCoin, Number(payInput.toString()));
      const amountOut = 0;
      const sqrtPriceLimitX96 = 0;
      console.log("spottttttt");

      // Instance
      const accountManagerContract = new Contract(
        arbAddressList.accountManagerContractAddress,
        AccountManager.abi,
        signer
      );
      console.log(activeAccount);
      // const SwapRouterContract = new Contract(
      //   arbAddressList.uniswapRouterAddress,
      //   ISwapRouterV3.abi,
      //   signer
      // )
      console.log(activeAccount);
      console.log(payCoin);
      
      if ( //AnyToken <=> WETH
        (payCoin === "WBTC" || 
         payCoin === "DAI" || 
         payCoin === "USDT" || 
         payCoin === "USDC") && 
         tokenOut === arbAddressList.wethTokenAddress
    ){
        console.log("works");
        
        //struct
        const ExactInputSingleParams = {
          tokenIn: tokenIn,
          tokenOut: tokenOut,
          fee: fee,
          recipient: arbAddressList.uniswapRouterAddress,  // here 1st reciver is router and then unwrap happen 
          amountIn: amountIn,
          amountOutMinimum: amountOut,
          sqrtPriceLimitX96: sqrtPriceLimitX96,
        }
        // @TODO: check allowance 
        // Approve
        await accountManagerContract.approve(
          activeAccount,
          tokenIn,
          arbAddressList.uniswapRouterAddress,
          amountIn
        );
        console.log(activeAccount);
        await sleep(3000);
        // swapping from anycoin to WETH and WETH to ETH 
        const data = [];
        let target = [];
        let multiData = [];
        
        // combine two transaction exactInputSingle and unwrapWETH9
        const iface = new Interface(ISwapRouterV3.abi);
        multiData.push(iface.encodeFunctionData("exactInputSingle", [ExactInputSingleParams]));
        multiData.push(iface.encodeFunctionData("unwrapWETH9(uint256,address)",
                                                  [0, activeAccount]
                                                ));

        // adding that combine transaction                                         
        data.push(iface.encodeFunctionData("multicall(bytes[])",
                                            [multiData]
                                          ));                          
        target.push(arbAddressList.uniswapRouterAddress)

        // execute
        await accountManagerContract.exec(
          activeAccount,
          target,
          0,  // amount in is anytoken 
          data,
          { gasLimit: 2300000 }
        );
      } else if (payCoin === "WETH") { // WETH <=> AnyToken native ETH
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
        data.push(iface.encodeFunctionData("exactInputSingle", [ExactInputSingleParams]));
        target.push(arbAddressList.uniswapRouterAddress);
        // execute
        await accountManagerContract.exec(
          activeAccount,
          target,
          amountIn, // change to ZERO if the paycoin is WETH (here it's payable because swaping from native ETH )
          data,
          { gasLimit: 2300000 }
        );
      } else{
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
        }
        
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
        data.push(iface.encodeFunctionData("exactInputSingle", [ExactInputSingleParams]));                          
        target.push(arbAddressList.uniswapRouterAddress)
        // execute
        await accountManagerContract.exec(
          activeAccount,
          target,
          0,
          data,
          { gasLimit: 2300000 }
        );
      } 

      await sleep(3000);
      await balanceFetch();
      setPayInput("");
      setReceiveInput("");
      // setPayBalance(ceilWithPrecision(balList[payCoin], 6));
      // setReceiveBalance(ceilWithPrecision(balList[receiveCoin], 6);
    } catch (e) {
      console.error(e);
    }

  };



  return (
    <div className="w-full md:w-[40rem] mx-auto">
      <p className="text-4xl font-bold mb-8">Spot</p>

      <div className="bg-baseComplementary rounded-3xl p-4 relative mb-4">
        <div className="bg-white rounded-2xl p-4 mb-1">
          <div className="text-baseBlack text-lg">From</div>
          <div className="flex justify-between mb-2">
            <div className="flex flex-col">
              <input
                type="number"
                value={payInput}
                onChange={(e) => setPayInput(e.target.value)}
                className="w-full text-baseBlack text-[2.5rem] font-medium outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="0"
              />
            </div>
            <div className="flex">
              <TokenDropdown
                onSelect={handleFromSelect}
              />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-medium">$30.12</div>
          </div>
        </div>

        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="w-16 h-16 bg-baseComplementary rounded-full flex items-center justify-center p-1">
            <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
              <Image src="/vanna-logo.svg" width={26} height={24} alt="Vanna" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4">
          <div className="text-baseBlack text-lg">To</div>
          <div className="flex justify-between mb-2">
            <div className="flex flex-col">
              <input
                type="number"
                value={receiveInput}
                // onChange={(e) => setReceiveInput(e.target.value)}
                className="w-full text-baseBlack text-[2.5rem] font-medium outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="0"
              />
            </div>
            <div className="flex">
              <TokenDropdown
                onSelect={handleToSelect}
              />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-medium">$30.12</div>
          </div>
        </div>
      </div>

      <button className="w-full bg-purple text-white py-3 rounded-2xl font-semibold text-xl mb-2 "onClick={spot}>
        Swap
      </button>

      <div className="w-full max-w-md mx-auto bg-white rounded-lg p-4">
        <div
          className="flex justify-between items-center cursor-pointer"
          onClick={toggleOpen}
        >
          <span className="text-base font-medium">
            1 USDC ≈ 0.00042 WETH ($1.00)
          </span>
          {isOpen ? <CaretUp size={20} /> : <CaretDown size={20} />}
        </div>

        {isOpen && (
          <div className="mt-4 space-y-2 text-sm text-neutral-500">
            <div className="flex justify-between">
              <span>Max Slippage</span>
              <span>0.5%</span>
            </div>
            <div className="flex justify-between">
              <span>Receive at least</span>
              <span>1150 USDC</span>
            </div>
            <div className="flex justify-between">
              <span>Fee</span>
              <span>$2.300</span>
            </div>
            <div className="flex justify-between">
              <span>Network cost</span>
              <span className="flex items-center">
                <Lightning size={16} className="text-purple-500 mr-1" />
                $0.10
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Order routing</span>
              <span>5x</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
