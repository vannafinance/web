import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

export interface AddLiquidityTabProps {
    prices: { minPrice: number; maxPrice: number };
    setPrices: (prices: { minPrice: number; maxPrice: number }) => void;
    token0Amount: string;
    setToken0Amount: (amount: string) => void;
    token1Amount: string;
    setToken1Amount: (amount: string) => void;
    usdcUsdPrice: string;
    usdtUsdPrice: string;
    account: string | null | undefined;
    token0: { symbol: string; icon: string; address: string };
    token1: { symbol: string; icon: string; address: string };
}

const AddLiquidityTab: React.FC<AddLiquidityTabProps> = ({
    prices,
    setPrices,
    token0Amount,
    setToken0Amount,
    token1Amount,
    setToken1Amount,
    usdcUsdPrice,
    usdtUsdPrice,
    account,
    token0,
    token1,
}) => {
    return (
        <>
            {/* Price Range Controls */}
            <motion.div className="flex flex-col md:flex-row gap-4 md:gap-6">
                {/* Minimum Price Control */}
                <motion.div className="border border-neutral-400 dark:border-neutral-700 py-4 rounded-[20px] flex-1 flex flex-col justify-center items-center">
                    <div className="text-neutral-500 dark:text-neutral-400 text-xs mb-2">Min Price</div>
                    <div className="text-xl md:text-2xl font-bold mb-1">{prices.minPrice.toFixed(4)}</div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-2 text-center">{token1.symbol} per {token0.symbol}</div>
                    <div className="flex gap-2">
                        <motion.button className="w-7 h-7 rounded-full bg-neutral-300 dark:bg-neutral-700 text-lg flex items-center justify-center" onClick={() => setPrices({ ...prices, minPrice: prices.minPrice - 0.0001 })}>-</motion.button>
                        <motion.button className="w-7 h-7 rounded-full bg-neutral-300 dark:bg-neutral-700 text-lg flex items-center justify-center" onClick={() => setPrices({ ...prices, minPrice: prices.minPrice + 0.0001 })}>+</motion.button>
                    </div>
                </motion.div>
                {/* Maximum Price Control */}
                <motion.div className="py-4 border border-neutral-400 dark:border-neutral-700 rounded-[20px] flex-1 flex flex-col justify-center items-center">
                    <div className="text-neutral-500 dark:text-neutral-400 text-xs mb-2">Max Price</div>
                    <div className="text-xl md:text-2xl font-bold mb-1">{prices.maxPrice.toFixed(4)}</div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-2 text-center">{token1.symbol} per {token0.symbol}</div>
                    <div className="flex gap-2">
                        <motion.button className="w-7 h-7 rounded-full bg-neutral-300 dark:bg-neutral-700 text-lg flex items-center justify-center" onClick={() => setPrices({ ...prices, maxPrice: prices.maxPrice - 0.0001 })}>-</motion.button>
                        <motion.button className="w-7 h-7 rounded-full bg-neutral-300 dark:bg-neutral-700 text-lg flex items-center justify-center" onClick={() => setPrices({ ...prices, maxPrice: prices.maxPrice + 0.0001 })}>+</motion.button>
                    </div>
                </motion.div>
            </motion.div>
            {/* Liquidity Information Section */}
            <motion.div className="mt-5 p-4 md:p-8 rounded-[20px]">
                <div className="font-semibold text-baseBlack dark:text-white mb-1">Liquidity</div>
                <div className="text-neutral-600 dark:text-neutral-300 text-sm">Depending on your range, the supplied tokens for this position will not always be a 50:50 ratio.</div>
            </motion.div>
            {/* Token Input Section */}
            <motion.div className="mt-5 relative">
                {/* First Token Input */}
                <motion.div className="p-4 md:p-8 rounded-[20px] border border-neutral-400 dark:border-neutral-700 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full border border-neutral-400 dark:border-white flex items-center justify-center bg-white dark:bg-baseDark flex-shrink-0">
                        <Image src={token0.icon} alt={token0.symbol} width={24} height={24} className="rounded-full" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <input value={token0Amount} placeholder="0.0" onChange={e => setToken0Amount(e.target.value)} type="number" className="no-spinner bg-transparent focus:outline-none text-lg font-bold text-baseBlack dark:text-white w-full" />
                        <div className="text-xs text-neutral-500 dark:text-neutral-400">${usdcUsdPrice}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <div className="flex items-center gap-2 text-sm font-semibold">
                            <Image width={16} height={16} className="w-6 h-6" alt={token0.symbol} src={token0.icon} />
                            <span>{token0.symbol}</span>
                        </div>
                        <div className="mt-2 flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4 text-neutral-500 dark:text-neutral-400">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3" />
                            </svg>
                            <div className="text-xs text-neutral-500 dark:text-neutral-400">$0.00</div>
                        </div>
                    </div>
                </motion.div>
                {/* Second Token Input */}
                <motion.div className="p-4 md:p-8 mt-2 rounded-[20px] border border-neutral-400 dark:border-neutral-700 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full border border-neutral-400 dark:border-white flex items-center justify-center bg-white dark:bg-baseDark flex-shrink-0">
                        <Image src={token1.icon} alt={token1.symbol} width={24} height={24} className="rounded-full" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <input value={token1Amount} placeholder="0.0" onChange={e => setToken1Amount(e.target.value)} type="number" className="no-spinner bg-transparent focus:outline-none text-lg font-bold text-baseBlack dark:text-white w-full" />
                        <div className="text-xs text-neutral-500 dark:text-neutral-400">${usdtUsdPrice}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <div className="flex items-center gap-2 text-sm font-semibold">
                            <Image width={16} height={16} className="w-6 h-6" alt={token1.symbol} src={token1.icon} />
                            <span>{token1.symbol}</span>
                        </div>
                        <div className="mt-2 flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4 text-neutral-500 dark:text-neutral-400">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3" />
                            </svg>
                            <div className="text-xs text-neutral-500 dark:text-neutral-400">$0.00</div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
            {/* Action Button Section */}
            <motion.div className="mt-4">
                {!account && (
                    <motion.button disabled className="cursor-not-allowed w-full bg-gray-300 dark:bg-gray-500 text-neutral-400 font-bold py-3 rounded-xl text-lg mt-2">Connect Wallet</motion.button>
                )}
                {account && !token0Amount && (
                    <motion.button className="w-full bg-gradient-to-r from-gradient-1 to-gradient-2 text-white font-bold py-3 rounded-xl text-lg mt-2">Enter an amount</motion.button>
                )}
                {account && token0Amount && (
                    <motion.button className="w-full bg-gradient-to-r from-gradient-1 to-gradient-2 text-white font-bold py-3 rounded-xl text-lg mt-2">Add Liquidity</motion.button>
                )}
            </motion.div>
        </>
    );
};

export default AddLiquidityTab; 