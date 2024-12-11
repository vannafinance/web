"use client";

import React, { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

const OptionPayoffChart: React.FC<{
  position: FuturePosition;
}> = ({ position }) => {
  const [data, setData] = useState<
    {
      price: number;
      payoff: number;
    }[]
  >();
  const [colorStop1, setColorStop1] = useState<string>("");
  const [colorStop2, setColorStop2] = useState<string>("");

  const generateVariablePayoffData = (
    delta: number,
    entryPrice: number,
    size: number,
    liqPrice: number
  ) => {
    const chartData = [];
    const step = 10;
    const range = Math.abs(entryPrice - liqPrice);
    const minPrice = Math.floor(entryPrice - range);
    const maxPrice = Math.ceil(entryPrice + range);

    for (let price = minPrice; price <= maxPrice; price += step) {
      let payoff;
      if (delta === 1) {
        // Long position
        //@TODO : add logic that after thr liquidation price loss is same as liquation price
        payoff = size * (price - entryPrice); // Max loss (flat line)
      } else if (delta === -1) {
        // Short position
        payoff = size * (entryPrice - price); // Max loss (flat line)
      } else {
        payoff = 0;
      }

      chartData.push({
        price,
        payoff,
      });
    }
    return chartData;
  };

  useEffect(() => {
    const result = generateVariablePayoffData(
      Number(position?.delta),
      Number(position?.entryPrice),
      Number(position?.size),
      Number(position?.liqPrice)
    );

    setData(result);
    setColorStop1(result.some((d) => d.payoff > 0) ? "#82ca9d" : "#ff4d4d"); // Green if any positive payoff
    setColorStop2(result.some((d) => d.payoff < 0) ? "#ff4d4d" : "#82ca9d"); // Red if any negative payoff
  }, [position]);

  return (
    <ResponsiveContainer width="100%" height={350}>
      <AreaChart data={data} margin={{ bottom: 20 }}>
        <defs>
          <linearGradient id="colorProfitLoss" x1="0" y1="0" x2="0" y2="1">
            <stop offset="50%" stopColor={colorStop1} stopOpacity={1} />
            <stop offset="50%" stopColor={colorStop2} stopOpacity={1} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="price"
          label={{ value: "Price", position: "bottom" }}
          tick={{ fontSize: 12 }}
        />
        <YAxis
          label={{
            value: "Profit / Loss",
            angle: -90,
            position: "insideLeft",
          }}
          tick={{ fontSize: 12 }}
        />
        <Tooltip />
        <ReferenceLine
          x={position?.entryPrice}
          stroke="blue"
          label={{
            position: "top",
            value: "Entry Price",
            // fill: "white",
            // fontSize: 12,
          }}
        />
        <ReferenceLine
          x={position?.liqPrice}
          stroke="red"
          label={{ value: "Liquidation Price", position: "top" }}
        />
        <ReferenceLine
          x={position?.entryPrice}
          stroke="green"
          label={{ value: "Current Price", position: "top" }}
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
  );
};

export default OptionPayoffChart;
