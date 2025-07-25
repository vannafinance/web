import { networkOptions } from "./constants";

// Define the structure of a network option for TypeScript
interface NetworkOption {
  id: string;
  name: string;
  icon: string;
  chainId: string;
  rpcUrl: string;
  blockExplorerUrl: string;
}

export const switchNetwork = async (networkId: string) => {
  // Check if MetaMask or another EIP-1193 compatible wallet is installed
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
    // Request to switch to the selected network
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: network.chainId }],
    });
  } catch (switchError: any) {
    // This error (code 4902) indicates that the chain has not been added to the wallet yet
    if (switchError.code === 4902) {
      try {
        // Request to add the new network to the wallet
        await provider.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: network.chainId,
              chainName: network.name,
              rpcUrls: [network.rpcUrl],
              blockExplorerUrls: [network.blockExplorerUrl],
              nativeCurrency: {
                name: "Ether",
                symbol: "ETH",
                decimals: 18,
              },
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
