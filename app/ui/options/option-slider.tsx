"use client";

import Image from "next/image";
import React from "react";

const OptionSlider: React.FC<SliderProps> = ({ value, onChange }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(Number(e.target.value));
  };

  const percentage = ((value - 1) / 99) * 100; // Convert value to percentage

  return (
    <div className="w-full text-xl">
      <span className="text-sm font-normal text-neutral-500">
        Get Composible Leverage
      </span>
      <div className="px-3">
        <div className="relative pt-6 pb-12">
          {/* Background track */}
          <div className="absolute top-1/2 h-1 w-full bg-gray-200 -translate-y-1/2"></div>

          {/* Gradient track */}
          <div
            className="absolute top-1/2 h-1 bg-gradient-to-r from-gradient-1 to-gradient-2 -translate-y-1/2"
            style={{ width: `${percentage}%` }}
          ></div>

          {/* Hexagon thumb with logo placeholder */}
          <div
            className="absolute top-1/3 -translate-y-1/4 -translate-x-1/2 z-10 pointer-events-none"
            style={{ left: `${percentage}%` }}
          >
            <div
              className="w-8 h-8 bg-gradient-to-r from-gradient-1 to-gradient-2 shadow-lg"
              style={{
                clipPath:
                  "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
              }}
            >
              <div
                className="w-7 h-7 m-0.5 p-0.5 flex items-center justify-center"
                style={{
                  clipPath:
                    "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                }}
              >
                {/* Logo placeholder - replace this with your actual logo */}
                <Image
                  src="/vanna-white-logo.svg"
                  alt="^_^"
                  width="18"
                  height="15"
                />
              </div>
            </div>
          </div>

          {/* Range input for functionality */}
          <input
            type="range"
            min="1"
            max="100"
            step="1"
            value={value}
            onChange={handleChange}
            className="absolute top-1/2 left-0 w-full -translate-y-1/2 h-8 opacity-0 cursor-pointer z-20"
          />

          {/* Tick marks */}
          <div className="absolute w-full flex justify-between mt-7 text-xs font-semibold text-neutral-500">
            {[1, 25, 50, 75, 100].map((val, i) => (
              <span key={i}>{val}x</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OptionSlider;
