"use client";

import Image from "next/image";
import Link from "next/link";

interface PoolProps {
  number: number;
  name: string;
  amount: string;
  profit: string;
  apy: string;
  percentage: string;
  icon: string;
  isLoss?: boolean;
}

const Pool: React.FC<PoolProps> = ({
  number,
  name,
  amount,
  profit,
  apy,
  percentage,
  icon,
  isLoss,
}) => (
  <div className="flex items-center justify-between bg-white rounded-lg p-3 mb-2">
    <span className="">{number}</span>
    <div className="flex flex-row justify-between w-20">
      <Image src={icon} alt={name} width={24} height={24} /> {name}
    </div>
    <span className="">{amount}</span>
    <span className="">
      {profit}{" "}
      {isLoss ? (
        <span className="text-baseSecondary-500">{percentage}</span>
      ) : (
        <span className="text-baseSuccess-300">{percentage}</span>
      )}
    </span>
    <span className="">{apy}</span>
  </div>
);

const PositionsInPools: React.FC = () => (
  <div>
    <div className="hidden xl:block bg-white rounded-3xl border border-purpleBG-lighter px-5 py-10">
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
        icon="/btc-icon.svg"
        isLoss
      />
      <Pool
        number={2}
        name="USDT"
        amount="$200.00"
        profit="-100"
        apy="8.60%"
        percentage="(+0.50%)"
        icon="/usdt-icon.svg"
      />
      <Pool
        number={3}
        name="USDC"
        amount="$200.00"
        profit="+120"
        apy="9.50%"
        percentage="(+12.50%)"
        icon="/usdc-icon.svg"
      />
      <Pool
        number={4}
        name="WETH"
        amount="$200.00"
        profit="+120"
        apy="7.66%"
        percentage="(+16.97%)"
        icon="/eth-icon.svg"
      />
    </div>

    <div className="xl:hidden">
      <div className="mt-6 lg:mt-0 mb-3">
        <h2 className="text-lg font-semibold pl-2">Positions In Pools</h2>
      </div>

      <div className="bg-white rounded-3xl border border-purpleBG-lighter text-baseBlack p-4 mb-3">
        <div className="flex items-center mb-8 text-base font-medium">
          <span className="mr-4 text-neutral-500">1</span>
          <div className="relative w-6 h-6 mr-2">
            <Image
              src="/btc-icon.svg"
              alt={"WBTC"}
              layout="fill"
              className="rounded-full"
            />
          </div>
          <span className="font-bold text-lg">{"WBTC"}</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 gap-4 text-base">
          <div>
            <p className="text-sm text-gray-500 mb-1">In Pool</p>
            <p className="">$200.00</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Profit & Loss</p>
            <p className="">
              +120{" "}
              <span className="text-baseSecondary-500 text-xs">
                {"(+0.50%)"}
              </span>
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Expected APY</p>
            <p className="">0.50%</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-purpleBG-lighter text-baseBlack p-4 mb-3">
        <div className="flex items-center mb-8 text-base font-medium">
          <span className="mr-4 text-neutral-500">2</span>
          <div className="relative w-6 h-6 mr-2">
            <Image
              src="/usdt-icon.svg"
              alt={"USDT"}
              layout="fill"
              className="rounded-full"
            />
          </div>
          <span className="font-bold text-lg">{"USDT"}</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 gap-4 text-base">
          <div>
            <p className="text-sm text-gray-500 mb-1">In Pool</p>
            <p className="">$200.00</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Profit & Loss</p>
            <p className="">
              -100{" "}
              <span className="text-baseSuccess-300 text-xs">{"(+0.50%)"}</span>
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Expected APY</p>
            <p className="">8.60%</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-purpleBG-lighter text-baseBlack p-4 mb-3">
        <div className="flex items-center mb-8 text-base font-medium">
          <span className="mr-4 text-neutral-500">3</span>
          <div className="relative w-6 h-6 mr-2">
            <Image
              src="/usdc-icon.svg"
              alt={"USDC"}
              layout="fill"
              className="rounded-full"
            />
          </div>
          <span className="font-bold text-lg">{"USDC"}</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 gap-4 text-base">
          <div>
            <p className="text-sm text-gray-500 mb-1">In Pool</p>
            <p className="">$200.00</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Profit & Loss</p>
            <p className="">
              +120{" "}
              <span className="text-baseSuccess-300 text-xs">{"(+12.50%)"}</span>
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Expected APY</p>
            <p className="">9.50%</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-purpleBG-lighter text-baseBlack p-4 mb-3">
        <div className="flex items-center mb-8 text-base font-medium">
          <span className="mr-4 text-neutral-500">4</span>
          <div className="relative w-6 h-6 mr-2">
            <Image
              src="/eth-icon.svg"
              alt={"WETH"}
              layout="fill"
              className="rounded-full"
            />
          </div>
          <span className="font-bold text-lg">{"WETH"}</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 gap-4 text-base">
          <div>
            <p className="text-sm text-gray-500 mb-1">In Pool</p>
            <p className="">$200.00</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Profit & Loss</p>
            <p className="">
              +120{" "}
              <span className="text-baseSuccess-300 text-xs">{"(+16.97%)"}</span>
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Expected APY</p>
            <p className="">7.66%</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const LenderDashboard: React.FC = () => <PositionsInPools />;

export default LenderDashboard;
