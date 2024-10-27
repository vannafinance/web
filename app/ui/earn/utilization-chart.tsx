"use client";

import { useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { name: "10", value: 5 },
  { name: "19", value: 6 },
  { name: "38", value: 7 },
  { name: "60", value: 8 },
  { name: "79", value: 9 },
  { name: "98", value: 70 },
  { name: "100", value: 40 },
];

const UtilizationChart = ({ pool, utilizationRate }: { pool: PoolTable, utilizationRate: string | undefined }) => {
  useEffect(() => {
    if (pool) {}
    // fetch data here
  }, [pool]);

  return (
    <div className="bg-baseComplementary dark:bg-baseDarkComplementary py-6 px-4 sm:px-10 rounded-2xl text-baseBlack dark:text-baseWhite font-bold">
      <h2 className="text-2xl mb-4">Utilization rate</h2>
      <div className="flex flex-col mb-2">
        <span className="text-xl mr-2">{utilizationRate}</span>
        <span className="text-sm">100%</span>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 14 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 14 }}
              orientation="right"
              domain={[0, 80]}
              tickFormatter={(value) => value.toFixed(2)}
            />
            <Tooltip
              contentStyle={{
                background: "#7a45da",
                border: "none",
                borderRadius: "8px",
                boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
              }}
              labelStyle={{ color: "#fafafa" }}
              itemStyle={{ color: "#fafafa" }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#8884d8"
              fillOpacity={1}
              fill="url(#colorGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default UtilizationChart;
