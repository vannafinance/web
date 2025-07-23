// Utility for detecting installed wallet extensions and returning wallet options for the modal

// Returns an array of wallet sections (Installed, Not Installed, Others) with wallet info for the modal
export const detectInstalledWallets = (): {
  section: string;
  items: WalletItem[];
}[] => {
  let installed: WalletItem[] = [];
  let notInstalled: WalletItem[] = [];

  // Detect MetaMask extension
  if (typeof window !== "undefined" && (window as any).ethereum?.isMetaMask) {
    installed.push({
      icon: "/metamask-icon.svg",
      name: "MetaMask",
      label: "Installed",
      onClick: "onMetaMask",
    });
  } else {
    notInstalled.push({
      icon: "/metamask-icon.svg",
      name: "MetaMask",
      label: "Not Installed",
      onClick: "onMetaMask",
    });
  }

  // Other wallet options (not detected, just shown as 'soon')
  const others: WalletItem[] = [
    {
      icon: "/coinbase-wallet-icon.svg",
      name: "Coinbase",
      label: "soon",
      onClick: "onCoinbase",
    },
    {
      icon: "/trust-wallet-icon.png",
      name: "Trust Wallet",
      label: "soon",
      onClick: "onTrustWallet",
    },
    {
      icon: "/wallet-connect-icon.png",
      name: "Wallet Connect",
      label: "soon",
      onClick: "onWalletConnect",
    },
  ];

  let walletSections: { section: string; items: WalletItem[] }[] = [];

  // Add installed wallets section if any
  if (installed.length > 0) {
    walletSections.push({
      section: "Installed",
      items: installed,
    });
  }
  // Add not installed wallets section if any
  if (notInstalled.length > 0) {
    walletSections.push({
      section: "Not Installed",
      items: notInstalled,
    });
  }

  // Always add others section
  walletSections.push({
    section: "Others",
    items: others,
  });

  return walletSections;
};
