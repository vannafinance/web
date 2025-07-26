import { networkOptions } from "./constants";

interface NetworkOption {
  id: string;
  name: string;
  icon: string;
  chainId: string;
  rpcUrl: string;
  blockExplorerUrl: string;
  nativeCurrency?: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export const switchNetwork = async (networkId: string) => {
  const provider = (window as any).ethereum;
  if (!provider) {
    alert("A wallet like MetaMask is not installed.");
    return;
  }

  const network = networkOptions.find((n: NetworkOption) => n.id === networkId);
  if (!network) {
    console.error(`Network with id ${networkId} not found.`);
    return;
  }

  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: network.chainId }],
    });
  } catch (switchError: any) {
    if (switchError.code === 4902) {
      try {
        await provider.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: network.chainId,
              chainName: network.name,
              rpcUrls: [network.rpcUrl],
              blockExplorerUrls: [network.blockExplorerUrl],
              nativeCurrency: network.nativeCurrency,
            },
          ],
        });
      } catch (addError) {
        console.error("Failed to add the network:", addError);
      }
    } else {
      console.error("Failed to switch the network:", switchError);
    }
  }
};
