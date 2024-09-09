import Image from "next/image";
import Link from "next/link";

interface Pool {
  id: number;
  name: string;
  icon1: string;
  icon2?: string;
  supply: string;
  supplyAPY: string;
  borrowAPY: string;
  yourBalance: string;
  isActive?: boolean;
  version?: number;
}

const pools: Pool[] = [
  {
    id: 1,
    name: "WBTC/ETH",
    icon1: "/eth-icon.svg",
    icon2: "/eth-icon.svg",
    supply: "345.8K",
    supplyAPY: "$196.2M",
    borrowAPY: "53.8M",
    yourBalance: "$25.1M",
    isActive: true,
    version: 2,
  },
  {
    id: 2,
    name: "WBTC/ETH",
    icon1: "/eth-icon.svg",
    icon2: "/eth-icon.svg",
    supply: "345.8K",
    supplyAPY: "$196.2M",
    borrowAPY: "53.8M",
    yourBalance: "$25.1M",
    isActive: false,
    version: 3,
  },
  {
    id: 3,
    name: "WBTC/ETH",
    icon1: "/eth-icon.svg",
    icon2: "/eth-icon.svg",
    supply: "345.8K",
    supplyAPY: "$196.2M",
    borrowAPY: "53.8M",
    yourBalance: "$25.1M",
    isActive: true,
  },
  {
    id: 4,
    name: "WBTC/ETH",
    icon1: "/eth-icon.svg",
    icon2: "/eth-icon.svg",
    supply: "345.8K",
    supplyAPY: "$196.2M",
    borrowAPY: "53.8M",
    yourBalance: "$25.1M",
    isActive: false,
  },
];

// const PoolsTable: React.FC<{ pools: Pool[] }> = ({ pools }) => (
const PoolsTable = () => (
  <div className="mt-4 overflow-x-auto">
    <div className="min-w-full text-sm font-medium text-baseBlack">
      {/* Header */}
      <div className="bg-baseComplementary grid grid-cols-7 rounded-xl px-6 py-3 font-semibold">
        <div className="text-center">#</div>
        <div className="col-span-2">Pool</div>
        <div>Supply</div>
        <div>Supply APY</div>
        <div>Borrow APY</div>
        <div>Your Balance</div>
      </div>

      {/* Body */}
      <div className="bg-white text-center pt-6">
        {pools.map((pool) => (
          <Link
            href={`/earn/${pool.id}/pool`}
            key={pool.id}
            className="block group"
          >
            <div className="relative grid grid-cols-7 px-6 py-3 whitespace-nowrap transition-all duration-200 ease-in-out rounded-xl">
              <div className="z-10">{pool.id}</div>
              <div className="z-10 col-span-2">
                <div className="flex items-center">
                  <Image
                    className="rounded-full shadow-md ring-1 ring-black ring-opacity-20"
                    src={pool.icon1}
                    alt=""
                    width="24"
                    height="24"
                  />
                  {pool.icon2 && (
                    <Image
                      className="rounded-full shadow-md ring-1 ring-black ring-opacity-20 -ml-2"
                      src={pool.icon2}
                      alt=""
                      width="24"
                      height="24"
                    />
                  )}
                  <div className="ml-4 flex items-center space-x-2">
                    <div className="font-medium text-gray-900">{pool.name}</div>
                    {pool.version && (
                      <span className="px-2 inline-flex text-xs leading-4 font-medium rounded-md bg-purpleBG-lighter text-purple">
                        v{pool.version}
                      </span>
                    )}
                    {pool.isActive && (
                      <span className="px-2 inline-flex text-xs leading-4 font-medium rounded-md bg-purpleBG-lighter text-purple">
                        Active
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="z-10">{pool.supply}</div>
              <div className="z-10">{pool.supplyAPY}</div>
              <div className="z-10">{pool.borrowAPY}</div>
              <div className="z-10">{pool.yourBalance}</div>
              <div className="absolute inset-0 rounded-xl bg-transparent z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-in-out pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-r from-gradient-1 to-gradient-2 rounded-xl"></div>
                <div className="absolute inset-[1px] bg-white rounded-xl"></div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  </div>
);

export default PoolsTable;
