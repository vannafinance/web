import { pools } from "@/app/lib/static-values";
import Image from "next/image";
import Link from "next/link";

// const PoolsTable: React.FC<{ pools: Pool[] }> = ({ pools }) => (
const PoolsTable = () => (
  <div className="mt-4 overflow-x-auto">
    <div className="min-w-full text-base font-medium text-baseBlack">
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
