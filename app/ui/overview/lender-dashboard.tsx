"use client";

import Link from "next/link";

interface PoolProps {
  number: number;
  name: string;
  amount: string;
  profit: string;
  apy: string;
  percentage: string;
  isLoss?: boolean;
}

const Pool: React.FC<PoolProps> = ({
  number,
  name,
  amount,
  profit,
  apy,
  percentage,
  isLoss,
}) => (
  <div className="flex items-center justify-between bg-white rounded-lg p-3 mb-2">
    <span className="">{number}</span>
    <div className="">{name}</div>
    <span className="">{amount}</span>
    <span className="">
      {profit}{" "}
      {isLoss ? (
        <span className="text-baseSuccess-300">{percentage}</span>
      ) : (
        <span className="text-baseSecondary-500">{percentage}</span>
      )}
    </span>
    <span className="">{apy}</span>
  </div>
);

const PositionsInPools: React.FC = () => (
  <div className="bg-white rounded-3xl border border-purpleBG-lighter px-5 py-10">
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-lg font-semibold">Positions In Pools</h2>
      <Link
        href="/earn"
        className="text-purple underline text-sm font-semibold"
      >
        Go to Earn
      </Link>
    </div>
    <div className="bg-gray-100 rounded-lg p-2 mb-2">
      <div className="flex text-sm font-medium justify-between">
        <span className="">#</span>
        <span className="">Pool</span>
        <span className="">In pool</span>
        <span className="">Profit & Loss</span>
        <span className="">Expected APY</span>
      </div>
    </div>
    <Pool
      number={1}
      name="WBTC"
      amount="$200.00"
      profit="+120"
      apy="0.50%"
      percentage="(+0.50%)"
      isLoss
    />
    <Pool
      number={2}
      name="USDT"
      amount="$200.00"
      profit="10"
      apy="8.60%"
      percentage="(+0.50%)"
    />
    <Pool
      number={3}
      name="USDC/ETH"
      amount="$200.00"
      profit="+120"
      apy="10.50%"
      percentage="(+12.50%)"
    />
    <Pool
      number={4}
      name="WETH"
      amount="$200.00"
      profit="+120"
      apy="7.66%"
      percentage="(+16.97%)"
    />
  </div>
);

const LenderDashboard: React.FC = () => <PositionsInPools />;

export default LenderDashboard;
