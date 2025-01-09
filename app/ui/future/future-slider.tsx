"use client";
import Image from "next/image";
import React, { useEffect, useState } from "react";

const FutureSlider: React.FC<SliderProps> = ({ value, onChange }) => {
  const [inputValue, setInputValue] = useState(value.toString());

  useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    onChange(newValue);
  };

  const percentage = ((value - 1) / 9) * (94 - 0.9) + 0.9;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    const numValue = Number(newValue);
    if (!isNaN(numValue) && numValue >= 1 && numValue <= 10) {
      onChange(numValue);
    }
  };

  const handleInputBlur = () => {
    const numValue = Number(inputValue);
    if (isNaN(numValue) || numValue < 1) {
      setInputValue("1");
      onChange(1);
    } else if (numValue > 10) {
      setInputValue("10");
      onChange(10);
    } else {
      setInputValue(Math.round(numValue).toString());
      onChange(Math.round(numValue));
    }
  };

  return (
    <div className="w-full text-xl">
      <span className="text-sm font-normal mb-2 block">
        Get Composible Leverage
      </span>
      <div className="flex items-center pr-5">
        {/* Number input */}
        <div className="flex items-center mr-5">
          <input
            type="number"
            min="1"
            max="10"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            className="w-12 p-1.5 dark:bg-baseDark text-center border border-purple rounded-md text-lg font-medium  [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>

        {/* Slider */}
        <div className="flex-grow relative">
          {/* Background track */}
          <div className="absolute h-1 w-[90%] left-[5%] bg-gray-200 -translate-y-3/4 self-center"></div>

          {/* Gradient track */}
          <div
            className="absolute h-1 bg-gradient-to-r from-gradient-1 to-gradient-2 -translate-y-3/4"
            style={{ width: `${percentage}%`, left: "5%" }}
          ></div>

          {/* Hexagon thumb with logo placeholder */}
          <div
            className="absolute -translate-y-[60%] -translate-x-1/4 z-[5] pointer-events-none"
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

          {/* Range input for functionality */}
          <input
            type="range"
            min="1"
            max="10"
            step="1"
            value={value}
            onChange={handleSliderChange}
            className="absolute left-0 w-full -translate-y-3/4 h-8 opacity-0 cursor-pointer z-[8]"
          />

          {/* Tick marks */}
          <div className="absolute w-full flex justify-between mt-3.5 text-xs font-semibold text-neutral-500 pl-1.5">
            {[1, 4, 7, 10].map((val, i) => (
              <span key={i}>{val}x</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FutureSlider;
