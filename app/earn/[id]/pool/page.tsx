"use client";

import { poolMap } from "@/app/lib/constants";
import PoolDetails from "@/app/ui/earn/pool-details";
import SupplyWithdraw from "@/app/ui/earn/supply-withdraw";
import { CaretLeft } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

export default function Page({ params }: { params: { id: string } }) {
  const id = params.id;
  const pool = poolMap.get(id);

  if (!pool) {
    notFound();
  }

  return (
    <>
      <Link href="/earn" className="flex items-center mb-6">
        <CaretLeft size={20} color="#737373" />
        <span className="text-base font-medium text-neutral-500">
          Back to pools
        </span>
      </Link>

      <div className="flex items-center mb-5 space-x-2">
        <Image
          className="rounded-full shadow-md ring-1 ring-black ring-opacity-20"
          src="/eth-icon.svg"
          alt=""
          width="40"
          height="40"
        />
        <span className="text-2xl font-bold text-baseBlack">WBTC/ETH</span>
        <span className="px-2 py-0.5 inline-flex text-xs leading-4 font-medium rounded-md bg-purpleBG-lighter text-purple">
          v{1}
        </span>
        <span className="px-2 py-0.5 inline-flex text-xs leading-4 font-medium rounded-md bg-purpleBG-lighter text-purple">
          Active
        </span>
      </div>

      <div className="flex flex-row gap-10 text-base">
        <div className="bg-white pt-4 w-full mx-auto">
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="p-6 pr-0">
              <div className="text-sm font-semibold text-neutral-500">Supply</div>
              <div className="pt-2 text-2xl font-bold text-baseBlack">18.56K ETH</div>
            </div>
            <div className="p-6 pr-0">
              <div className="text-sm font-semibold text-neutral-500">Supply APY</div>
              <div className="pt-2 text-2xl font-bold text-baseBlack">3.2%</div>
            </div>
            <div className="p-6 pr-0">
              <div className="text-sm font-semibold text-neutral-500">Utilization rate</div>
              <div className="pt-2 text-2xl font-bold text-baseBlack">54.18%</div>
            </div>
            <div className="p-6 pr-0">
              <div className="text-sm font-semibold text-neutral-500">Unique LP</div>
              <div className="pt-2 text-2xl font-bold text-baseBlack">1386</div>
            </div>
            <div className="p-6 pr-0">
              <div className="text-sm font-semibold text-neutral-500">Your Balance</div>
              <div className="pt-2 text-2xl font-bold text-baseBlack">4000 USDT</div>
            </div>
          </div>
          <PoolDetails />
        </div>
        <div className="flex-none w-2/5">
          <SupplyWithdraw balance="10" currentAPY="1" />
        </div>
      </div>
    </>
  );
}
