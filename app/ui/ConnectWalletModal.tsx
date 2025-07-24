"use client";

import React from 'react';
import { X } from '@phosphor-icons/react';

interface ConnectWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectEVM: () => void;
  onConnectStellar: () => void;
}

const ConnectWalletModal: React.FC<ConnectWalletModalProps> = ({
  isOpen,
  onClose,
  onConnectEVM,
  onConnectStellar,
}) => {
  if (!isOpen) return null;

  // Handle clicks on the modal background to close it
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4"
      onClick={handleBackdropClick}
      aria-modal="true"
      role="dialog"
    >
      <div className="bg-white dark:bg-baseDark p-6 rounded-2xl shadow-2xl w-full max-w-xs relative transform transition-all duration-300 ease-in-out scale-95 hover:scale-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          aria-label="Close modal"
        >
          <X size={24} />
        </button>
        <h2 className="text-xl font-bold text-center mb-6 dark:text-white">Connect a Wallet</h2>
        <div className="flex flex-col gap-4">
          {/* <button
            onClick={() => {
              onConnectEVM();
              onClose();
            }}
            className="w-full bg-gradient-to-r from-gradient-1 to-gradient-2 text-white font-semibold py-3 rounded-lg hover:opacity-90 transition-opacity text-base"
          >
            Connect EVM Wallet
          </button> */}
          <button
            onClick={() => {
              onConnectStellar();
              onClose();
            }}
            className="w-full bg-blue-500 text-white font-semibold py-3 rounded-lg hover:bg-blue-600 transition-colors text-base"
          >
            Connect Stellar Wallet
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConnectWalletModal;