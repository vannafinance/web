import React from "react";
import { motion } from "framer-motion";

// Represents a single wallet option
interface WalletItem {
  name: string;
  icon: string;
  onClick?: string | null;
  label?: string;
}

// Renders the wallet selection section of the modal, including all wallet options and the footer
export default function ModalWalletsSection({
  wallets, // Array of wallet sections (Installed, Not Installed, Others)
  onMetaMask, // Handler for MetaMask connect
  onClose, // Handler for closing the modal
}: {
  wallets: { section: string; items: WalletItem[] }[] | null;
  onMetaMask: () => void;
  onClose: () => void;
}) {
  return (
    <>
      {/* Wallet sections list */}
      <div className="flex-1 overflow-y-auto px-5 py-2">
        {wallets?.map((section, idx) => (
          <div key={section.section} className="mb-2">
            <div
              className={`${
                section.section === "Installed"
                  ? " text-blue-500"
                  : "text-neutral-500"
              } text-xs font-semibold  uppercase mb-1 mt-3`}
            >
              {section.section}
            </div>
            <div className="flex flex-col gap-2">
              {section.items.map((wallet, widx) => (
                <motion.button
                  key={wallet.name}
                  onClick={
                    wallet.onClick
                      ? wallet.onClick === "onMetaMask"
                        ? onMetaMask
                        : undefined
                      : undefined
                  }
                  className="relative group flex items-center w-full p-3 rounded-lg border border-transparent bg-white dark:bg-baseDark text-baseBlack dark:text-baseWhite hover:bg-neutral-100 dark:hover:bg-baseDarkComplementary focus:outline-none focus:ring-2 focus:ring-purple transition-colors overflow-hidden"
                  disabled={!wallet.onClick}
                >
                  {/* Gradient hover effect overlay */}
                  <span className="absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-in-out pointer-events-none">
                    <span className="absolute inset-0 bg-gradient-to-r from-gradient-1 to-gradient-2 rounded-lg" />
                    <span className="absolute inset-[1px] bg-white dark:bg-baseDark rounded-lg" />
                  </span>
                  {/* Button content */}
                  <span className="relative z-10 flex items-center w-full">
                    <img
                      src={wallet.icon}
                      alt={wallet.name}
                      className="w-6 h-6 mr-3"
                    />
                    <span className="flex-1 text-left">{wallet.name}</span>
                    {wallet.label && (
                      <span className="text-xs bg-neutral-200 dark:bg-baseDarkComplementary text-neutral-700 dark:text-baseWhite px-2 py-0.5 rounded font-medium ml-2">
                        {wallet.label}
                      </span>
                    )}
                  </span>
                </motion.button>
              ))}
            </div>
            {idx < wallets.length - 1 && (
              <div className="my-3 border-t border-neutral-100 dark:border-neutral-700" />
            )}
          </div>
        ))}
      </div>
      {/* Footer with terms and privacy links */}
      <div className="px-5 py-3 text-xs text-neutral-500 dark:text-neutral-400 border-t border-neutral-100 dark:border-neutral-700 text-center">
        By connecting your wallet, you agree to Vanna's{" "}
        <a href="#" className="underline">
          Terms of Service
        </a>{" "}
        and{" "}
        <a href="#" className="underline">
          Privacy Policy
        </a>
      </div>
    </>
  );
}
