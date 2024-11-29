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
import { ceilWithPrecision } from "@/app/lib/helper";
import Loader from "../components/loader";

const SpotTab: React.FC = () => {
  const { account, library } = useWeb3React();
  const { currentNetwork } = useNetwork();
  const [activeAccount, setActiveAccount] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

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
      setLoading(true);

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

          const ethAccountBalance =
            (await library?.getBalance(activeAccount)) / 1e18;
          const wethAccounBalance =
            (await wethContract.balanceOf(activeAccount)) / 1e18;
          const wbtcAccounBalance =
            (await wbtcContract.balanceOf(activeAccount)) / 1e18;
          const usdcAccounBalance =
            (await usdcContract.balanceOf(activeAccount)) / 1e6;
          const usdtAccounBalance =
            (await usdtContract.balanceOf(activeAccount)) / 1e6;
          const daiAccounBalance =
            (await daiContract.balanceOf(activeAccount)) / 1e18;

          setETH(ceilWithPrecision(String(ethAccountBalance)));
          setWETH(ceilWithPrecision(String(wethAccounBalance)));
          setBTC(ceilWithPrecision(String(wbtcAccounBalance)));
          setUSDC(ceilWithPrecision(String(usdcAccounBalance)));
          setUSDT(ceilWithPrecision(String(usdtAccounBalance)));
          setDAI(ceilWithPrecision(String(daiAccounBalance)));
        }
      } catch (e) {
        console.error(e);
      }

      setLoading(false);
    };

    fetchValues();
  }, [activeAccount, currentNetwork]);

  return (
    <div className="grid grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-5">
      {loading ? (
        <Loader />
      ) : (
        <InfoRow label="ETH" value={ETH ? ETH + " ETH" : ""} />
      )}
      {loading ? (
        <Loader />
      ) : (
        <InfoRow label="WETH" value={WETH ? WETH + " WETH" : ""} />
      )}
      {loading ? (
        <Loader />
      ) : (
        <InfoRow label="BTC" value={BTC ? BTC + " BTC" : ""} />
      )}
      {loading ? (
        <Loader />
      ) : (
        <InfoRow label="USDC" value={USDC ? USDC + " USDC" : ""} />
      )}
      {loading ? (
        <Loader />
      ) : (
        <InfoRow label="USDT" value={USDT ? USDT + " USDT" : ""} />
      )}
      {loading ? (
        <Loader />
      ) : (
        <InfoRow label="DAI" value={DAI ? DAI + " DAI" : ""} />
      )}
    </div>
  );
};

export default SpotTab;
