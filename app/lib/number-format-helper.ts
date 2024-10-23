/* eslint-disable @typescript-eslint/no-explicit-any */

import { BigNumber, BigNumberish } from "ethers";
import { formatEther, formatUnits } from "ethers/lib/utils";

const BILLION = Math.pow(10, 9);
const MILLION = Math.pow(10, 6);
const THOUSAND = Math.pow(10, 3);

export const fromBigNumber = (
  number: { toString: () => BigNumberish },
  decimals: BigNumberish | undefined
) => {
  return parseFloat(formatUnits(number.toString(), decimals));
};

export const formatPercentage = (pct: number, hidePlus: any) => {
  return `${pct > 0 ? (hidePlus ? "" : "+") : ""}${formatNumber(pct * 100, {
    showCommas: false,
  })}%`;
};

export const formatUSD = (price: any, options = {}) => {
  if (typeof price === "number" && isNaN(price)) {
    return "";
  }
  const numStr = formatNumber(price, { ...options, minDps: 2 });
  const isSigned = numStr.startsWith("-") || numStr.startsWith("+");
  if (isSigned) {
    return `${numStr.slice(0, 1)}$${numStr.slice(1)}`;
  } else {
    return `$${numStr}`;
  }
};

// default to 0.1% precision
const DEFAULT_PRECISION = 0.001;

const round = (val: number, dps: number) => {
  const mul = Math.pow(10, dps);
  return Math.round(val * mul) / mul;
};

export const formatNumber = (
  value: number,
  options: {
    dps?: number;
    minDps?: number;
    maxDps?: number;
    precision?: number;
    showSign?: boolean;
    showCommas?: boolean;
  }
) => {
  const {
    dps,
    minDps: _minDps = 0,
    maxDps: _maxDps = 6,
    precision = DEFAULT_PRECISION,
    showSign = false,
    showCommas = true,
  } = options ?? {};

  const minDps = dps !== undefined ? dps : _minDps;
  const maxDps = dps !== undefined ? dps : _maxDps;

  // resolve value as number
  let val = 0;
  if (BigNumber.isBigNumber(value)) {
    val = fromWei(value);
  } else {
    val = value;
  }

  if (isNaN(val)) {
    return "NaN";
  }

  let numDps = minDps;
  let currRoundedVal = round(val, numDps);
  for (; numDps <= maxDps; numDps++) {
    currRoundedVal = round(val, numDps);
    const currPrecision = Math.abs((val - currRoundedVal) / val);
    if (currPrecision <= precision) {
      // escape dp increment when we hit desired precision
      break;
    }
  }
  const roundedVal = currRoundedVal;

  // convert into styled string
  // commas for number part e.g. 1,000,000
  // padded zeroes for dp precision e.g. 0.1000
  const parts = roundedVal.toString().split(".");
  const num = showCommas
    ? parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    : parts[0]; // add commas
  const dec = (parts[1] || "").padEnd(minDps, "0");
  const numStr = dec != null && dec.length > 0 ? num + "." + dec : num;
  return roundedVal > 0 && showSign ? "+" + numStr : numStr;
};

export const fromWei = (number: BigNumber) => {
  return parseFloat(formatEther(number.toString()));
};

export const formatTruncatedUSD = (
  price: number,
  options: { showSign: any }
) => {
  const signStr = price < 0 ? "-" : price >= 0 && options?.showSign ? "+" : "";
  const val = BigNumber.isBigNumber(price) ? fromWei(price) : price;
  const absVal = Math.abs(val);
  return signStr + "$" + formatTruncatedNumber(absVal);
};

export const formatTruncatedNumber = (value: number) => {
  let val = 0;
  if (BigNumber.isBigNumber(value)) {
    val = fromWei(value);
  } else {
    val = value;
  }
  // TODO: @dappbeast Add trillion case... one day 8)
  if (Math.abs(val) >= BILLION - Math.pow(10, 7)) {
    // billion
    return formatNumber(val / BILLION, { minDps: 0, maxDps: 2 }) + "b";
  } else if (Math.abs(val) >= MILLION - Math.pow(10, 4)) {
    // million
    return formatNumber(val / MILLION, { minDps: 0, maxDps: 2 }) + "m";
  } else if (Math.abs(val) >= THOUSAND - Math.pow(10, 1)) {
    // thousand
    return formatNumber(val / THOUSAND, { minDps: 0, maxDps: 2 }) + "k";
  } else {
    // hundreds
    return formatNumber(val, { minDps: 0, maxDps: 2 });
  }
};
