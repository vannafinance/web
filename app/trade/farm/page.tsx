"use client";

import Image from "next/image";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { selectFarmData } from "@/app/store/farm-slice";
import { AppDispatch } from "@/app/store/store";
import { motion } from "framer-motion";

/**
 * ChangeText Component
 * Displays percentage changes with color-coded styling and animation
 * Green for positive changes, red for negative, gray for zero
 */
function ChangeText({ value }: { value: number }) {
  return (
    <motion.span
      className={
        value > 0
          ? "text-green-400"
          : value < 0
          ? "text-red-400"
          : "text-gray-400"
      }
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {value > 0 ? "+" : ""}
      {value}%
    </motion.span>
  );
}

/**
 * Farm Page Component
 * Displays a table of farming pools with their statistics
 * Includes animations, hover effects, and navigation to individual pool details
 */
export default function Page() {
  // Router for navigation to individual pool pages
  const router = useRouter();

  // Redux state management - get farm data from store
  const poolData = useSelector(selectFarmData);
  const dispatch = useDispatch<AppDispatch>();

  // Animation variants for staggered table row animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1, // Stagger child animations by 0.1s
        delayChildren: 0.2, // Delay start of child animations by 0.2s
      },
    },
  };

  return (
    // Main container with fade-in animation
    <motion.div
      className="min-h-screen bg-white dark:bg-baseDark text-baseBlack dark:text-white p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Page title with slide-down animation */}
        <motion.h1
          className="text-2xl font-bold mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Farm
        </motion.h1>

        {/* Main table container with scale animation */}
        <motion.div
          className="overflow-x-auto border border-neutral-400 dark:border-neutral-700 rounded-lg shadow-lg bg-white dark:bg-baseDark"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <table className="min-w-full text-sm">
            {/* Table header with column titles */}
            <thead>
              <tr className="bg-white dark:bg-baseDark border-b border-neutral-400 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300">
                <th className="px-4 py-3 text-left font-semibold">Name</th>
                <th className="px-4 py-3 text-right font-semibold">TVL</th>
                <th className="px-4 py-3 text-right font-semibold">
                  Volume (24h)
                </th>
                <th className="px-4 py-3 text-right font-semibold">
                  Volume (1w)
                </th>
                <th className="px-4 py-3 text-right font-semibold">
                  Transactions (24h)
                </th>
                <th className="px-4 py-3 text-right font-semibold">APR</th>
              </tr>
            </thead>

            {/* Table body with staggered row animations */}
            <motion.tbody
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {/* Map through pool data to create table rows */}
              {poolData?.map((pool, index) => (
                <motion.tr
                  key={pool.id}
                  className="border-b border-neutral-400 dark:border-neutral-700 transition cursor-pointer relative group"
                  onClick={() => {
                    // Prevent navigation for pools marked as "coming soon"
                    if (pool.isSoon) return;
                    // Navigate to individual pool page
                    router.push(`/trade/farm/${pool.id}`);
                  }}
                  whileHover={{
                    transition: { duration: 0.2 },
                  }}
                  whileTap={{ scale: 0.98 }} // Scale down on tap for feedback
                >
                  {/* Gradient hover effect overlay */}
                  <div className="absolute inset-0  bg-transparent z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-in-out pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-r from-gradient-1 to-gradient-2 "></div>
                    <div className="absolute inset-[1px] bg-white dark:bg-baseDark "></div>
                  </div>

                  {/* Pool name and icons column */}
                  <td className="flex items-center gap-2 px-4 py-3 relative z-10">
                    {/* Dual token icons with hover animation */}
                    <motion.div
                      className="flex"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.2 }}
                    >
                      {/* First token icon */}
                      <div className="flex flex-col justify-center items-center w-[2.0rem] h-[2.0rem] rounded-full border border-neutral-400 dark:border-white bg-white dark:bg-baseDark">
                        <Image
                          width={10}
                          height={10}
                          src={pool.icons[0]}
                          alt={pool.name}
                          className="w-full h-full rounded-full"
                        />
                      </div>
                      {/* Second token icon (overlapping) */}
                      <div className="flex flex-col justify-center items-center w-[2.0rem] h-[2.0rem] -ml-1 rounded-full border border-neutral-400 dark:border-white bg-white dark:bg-baseDark">
                        <Image
                          width={10}
                          height={10}
                          src={pool.icons[1]}
                          alt={pool.name}
                          className="w-full h-full rounded-full"
                        />
                      </div>
                    </motion.div>

                    {/* Pool name and metadata */}
                    <div>
                      <div className="ml-2 flex gap-2 font-medium">
                        <div>{pool.name}</div>
                        <div>
                          <button className="py-0.5 px-2 bg-neutral-600 text-xs rounded-xl text-baseWhite">
                            sushi
                          </button>
                        </div>
                      </div>
                      <div className="ml-2 mt-2 flex gap-2">
                        {/* Protocol version badge */}
                        <motion.div
                          className="font-medium text-xs rounded-full w-[2.0rem] p-1 flex flex-col justify-center items-center bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400"
                          whileHover={{ scale: 1.1 }}
                          transition={{ duration: 0.2 }}
                        >
                          {pool.protocol_version}
                        </motion.div>
                        {/* Swap fee badge */}
                        <motion.div
                          className="flex flex-col justify-center items-center w-[3.0rem] rounded-full text-xs font-medium bg-neutral-300 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300"
                          whileHover={{ scale: 1.1 }}
                          transition={{ duration: 0.2 }}
                        >
                          {pool.swap_fee}%
                        </motion.div>
                        {/* "Coming soon" badge for pools not yet available */}
                        {pool.isSoon && (
                          <motion.div
                            className="font-medium text-xs rounded-full w-[2.0rem] p-1 flex flex-col justify-center items-center text-blue-600 dark:text-blue-400"
                            whileHover={{ scale: 1.1 }}
                            transition={{ duration: 0.2 }}
                          >
                            <button className="py-0.5 px-1 bg-gradient-to-r from-gradient-1 to-gradient-2 text-xs rounded-md text-baseWhite">
                              soon
                            </button>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* TVL (Total Value Locked) column with change indicator */}
                  <td className="px-4 py-3 text-right relative z-10">
                    <div>{pool.tvl}</div>
                    <ChangeText value={pool.tvlChange} />
                  </td>

                  {/* 24h Volume column with change indicator */}
                  <td className="px-4 py-3 text-right relative z-10">
                    <div>{pool.vol24h}</div>
                    <ChangeText value={pool.vol24hChange} />
                  </td>

                  {/* 1 week Volume column with change indicator */}
                  <td className="px-4 py-3 text-right relative z-10">
                    <div>{pool.vol1w}</div>
                    <ChangeText value={pool.vol1wChange} />
                  </td>

                  {/* 24h Transactions column */}
                  <td className="px-4 py-3 text-right relative z-10">
                    {pool.tx24h}
                  </td>

                  {/* APR (Annual Percentage Rate) column */}
                  <td className="px-4 py-3 text-right font-semibold text-blue-600 dark:text-blue-400 relative z-10">
                    {pool.apr}
                  </td>
                </motion.tr>
              ))}
            </motion.tbody>
          </table>
        </motion.div>
      </div>
    </motion.div>
  );
}
