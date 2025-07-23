import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { detectInstalledWallets } from "@/app/lib/extensions";
import ModalWalletInfoSection from "./ModalWalletInfoSection";
import ModalWalletsSection from "./ModalWalletsSection";

// Main modal for connecting a wallet. Handles info/help section and wallet selection section.
interface WalletConnectModalArgs {
  open: boolean; // Whether the modal is open
  onClose: () => void; // Handler to close the modal
  onMetaMask: () => void; // Handler for MetaMask connect
  // You can add more wallet handlers as needed
}

export default function WalletConnectModal({
  open,
  onClose,
  onMetaMask,
}: WalletConnectModalArgs) {
  // Wallet sections (Installed, Not Installed, Others)
  const [wallets, setWallets] = useState<
    { section: string; items: WalletItem[] }[] | null
  >(null);
  // Whether to show the info/help section
  const [showInfo, setShowInfo] = useState(false);

  // Detect installed wallets on mount
  useEffect(() => {
    const wallets = detectInstalledWallets();
    setWallets(wallets);
  }, []);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{
              type: "spring" as const,
              stiffness: 180,
              damping: 24,
              duration: 0.32,
            }}
            className="bg-white dark:bg-baseDark rounded-2xl p-0 w-96 border border-neutral-100 dark:border-neutral-700 shadow-2xl flex flex-col"
          >
            {/* Show info section or wallets section */}
            {showInfo ? (
              // Info/help section ("What is a Wallet?")
              <ModalWalletInfoSection
                onGetWallet={() =>
                  window.open("https://metamask.io/download.html", "_blank")
                }
                onLearnMore={() =>
                  window.open("https://ethereum.org/en/wallets/", "_blank")
                }
                onBack={() => setShowInfo(false)}
                onClose={() => {
                  setShowInfo(false);
                  onClose();
                }}
              />
            ) : (
              <>
                {/* Header with help and close buttons */}
                <div className="flex items-center justify-between px-5 pt-4 pb-2 border-b border-neutral-100 dark:border-neutral-700">
                  <button
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-100 dark:hover:bg-baseDarkComplementary text-xl text-baseBlack dark:text-baseWhite focus:outline-none"
                    aria-label="Help"
                    onClick={() => setShowInfo(true)}
                  >
                    <span className="font-bold">?</span>
                  </button>
                  <h2 className="text-lg font-bold text-baseBlack dark:text-baseWhite flex-1 text-center ">
                    Connect a Wallet
                  </h2>
                  <button
                    onClick={onClose}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-100 dark:hover:bg-baseDarkComplementary text-2xl text-baseBlack dark:text-baseWhite focus:outline-none"
                    aria-label="Close"
                  >
                    &times;
                  </button>
                </div>
                {/* Wallet selection section */}
                <ModalWalletsSection
                  wallets={wallets}
                  onMetaMask={onMetaMask}
                  onClose={onClose}
                />
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
