"use client";
import Image from "next/image";
import React, { useEffect, useState } from "react";

interface SliderProps {
  value: number;
  onChange: (val: number) => void;
}

const FarmSlider: React.FC<SliderProps> = ({ value, onChange }) => {
  const [inputValue, setInputValue] = useState(value.toString());

  useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    onChange(newValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    const numValue = Number(newValue);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
      onChange(numValue);
    }
  };

  const handleInputBlur = () => {
    let numValue = Number(inputValue);
    if (isNaN(numValue) || numValue < 0) {
      numValue = 0;
    } else if (numValue > 100) {
      numValue = 100;
    }
    const rounded = Math.round(numValue);
    setInputValue(rounded.toString());
    onChange(rounded);
  };

  return (
    <div className="w-full text-xl ">
      <div className="flex items-center py-8 px-4">
        {/* Slider */}
        <div className="flex-grow relative">
          {/* Background track */}
          <div className="absolute h-1 w-full bg-gray-200 -translate-y-3/4 self-center"></div>

          {/* Gradient track */}
          <div
            className="absolute h-1 bg-gradient-to-r from-gradient-1 to-gradient-2 -translate-y-3/4"
            style={{ width: `${value}%` }}
          ></div>

          {/* Hexagon thumb */}
          <div
            className="absolute -translate-y-[60%] -translate-x-1/4 z-[5] pointer-events-none"
            style={{ left: `${value}%` }}
          >
            <div
              className="w-8 h-8 bg-gradient-to-r from-gradient-1 to-gradient-2 shadow-lg"
              style={{
                clipPath:
                  "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
              }}
            >
              <div
                className="w-7 h-8 m-0.5 p-0.5 flex items-center justify-center"
                style={{
                  clipPath:
                    "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                }}
              >
                <Image
                  src="/vanna-white-logo.svg"
                  alt="^_^"
                  width="18"
                  height="15"
                />
              </div>
            </div>
          </div>

          {/* Invisible range input */}
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={value}
            onChange={handleSliderChange}
            className="absolute left-0 w-full -translate-y-3/4 h-8 opacity-0 cursor-pointer z-[8]"
          />

          {/* Optional Tick Marks */}
          <div className="absolute w-full flex justify-between mt-3.5 text-xs font-semibold text-neutral-500 pl-1.5">
            {[0, 25, 50, 75, 100].map((val, i) => (
              <span key={i}>{val}%</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FarmSlider;
