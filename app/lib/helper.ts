import { BigNumber, BigNumberish } from "ethers";
import { formatUnits, parseUnits } from "ethers/lib/utils";

export const sleep = (duration: number) => {
  // duration = 1000 => 1 second
  return new Promise<void>(function (resolve) {
    setTimeout(() => {
      resolve();
    }, duration);
  });
};

export const ceilWithPrecision = (n: string, precision = 3) => {
  const num = parseFloat(n);
  // Check if the conversion was successful
  if (isNaN(num)) {
    return n;
  }
  return num.toFixed(precision);
};

export const formatBignumberToUnits = (coin: string, balance: number) => {
  let units = 18;
  if (coin == "USDC" || coin == "USDT") {
    units = 6;
  }

  return formatUnits(balance, units);
};

export const formatStringToUnits = (coin: string, balance: number) => {
  let units = 18;
  if (coin == "USDC" || coin == "USDT") {
    units = 6;
  }

  return parseUnits(String(balance), units);
};

export const calculateRemainingTime = (expiryDate: string): string => {
  const now = new Date();
  const expiry = new Date(expiryDate);
  const diff = expiry.getTime() - now.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${days}d ${hours}h ${minutes}m`;
};

export const generateDummyData = (
  baseStrike: number,
  count: number
): OptionData[] => {
  return Array.from({ length: count }, (_, i) => ({
    delta: Math.random(),
    iv: 6 + Math.random() * 4,
    bidSize: Math.random() * 10,
    bidPrice: Math.random() * 50,
    askPrice: Math.random() * 50,
    askSize: Math.random() * 10,
    volume: Math.random() * 100,
    strike: baseStrike + i * 100,
  }));
};

export const check0xHex = (num: BigNumberish) => {
  return num === "0x" ? BigNumber.from(0) : num;
};

export const capitalizeFirstLetter = (val: string) => {
  return val.charAt(0).toUpperCase() + val.slice(1);
}
