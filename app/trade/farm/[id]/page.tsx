"use client";

import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useDispatch, useSelector } from "react-redux";
import { selectFarmData, selectFarmDataById } from "@/app/store/farm-slice";
import { AppDispatch } from "@/app/store/store";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useWeb3React } from "@web3-react/core";
import AddLiquidityTab from '@/app/ui/components/AddLiquidityTab';
import RemoveLiquidityTab from '@/app/ui/components/RemoveLiquidityTab';
import FeesTab from '@/app/ui/components/FeesTab';
import { mockRemoveLiquidityState, mockFeesTabState } from '@/app/lib/constants';
import { AnimatePresence } from "framer-motion";

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

  // Tab state
  const [activeTab, setActiveTab] = useState<'add' | 'remove' | 'fees'>('add');

  // Remove liquidity state
  const [removeState, setRemoveState] = useState<RemoveLiquidityState>(mockRemoveLiquidityState);
  // Fees tab state
  const [feesState, setFeesState] = useState<FeesTabState>(mockFeesTabState);

  /**
   * Parse pool data to extract token information
   * Creates token objects with symbols, icons, addresses, and balances
   */
  const [token0, token1] = useMemo(() => {
    // Split pool name to get individual token symbols (e.g., "USDC / USDT")
    const [symbol0, symbol1] = pool?.name?.split("/")?.map((s: string) => s.trim()) || [
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
          className="p-2 max-w-4xl mx-auto w-full px-4"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className=" bg-white dark:bg-baseDark border border-neutral-400 dark:border-neutral-700 rounded-xl p-4 md:p-6 mb-6 overflow-hidden">
            {/* Tab Switcher */}
            <div className="max-w-full border border-neutral-400 dark:border-neutral-800 rounded-lg flex justify-between  mb-6  p-2">
              {/* Add Tab */}
              {activeTab === 'add' ? (
                <div className="bg-gradient-to-r from-gradient-1 to-gradient-2 p-[2px] rounded-lg w-full mx-1">
                  <button
                    className="w-full px-4 py-2 rounded-lg font-semibold text-baseBlack dark:text-white bg-white dark:bg-baseDark transition"
                    onClick={() => setActiveTab('add')}
                  >
                    Add
                  </button>
                </div>
              ) : (
                <button
                  className="w-full px-4 py-2 rounded-lg font-semibold text-baseBlack dark:text-white transition mx-1"
                  onClick={() => setActiveTab('add')}
                >
                  Add
                </button>
              )}
              {/* Remove Tab */}
              {activeTab === 'remove' ? (
                <div className="bg-gradient-to-r from-gradient-1 to-gradient-2 p-[2px] rounded-lg w-full mx-1">
                  <button
                    className="w-full px-4 py-2 rounded-lg font-semibold text-baseBlack dark:text-white bg-white dark:bg-baseDark transition"
                    onClick={() => setActiveTab('remove')}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <button
                  className="w-full px-4 py-2 rounded-lg font-semibold text-baseBlack dark:text-white transition mx-1"
                  onClick={() => setActiveTab('remove')}
                >
                  Remove
                </button>
              )}
              {/* Fees Tab */}
              {activeTab === 'fees' ? (
                <div className="bg-gradient-to-r from-gradient-1 to-gradient-2 p-[2px] rounded-lg w-full mx-1">
                  <button
                    className="w-full px-4 py-2 rounded-lg font-semibold text-baseBlack dark:text-white bg-white dark:bg-baseDark transition"
                    onClick={() => setActiveTab('fees')}
                  >
                    Fees
                  </button>
                </div>
              ) : (
                <button
                  className="w-full px-4 py-2 rounded-lg font-semibold text-baseBlack dark:text-white transition mx-1"
                  onClick={() => setActiveTab('fees')}
                >
                  Fees
                </button>
              )}
            </div>
            {/* Tab Content */}
            <AnimatePresence mode="wait">
              {activeTab === 'add' && (
                <motion.div
                  key="add"
                  initial={{ x: 40, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -40, opacity: 0 }}
                  transition={{ duration: 0.3, type: "spring" }}
                >
                  <AddLiquidityTab
                    prices={prices}
                    setPrices={setPrices}
                    token0Amount={token0Amount}
                    setToken0Amount={setToken0Amount}
                    token1Amount={token1Amount}
                    setToken1Amount={setToken1Amount}
                    usdcUsdPrice={usdcUsdPrice}
                    usdtUsdPrice={usdtUsdPrice}
                    account={account}
                    token0={token0}
                    token1={token1}
                  />
                </motion.div>
              )}
              {activeTab === 'remove' && (
                <motion.div
                  key="remove"
                  initial={{ x: 40, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -40, opacity: 0 }}
                  transition={{ duration: 0.3, type: "spring" }}
                >
                  <RemoveLiquidityTab
                    state={removeState}
                    onChange={setRemoveState}
                    onConnectWallet={() => { }}
                    isWalletConnected={!!account}
                    token0={token0}
                    token1={token1}
                  />
                </motion.div>
              )}
              {activeTab === 'fees' && (
                <motion.div
                  key="fees"
                  initial={{ x: 40, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -40, opacity: 0 }}
                  transition={{ duration: 0.3, type: "spring" }}
                >
                  <FeesTab
                    state={feesState}
                    onConnectWallet={() => { }}
                    isWalletConnected={!!account}
                    token0={token0}
                    token1={token1}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
