import React from 'react';
import Image from 'next/image';

const FeesTab: React.FC<FeesTabProps> = ({
    state,
    onConnectWallet,
    isWalletConnected,
    token0,
    token1,
}) => {
    return (
        <div className="p-4 md:p-6 bg-white dark:bg-baseDark border border-neutral-400 dark:border-neutral-700 rounded-xl">
            <div className="mb-4">
                <div className="font-bold text-baseBlack dark:text-white text-xl mb-1">Unclaimed fees</div>
                <div className="text-neutral-600 dark:text-neutral-300 text-sm mb-2">${state.unclaimedFees.toFixed(4)}</div>
            </div>
            <div className="mb-4">
                <div className="text-neutral-600 dark:text-neutral-300 font-semibold mb-2">Tokens</div>
                <div className="flex flex-col gap-1">
                    {state.tokens.map((token, idx) => (
                        <div className="flex items-center gap-2" key={token.symbol}>
                            <Image src={idx === 0 ? token0.icon : token1.icon} alt={token.symbol} width={20} height={20} />
                            <span className='font-semibold text-baseBlack dark:text-white mb-1'>{token.symbol}</span>
                            <span className="ml-auto font-semibold">{token.amount}</span>
                            <span className="font-semibold ml-2 text-xs text-neutral-500 dark:text-neutral-400">${token.usdValue}</span>
                        </div>
                    ))}
                </div>
            </div>
            {!isWalletConnected && (
        <button
          disabled
          className="cursor-not-allowed w-full bg-gray-300 dark:bg-gray-500 text-neutral-400 font-bold py-3 rounded-xl text-lg mt-2"
        >
          Connect Wallet
        </button>
      )}
      {isWalletConnected && (
        <button className="w-full bg-gradient-to-r from-gradient-1 to-gradient-2 text-white font-bold py-3 rounded-xl text-lg mt-2">
          Collect
        </button>
      )}
        </div>
    );
};

export default FeesTab; 