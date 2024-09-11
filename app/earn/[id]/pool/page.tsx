"use client";

import { RootState } from "@/app/store/store";
import PoolDetailTabMenu from "@/app/ui/earn/pool-detail-tab-menu";
import SupplyWithdraw from "@/app/ui/earn/supply-withdraw";
import { CaretLeft } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useState } from "react";
import { useSelector } from "react-redux";

export default function Page({ params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const pools = useSelector((state: RootState) => state.pools.poolsData);
    const pool = pools.find((pool) => pool.id === Number(id));

    const [utilizationRate, setUtilizationRate] = useState("-");
    const [uniqueLP, setUniqueLP] = useState("-");

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
            src={pool.icon1}
            alt=""
            width="40"
            height="40"
          />
          <span className="text-2xl font-bold text-baseBlack">{pool.name}</span>
          {pool.version != undefined && pool.version > 0 && (
            <span className="px-2 py-0.5 inline-flex text-xs leading-4 font-medium rounded-md bg-purpleBG-lighter text-purple">
              v{pool.version}
            </span>
          )}
          {pool.isActive && (
            <span className="px-2 py-0.5 inline-flex text-xs leading-4 font-medium rounded-md bg-purpleBG-lighter text-purple">
              Active
            </span>
          )}
        </div>

        <div className="flex flex-row gap-10 text-base">
          <div className="bg-white pt-4 w-full mx-auto mb-6">
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="p-6 pr-0">
                <div className="text-sm font-semibold text-neutral-500">
                  Supply
                </div>
                <div className="pt-2 text-2xl font-bold text-baseBlack">
                  {pool.supply}
                </div>
              </div>
              <div className="p-6 pr-0">
                <div className="text-sm font-semibold text-neutral-500">
                  Supply APY
                </div>
                <div className="pt-2 text-2xl font-bold text-baseBlack">
                  {pool.supplyAPY}
                </div>
              </div>
              <div className="p-6 pr-0">
                <div className="text-sm font-semibold text-neutral-500">
                  Utilization rate
                </div>
                <div className="pt-2 text-2xl font-bold text-baseBlack">
                  {utilizationRate}
                </div>
              </div>
              <div className="p-6 pr-0">
                <div className="text-sm font-semibold text-neutral-500">
                  Unique LP
                </div>
                <div className="pt-2 text-2xl font-bold text-baseBlack">
                  {uniqueLP}
                </div>
              </div>
              <div className="p-6 pr-0">
                <div className="text-sm font-semibold text-neutral-500">
                  Your Balance
                </div>
                <div className="pt-2 text-2xl font-bold text-baseBlack">
                  {pool.yourBalance}
                </div>
              </div>
            </div>
            <PoolDetailTabMenu />
          </div>
          <div className="flex-none w-2/5">
            <SupplyWithdraw balance="10" currentAPY="1" />
          </div>
        </div>
      </>
    );
  } catch (error) {
    console.error(error);
  }
}
