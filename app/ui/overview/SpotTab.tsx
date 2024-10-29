import { useEffect, useState } from "react";
import InfoRow from "./InfoRowProps";

const SpotTab: React.FC = () => {
  const [ETH, setETH] = useState("");
  const [WETH, setWETH] = useState("");
  const [BTC, setBTC] = useState("");
  const [USDC, setUSDC] = useState("");
  const [USDT, setUSDT] = useState("");
  const [DAI, setDAI] = useState("");

  // TODO: delete below useEffect
  useEffect(() => {

    // TODO: @vatsal this is page for spot in borrow dashboard in overview page. Add code here for balance fetching

    try {
    //   if (activeAccount && currentNetwork) {
    //     const signer = await library?.getSigner();

    //     let daiContract;
    //     let wethContract;
    //     let usdcContract;
    //     let usdtContract;
    //     let wbtcContract;
    //     let vEtherContract;
    //     let vDaiContract;
    //     let vUsdcContract;
    //     let vUsdtContract;
    //     let vWbtcContract;

    //     if (currentNetwork.id === ARBITRUM_NETWORK) {
    //       daiContract = new Contract(
    //         arbAddressList.daiTokenAddress,
    //         ERC20.abi,
    //         signer
    //       );
    //       usdcContract = new Contract(
    //         arbAddressList.usdcTokenAddress,
    //         ERC20.abi,
    //         signer
    //       );
    //       usdtContract = new Contract(
    //         arbAddressList.usdtTokenAddress,
    //         ERC20.abi,
    //         signer
    //       );
    //       wethContract = new Contract(
    //         arbAddressList.wethTokenAddress,
    //         ERC20.abi,
    //         signer
    //       );
    //       wbtcContract = new Contract(
    //         arbAddressList.wbtcTokenAddress,
    //         ERC20.abi,
    //         signer
    //       );
    //       vEtherContract = new Contract(
    //         arbAddressList.vEtherContractAddress,
    //         VEther.abi,
    //         signer
    //       );
    //       vDaiContract = new Contract(
    //         arbAddressList.vDaiContractAddress,
    //         VToken.abi,
    //         signer
    //       );
    //       vUsdcContract = new Contract(
    //         arbAddressList.vUSDCContractAddress,
    //         VToken.abi,
    //         signer
    //       );
    //       vUsdtContract = new Contract(
    //         arbAddressList.vUSDTContractAddress,
    //         VToken.abi,
    //         signer
    //       );
    //       vWbtcContract = new Contract(
    //         arbAddressList.vWBTCContractAddress,
    //         VToken.abi,
    //         signer
    //       );
    //     } else if (currentNetwork.id === OPTIMISM_NETWORK) {
    //       daiContract = new Contract(
    //         opAddressList.daiTokenAddress,
    //         ERC20.abi,
    //         signer
    //       );
    //       usdcContract = new Contract(
    //         opAddressList.usdcTokenAddress,
    //         ERC20.abi,
    //         signer
    //       );
    //       usdtContract = new Contract(
    //         opAddressList.usdtTokenAddress,
    //         ERC20.abi,
    //         signer
    //       );
    //       wethContract = new Contract(
    //         opAddressList.wethTokenAddress,
    //         ERC20.abi,
    //         signer
    //       );
    //       wbtcContract = new Contract(
    //         opAddressList.wbtcTokenAddress,
    //         ERC20.abi,
    //         signer
    //       );
    //       vEtherContract = new Contract(
    //         opAddressList.vEtherContractAddress,
    //         VEther.abi,
    //         signer
    //       );
    //       vDaiContract = new Contract(
    //         opAddressList.vDaiContractAddress,
    //         VToken.abi,
    //         signer
    //       );
    //       vUsdcContract = new Contract(
    //         opAddressList.vUSDCContractAddress,
    //         VToken.abi,
    //         signer
    //       );
    //       vUsdtContract = new Contract(
    //         opAddressList.vUSDTContractAddress,
    //         VToken.abi,
    //         signer
    //       );
    //       vWbtcContract = new Contract(
    //         opAddressList.vWBTCContractAddress,
    //         VToken.abi,
    //         signer
    //       );
    //     } else if (currentNetwork.id === BASE_NETWORK) {
    //     }

    //     if (
    //       !daiContract ||
    //       !wethContract ||
    //       !usdcContract ||
    //       !usdtContract ||
    //       !wbtcContract ||
    //       !vEtherContract ||
    //       !vDaiContract ||
    //       !vUsdcContract ||
    //       !vUsdtContract ||
    //       !vWbtcContract
    //     )
    //       return;

    //     let accountBalance;
    //     if (tokenName === "WETH") {
    //       accountBalance = await library?.getBalance(activeAccount);
    //       console.log(accountBalance, waccountBalance, tokenName);
    //       // accountBalance = Number(accountBalance) + Number(waccountBalance);
    //     } else if (tokenName === "WBTC") {
    //       accountBalance = await usdcContract.balanceOf(activeAccount);
    //     } else if (tokenName === "USDC") {
    //       accountBalance = await wbtcContract.balanceOf(activeAccount);
    //     } else if (tokenName === "USDT") {
    //       accountBalance = await usdtContract.balanceOf(activeAccount);
    //     } else if (tokenName === "DAI") {
    //       accountBalance = await daiContract.balanceOf(activeAccount);
    //     }

    //     console.log(accountBalance, tokenName);
    //   }
    // } catch (e) {
    //   console.error(e);
    // }

    setETH("");
    setWETH("");
    setBTC("");
    setUSDC("");
    setUSDT("");
    setDAI("");
  }, []);

  return (
    <div className="grid grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-5">
      <InfoRow label="ETH" value={ETH} />
      <InfoRow label="WETH" value={WETH} />
      <InfoRow label="BTC" value={BTC} />
      <InfoRow label="USDC" value={USDC} />
      <InfoRow label="USDT" value={USDT} />
      <InfoRow label="DAI" value={DAI} />
    </div>
  );
};

export default SpotTab;
