"use client";

import React, { useEffect, useRef, memo } from "react";
import { useDarkMode } from "../header/use-dark-mode";

function TradingViewChart() {
  const container = useRef<HTMLDivElement>(null);
  const { isDarkMode } = useDarkMode();

  useEffect(() => {
    if (!container.current) return;

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;

    const chartConfig = {
      autosize: true,
      symbol: "COINBASE:ETHUSD",
      interval: "D",
      timezone: "Etc/UTC",
      theme: isDarkMode ? "dark" : "light",
      style: "1",
      locale: "en",
      backgroundColor: isDarkMode ? "#181822" : "#fafafa",
      allow_symbol_change: true,
      save_image: false,
      calendar: false,
      support_host: "https://www.tradingview.com",
    };

    script.innerHTML = JSON.stringify(chartConfig);

    container.current.innerHTML = "";
    container.current.appendChild(script);

    return () => {
      if (container.current) {
        container.current.innerHTML = "";
      }
    };
  }, [isDarkMode]);

  return (
    <div
      className="tradingview-widget-container"
      ref={container}
      style={{ height: "100%", width: "100%" }}
    >
      <div
        className="tradingview-widget-container__widget"
        style={{ height: "calc(100% - 32px)", width: "100%" }}
      ></div>
      {/* <div className="tradingview-widget-copyright">
        <a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank"> 
          <span className="white-text">&#169; Track all markets on TradingView</span>
        </a> 
      </div> */}
    </div>
  );
}

export default memo(TradingViewChart);
