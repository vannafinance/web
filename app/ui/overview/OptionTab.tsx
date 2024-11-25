import { useEffect, useState } from "react";
import InfoRow from "./InfoRowProps";
import Loader from "../components/loader";

const OptionTab: React.FC = () => {
  const loading = false;
  // const [loading, setLoading] = useState(false);
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
      {loading ? <Loader /> : <InfoRow label="Position" value={position} />}
      {loading ? <Loader /> : <InfoRow label="Size" value={size} />}
      {loading ? (
        <Loader />
      ) : (
        <InfoRow label="Entry Price" value={entryPrice} />
      )}
      {loading ? (
        <Loader />
      ) : (
        <InfoRow label="Current Price" value={currentPrice} />
      )}
      {loading ? (
        <Loader />
      ) : (
        <InfoRow label="Unrealized P&L" value={unrealizedPnl} />
      )}
      {loading ? <Loader /> : <InfoRow label="Triggers" value={triggers} />}
    </div>
  );
};

export default OptionTab;
