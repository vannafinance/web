import { useEffect, useState } from "react";
import InfoRow from "./InfoRowProps";

const SpotTab: React.FC = () => {
  const [ETH, setETH] = useState("");
  const [WETH, setWETH] = useState("");
  const [BTC, setBTC] = useState("");
  const [USDC, setUSDC] = useState("");
  const [USDT, setUSDT] = useState("");
  const [DAI, setDAI] = useState("");

  // TODO: delete below useEffect
  useEffect(() => {
    setETH("");
    setWETH("");
    setBTC("");
    setUSDC("");
    setUSDT("");
    setDAI("");
  }, []);

  return (
    <div className="grid grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-5">
      <InfoRow label="ETH" value={ETH} />
      <InfoRow label="WETH" value={WETH} />
      <InfoRow label="BTC" value={BTC} />
      <InfoRow label="USDC" value={USDC} />
      <InfoRow label="USDT" value={USDT} />
      <InfoRow label="DAI" value={DAI} />
    </div>
  );
};

export default SpotTab;
