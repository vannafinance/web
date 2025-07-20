"use client";

import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useDispatch, useSelector } from "react-redux";
import { selectFarmData, selectFarmDataById } from "@/app/store/farm-slice";
import { AppDispatch } from "@/app/store/store";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useWeb3React } from "@web3-react/core";

// Interface for price range management
interface priceType {
  minPrice: number;
  maxPrice: number;
}

/**
 * Farm Detail Page Component
 * Displays detailed information about a specific liquidity farming pool
 * Allows users to add liquidity with custom price ranges
 */
export default function PoolDetailPage({ params }: { params: { id: string } }) {
  // Navigation and routing hooks
  const router = useRouter();
  const { id } = params;

  // Web3 connection state
  const { account } = useWeb3React();

  // Redux state management
  const pool = useSelector(selectFarmDataById(id));
  const dispatch = useDispatch<AppDispatch>();

  // Price range state for liquidity position
  const [prices, setPrices] = useState<priceType>({
    minPrice: 0.9981,
    maxPrice: 1.0001,
  });

  // Token input amounts and USD price states
  const [token0Amount, setToken0Amount] = useState<string>("");
  const [token1Amount, setToken1Amount] = useState<string>("");
  const [usdcUsdPrice, setUsdcUsdPrice] = useState("0.00");
  const [usdtUsdPrice, setUsdtUsdPrice] = useState("0.00");

  /**
   * Parse pool data to extract token information
   * Creates token objects with symbols, icons, addresses, and balances
   */
  const [token0, token1] = useMemo(() => {
    // Split pool name to get individual token symbols (e.g., "USDC / USDT")
    const [symbol0, symbol1] = pool?.name?.split("/")?.map((s) => s.trim()) || [
      "USDC",
      "USDT",
    ];
    const icons = pool?.icons || [];

    return [
      {
        symbol: symbol0,
        icon: icons[0] || "/usdc-icon.svg",
        address: "0x203A...FD36",
        balance: 0,
        value: 0,
      },
      {
        symbol: symbol1,
        icon: icons[1] || "/usdt-icon.svg",
        address: "0x2DCa...D2F2",
        balance: 0,
        value: 0,
      },
    ];
  }, [pool?.name, pool?.icons]);

  // Early return if pool data is not found
  if (!pool) {
    return (
      <motion.div
        className="min-h-screen flex items-center justify-center bg-white dark:bg-baseDark text-baseBlack dark:text-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div>Pool not found.</div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-white dark:bg-baseDark text-baseBlack dark:text-white md:pt-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div className="max-w-screen mx-auto">
        {/* Navigation: Back button */}
        <motion.button
          className="ml-6 mt-5 text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          onClick={() => router.back()}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="text-lg">←</span> Back
        </motion.button>

        {/* Pool Header Section */}
        <motion.div
          className="pb-4 max-w-screen mb-6 border-b border-neutral-400 dark:border-neutral-700 flex flex-col justify-center items-center mx-auto w-full px-4"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {/* Token icons, pool name, and protocol version badge */}
          <div className="flex items-center justify-center gap-2 mt-4 md:mt-0 flex-wrap">
            {/* Token pair icons with overlapping design */}
            <motion.div
              className="flex"
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.2 }}
            >
              <div className="w-8 h-8 rounded-full border border-neutral-400 dark:border-white flex items-center justify-center bg-white dark:bg-baseDark">
                <Image
                  src={token0.icon}
                  alt={token0.symbol}
                  width={24}
                  height={24}
                  className="rounded-full"
                />
              </div>
              <div className="w-8 h-8 -ml-2 rounded-full border border-neutral-400 dark:border-white flex items-center justify-center bg-white dark:bg-baseDark">
                <Image
                  src={token1.icon}
                  alt={token1.symbol}
                  width={24}
                  height={24}
                  className="rounded-full"
                />
              </div>
            </motion.div>

            {/* Pool name */}
            <span className="font-bold text-center text-xl md:text-2xl lg:text-4xl">
              {pool.name}
            </span>

            {/* Protocol version badge */}
            <motion.span
              className="px-2 py-1 text-xs md:text-sm lg:text-xl rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 font-semibold"
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.2 }}
            >
              {pool.protocol_version}
            </motion.span>
          </div>

          {/* Pool statistics and information */}
          <div className="flex flex-col items-center gap-1 mt-4 text-xs md:text-sm lg:flex-row lg:gap-4 lg:mt-4">
            <div>
              APR{" "}
              <span className="text-blue-600 dark:text-blue-400 font-semibold">
                {pool.apr}
              </span>
            </div>
            <div>
              Fee{" "}
              <span className="text-neutral-600 dark:text-neutral-300">
                {pool.swap_fee}%
              </span>
            </div>
            <div>
              Network{" "}
              <span className="text-neutral-600 dark:text-neutral-300">
                Katana
              </span>
            </div>
            <div className="text-center lg:text-left">
              {token0.symbol}{" "}
              <a
                href="#"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                {token0.address}
              </a>
            </div>
            <div className="text-center lg:text-left">
              {token1.symbol}{" "}
              <a
                href="#"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                {token1.address}
              </a>
            </div>
          </div>
        </motion.div>

        {/* Main Content Card */}
        <motion.div
          className="p-2 max-w-5xl mx-auto w-full px-4"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="bg-white dark:bg-baseDark border border-neutral-400 dark:border-neutral-700 rounded-xl p-4 md:p-6 mb-6 overflow-hidden">
            {/* Price Range Controls */}
            <motion.div
              className="flex flex-col md:flex-row gap-4 md:gap-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              {/* Minimum Price Control */}
              <motion.div
                className="border border-neutral-400 dark:border-neutral-700 py-4 rounded-[20px] flex-1 flex flex-col justify-center items-center"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <div className="text-neutral-500 dark:text-neutral-400 text-xs mb-2">
                  Min Price
                </div>
                <div className="text-xl md:text-2xl font-bold mb-1">
                  {prices.minPrice.toFixed(4)}
                </div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-2 text-center">
                  {token1.symbol} per {token0.symbol}
                </div>
                {/* Price adjustment buttons */}
                <div className="flex gap-2">
                  <motion.button
                    className="w-7 h-7 rounded-full bg-neutral-300 dark:bg-neutral-700 text-lg flex items-center justify-center"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ duration: 0.1 }}
                    onClick={() => {
                      setPrices((prev) => ({
                        ...prev,
                        minPrice: prev.minPrice - 0.0001,
                      }));
                    }}
                  >
                    -
                  </motion.button>
                  <motion.button
                    className="w-7 h-7 rounded-full bg-neutral-300 dark:bg-neutral-700 text-lg flex items-center justify-center"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ duration: 0.1 }}
                    onClick={() => {
                      setPrices((prev) => ({
                        ...prev,
                        minPrice: prev.minPrice + 0.0001,
                      }));
                    }}
                  >
                    +
                  </motion.button>
                </div>
              </motion.div>

              {/* Maximum Price Control */}
              <motion.div
                className="py-4 border border-neutral-400 dark:border-neutral-700 rounded-[20px] flex-1 flex flex-col justify-center items-center"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <div className="text-neutral-500 dark:text-neutral-400 text-xs mb-2">
                  Max Price
                </div>
                <div className="text-xl md:text-2xl font-bold mb-1">
                  {prices.maxPrice.toFixed(4)}
                </div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-2 text-center">
                  {token1.symbol} per {token0.symbol}
                </div>
                {/* Price adjustment buttons */}
                <div className="flex gap-2">
                  <motion.button
                    className="w-7 h-7 rounded-full bg-neutral-300 dark:bg-neutral-700 text-lg flex items-center justify-center"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ duration: 0.1 }}
                    onClick={() => {
                      setPrices((prev) => ({
                        ...prev,
                        maxPrice: prev.maxPrice - 0.0001,
                      }));
                    }}
                  >
                    -
                  </motion.button>
                  <motion.button
                    className="w-7 h-7 rounded-full bg-neutral-300 dark:bg-neutral-700 text-lg flex items-center justify-center"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ duration: 0.1 }}
                    onClick={() => {
                      setPrices((prev) => ({
                        ...prev,
                        maxPrice: prev.maxPrice + 0.0001,
                      }));
                    }}
                  >
                    +
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>

            {/* Liquidity Information Section */}
            <motion.div
              className="mt-5 p-4 md:p-8 rounded-[20px]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <div className="font-semibold text-baseBlack dark:text-white mb-1">
                Liquidity
              </div>
              <div className="text-neutral-600 dark:text-neutral-300 text-sm">
                Depending on your range, the supplied tokens for this position
                will not always be a 50:50 ratio.
              </div>
            </motion.div>

            {/* Token Input Section */}
            <motion.div
              className="mt-5 relative"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
            >
              {/* First Token Input */}
              <motion.div
                className="p-4 md:p-8 rounded-[20px] border border-neutral-400 dark:border-neutral-700 flex items-center gap-3"
                whileHover={{ scale: 1.01 }}
                transition={{ duration: 0.2 }}
              >
                {/* Token icon */}
                <div className="w-8 h-8 rounded-full border border-neutral-400 dark:border-white flex items-center justify-center bg-white dark:bg-baseDark flex-shrink-0">
                  <Image
                    src={token0.icon}
                    alt={token0.symbol}
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                </div>

                {/* Input field and USD value */}
                <div className="flex-1 min-w-0">
                  <input
                    value={token0Amount}
                    placeholder="0.0"
                    onChange={(e) => setToken0Amount(e.target.value)}
                    type="number"
                    className="no-spinner bg-transparent focus:outline-none text-lg font-bold text-baseBlack dark:text-white w-full"
                  />
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">
                    ${usdcUsdPrice}
                  </div>
                </div>

                {/* Token symbol and balance */}
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Image
                      width={16}
                      height={16}
                      className="w-6 h-6"
                      alt={token0.symbol}
                      src={token0.icon}
                    />
                    <span>{token0.symbol}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="size-4 text-neutral-500 dark:text-neutral-400"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3"
                      />
                    </svg>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">
                      $0.00
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Second Token Input */}
              <motion.div
                className="p-4 md:p-8 mt-2 rounded-[20px] border border-neutral-400 dark:border-neutral-700 flex items-center gap-3"
                whileHover={{ scale: 1.01 }}
                transition={{ duration: 0.2 }}
              >
                {/* Token icon */}
                <div className="w-8 h-8 rounded-full border border-neutral-400 dark:border-white flex items-center justify-center bg-white dark:bg-baseDark flex-shrink-0">
                  <Image
                    src={token1.icon}
                    alt={token1.symbol}
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                </div>

                {/* Input field and USD value */}
                <div className="flex-1 min-w-0">
                  <input
                    value={token1Amount}
                    placeholder="0.0"
                    onChange={(e) => {
                      setToken1Amount(e.target.value);
                    }}
                    type="number"
                    className="no-spinner bg-transparent focus:outline-none text-lg font-bold text-baseBlack dark:text-white w-full"
                  />
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">
                    ${usdtUsdPrice}
                  </div>
                </div>

                {/* Token symbol and balance */}
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Image
                      width={16}
                      height={16}
                      className="w-6 h-6"
                      alt={token1.symbol}
                      src={token1.icon}
                    />
                    <span>{token1.symbol}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="size-4 text-neutral-500 dark:text-neutral-400"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3"
                      />
                    </svg>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">
                      $0.00
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Action Button Section */}
            <motion.div
              className="mt-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              {/* Conditional button rendering based on wallet connection and input state */}
              {!account && (
                <motion.button
                  className="w-full bg-gradient-to-r from-gradient-1 to-gradient-2 text-white font-bold py-3 rounded-xl text-lg mt-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                >
                  Connect Wallet
                </motion.button>
              )}
              {account && !token0Amount && (
                <motion.button
                  className="w-full bg-gradient-to-r from-gradient-1 to-gradient-2 text-white font-bold py-3 rounded-xl text-lg mt-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                >
                  Enter an amount
                </motion.button>
              )}
              {account && token0Amount && (
                <motion.button
                  className="w-full bg-gradient-to-r from-gradient-1 to-gradient-2 text-white font-bold py-3 rounded-xl text-lg mt-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                >
                  Add Liquidity
                </motion.button>
              )}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
