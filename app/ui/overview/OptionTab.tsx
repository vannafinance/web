import { useEffect, useState } from "react";
import InfoRow from "./InfoRowProps";

const OptionTab: React.FC = () => {
  const [position, setPosition] = useState("");
  const [size, setSize] = useState("");
  const [entryPrice, setEntryPrice] = useState("");
  const [currentPrice, setCurrentPrice] = useState("");
  const [unrealizedPnl, setUnrealizedPnl] = useState("");
  const [triggers, setTriggers] = useState("");

  // TODO: delete below useEffect
  useEffect(() => {
    setPosition("");
    setSize("");
    setEntryPrice("");
    setCurrentPrice("");
    setUnrealizedPnl("");
    setTriggers("");
  }, []);

  return (
    <div className="grid grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-5">
      <InfoRow label="Position" value={position} />
      <InfoRow label="Size" value={size} />
      <InfoRow label="Entry Price" value={entryPrice} />
      <InfoRow label="Current Price" value={currentPrice} />
      <InfoRow label="Unrealized P&L" value={unrealizedPnl} />
      <InfoRow label="Triggers" value={triggers} />
    </div>
  );
};

export default OptionTab;
