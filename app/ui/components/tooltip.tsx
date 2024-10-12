"use client";

import { useState } from "react";

const Tooltip: React.FC<TooltipProps> = ({ content, children }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </div>
      {isVisible && (
        <div className="absolute z-10 px-3 py-2 text-sm font-medium text-white dark:text-baseBlack bg-gray-900 dark:bg-baseComplementary rounded-lg shadow-sm bottom-full left-1/2 transform -translate-x-1/2 -translate-y-2">
          {content}
          <div className="absolute w-2 h-2 bg-gray-900 dark:bg-baseComplementary rotate-45 -bottom-1 left-1/2 transform -translate-x-1/2"></div>
        </div>
      )}
    </div>
  );
};

export default Tooltip;
