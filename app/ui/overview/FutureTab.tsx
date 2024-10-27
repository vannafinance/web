import { useEffect, useState } from "react";
import InfoRow from "./InfoRowProps";

const FutureTab: React.FC = () => {
  const [market, setMarket] = useState("");
  const [size, setSize] = useState("");
  const [collateral, setCollateral] = useState("");
  const [entryPrice, setEntryPrice] = useState("");
  const [liquidationPrice, setLiquidationPrice] = useState("");
  const [profitLoss, setProfitLoss] = useState("");
  const [profitLossPercentage, setProfitLossPercentage] = useState("");

  // TODO: delete below useEffect
  useEffect(() => {
    setMarket("");
    setSize("");
    setCollateral("");
    setEntryPrice("");
    setLiquidationPrice("");
    setProfitLoss("");
    setProfitLossPercentage("");
  }, []);

  return (
    <div className="grid grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-5">
      <InfoRow label="Market" value={market} />
      <InfoRow label="Size" value={size} />
      <InfoRow label="Collateral" value={collateral} />
      <InfoRow label="Entry Price" value={entryPrice} />
      <InfoRow label="Liq. Price" value={liquidationPrice} />
      <InfoRow label="PNL" value={profitLoss} subValue={profitLossPercentage} />
    </div>
  );
};

export default FutureTab;
