"use client";

import React from "react";
import {
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
} from "recharts";

const OptionPayoffChart = () => {
  // Option data for each position
  const strikePrices = [
    { type: "call", strike: 2550, premium: 21.4 },
    { type: "put", strike: 2550, premium: 151.9 },
    { type: "call", strike: 2600, premium: 14.0 },
  ];

  // Define a function to calculate combined payoffs for the three positions
  const calculatePayoff = (
    price: number,
    strike: number,
    type: string,
    premium: number
  ) => {
    if (type === "call") {
      return Math.max(0, price - strike) - premium;
    } else if (type === "put") {
      return Math.max(0, strike - price) - premium;
    }
    return 0;
  };

  // Generate data for the chart
  const generatePayoffData = () => {
    const prices = [];
    for (let i = 2000; i <= 3000; i += 10) {
      const payoff1 = calculatePayoff(
        i,
        strikePrices[0].strike,
        strikePrices[0].type,
        strikePrices[0].premium
      );
      const payoff2 = calculatePayoff(
        i,
        strikePrices[1].strike,
        strikePrices[1].type,
        strikePrices[1].premium
      );
      const payoff3 = calculatePayoff(
        i,
        strikePrices[2].strike,
        strikePrices[2].type,
        strikePrices[2].premium
      );
      const totalPayoff = payoff1 + payoff2 + payoff3;

      prices.push({
        price: i,
        payoff: totalPayoff,
      });
    }
    return prices;
  };

  const data = generatePayoffData();

  const strike = 25050;
  const callOI = 24.31;
  const putOI = 18.51;

  return (
    <div>
      <div className="flex items-center justify-center space-x-4 px-4 py-2 mb-5 bg-baseComplementary text-sm text-baseBlack font-normal rounded-lg">
        <span className="">OI data at strike</span>
        <div className="font-semibold border border-neutral-300 rounded-md p-1">
          {strike}
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 bg-red-100 inline-block"></span>
          <span>Call OI {callOI}L</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 bg-green-100 inline-block"></span>
          <span>Put OI {putOI}L</span>
        </div>
      </div>
      <div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart
            data={data}
            height={300}
            margin={{ top: 0, right: 20, left: 0, bottom: 20 }}
          >
            <defs>
              {/* Define gradient for the fill colors (profit in green, loss in red) */}
              <linearGradient id="colorProfitLoss" x1="0" y1="0" x2="0" y2="1">
                <stop offset="50%" stopColor="#82ca9d" stopOpacity={1} />
                <stop offset="50%" stopColor="#ff4d4d" stopOpacity={1} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="price"
              label={{ value: "ETH Price", position: "bottom" }}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              label={{
                value: "Profit / Loss",
                angle: "-90",
                offset: 0,
                position: "right",
              }}
              orientation="right"
              tick={{ fontSize: 12 }}
            />
            <Tooltip />
            <ReferenceLine
              x={2550}
              stroke="white"
              label={{
                position: "top",
                value: "ETH Price\n$2550",
                fill: "white",
                fontSize: 12,
              }}
            />

            {/* Area for Profit / Loss */}
            <Area
              type="monotone"
              dataKey="payoff"
              stroke="#8884d8"
              fill="url(#colorProfitLoss)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default OptionPayoffChart;
