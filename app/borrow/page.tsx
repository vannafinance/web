"use client";

import AccountOverview from "../ui/borrow/account-overview";
import LevrageWithdraw from "../ui/borrow/leverage-withdraw";

export default function Page() {
  return (
    <div className="flex flex-col lg:flex-row gap-10 text-base">
      <div className="bg-white w-full mx-auto mb-6">
        <LevrageWithdraw />
      </div>
      <div className="flex-none w-full lg:w-2/5 xl:w-1/3 space-y-6 text-baseBlack font-medium">
        <AccountOverview />
      </div>
    </div>
  );
}
