import React from "react";

// Info section for the wallet connect modal, explaining what a wallet is and providing helpful actions
export default function ModalWalletInfoSection({
  onGetWallet, // Called when the user clicks 'Get a Wallet'
  onLearnMore, // Called when the user clicks 'Learn More'
  onBack, // Called when the user clicks the back arrow
  onClose, // Called when the user clicks the close (X) button
}: {
  onGetWallet?: () => void;
  onLearnMore?: () => void;
  onBack?: () => void;
  onClose?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-8 w-96 max-w-full">
      {/* Header with back and close buttons */}
      <div className="flex items-center justify-between w-full mb-4">
        <button
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-100 dark:hover:bg-baseDarkComplementary text-xl text-baseBlack dark:text-baseWhite focus:outline-none"
          aria-label="Back"
          onClick={onBack}
        >
          {/* Back arrow icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.0}
            stroke="currentColor"
            className="size-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3"
            />
          </svg>
        </button>
        <h2 className="text-lg font-bold text-baseBlack dark:text-baseWhite flex-1 text-center">
          What is a Wallet?
        </h2>
        <button
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-100 dark:hover:bg-baseDarkComplementary text-2xl text-baseBlack dark:text-baseWhite focus:outline-none"
          aria-label="Close"
          onClick={onClose}
        >
          &times;
        </button>
      </div>
      {/* Info Cards: Explain wallets and login */}
      <div className="mt-4 flex flex-col gap-4 w-full mb-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
            {/* Wallet icon */}
            <span role="img" aria-label="wallet" className="text-2xl">
              💼
            </span>
          </div>
          <div>
            <div className="font-semibold text-baseBlack dark:text-baseWhite">
              A Home for your Digital Assets
            </div>
            <div className="text-sm text-neutral-600 dark:text-neutral-300">
              Wallets are used to send, receive, store, and display digital
              assets like Ethereum and NFTs.
            </div>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900">
            {/* Login icon */}
            <span role="img" aria-label="login" className="text-2xl">
              🔑
            </span>
          </div>
          <div>
            <div className="font-semibold text-baseBlack dark:text-baseWhite">
              A New Way to Log In
            </div>
            <div className="text-sm text-neutral-600 dark:text-neutral-300">
              Instead of creating new accounts and passwords on every website,
              just connect your wallet.
            </div>
          </div>
        </div>
      </div>
      {/* Action buttons */}
      <button
        className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold py-3 mb-2 transition-colors"
        onClick={onGetWallet}
      >
        Get a Wallet
      </button>
      <button
        className="w-full text-blue-600 dark:text-blue-400 underline text-sm font-medium"
        onClick={onLearnMore}
      >
        Learn More
      </button>
    </div>
  );
}
