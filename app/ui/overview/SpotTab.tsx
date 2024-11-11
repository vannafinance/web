import { useEffect, useState } from "react";
import InfoRow from "./InfoRowProps";
import { useWeb3React } from "@web3-react/core";
import { useNetwork } from "@/app/context/network-context";
import {
  ARBITRUM_NETWORK,
  OPTIMISM_NETWORK,
  BASE_NETWORK,
} from "@/app/lib/constants";
import {
  arbAddressList,
  opAddressList,
  baseAddressList,
} from "@/app/lib/web3-constants";
import { Contract } from "ethers";
import ERC20 from "../../abi/vanna/v1/out/ERC20.sol/ERC20.json";
import Registry from "../../abi/vanna/v1/out/Registry.sol/Registry.json";
import VEther from "../../abi/vanna/v1/out/VEther.sol/VEther.json";
import VToken from "../../abi/vanna/v1/out/VToken.sol/VToken.json";

const SpotTab: React.FC = () => {
  const { account, library } = useWeb3React();
  const { currentNetwork } = useNetwork();
  const [activeAccount, setActiveAccount] = useState<string | undefined>();

  const [ETH, setETH] = useState("");
  const [WETH, setWETH] = useState("");
  const [BTC, setBTC] = useState("");
  const [USDC, setUSDC] = useState("");
  const [USDT, setUSDT] = useState("");
  const [DAI, setDAI] = useState("");

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
    // TODO: @vatsal this is page for spot in borrow dashboard in overview page. Add code here for balance fetching

    const fetchValues = async () => {
      try {
        if (activeAccount && currentNetwork) {
          const signer = await library?.getSigner();

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

          // ethAccountBalance = await library?.getBalance(activeAccount);
          // console.log(accountBalance, waccountBalance, tokenName);
          // // accountBalance = Number(accountBalance) + Number(waccountBalance);

          // ethAccountBalance = await usdcContract.balanceOf(activeAccount);

          // console.log(accountBalance, tokenName);

          setETH("");
          setWETH("");
          setBTC("");
          setUSDC("");
          setUSDT("");
          setDAI("");
        }
      } catch (e) {
        console.error(e);
      }
    };

    fetchValues();
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
