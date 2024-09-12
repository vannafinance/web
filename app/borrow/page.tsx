"use client";

import AccountOverview from "../ui/borrow/account-overview";
import LevrageWithdraw from "../ui/borrow/leverage-withdraw";

export default function Page() {
  return (
    <div className="flex flex-row gap-10 text-base pt-4">
      <div className="bg-white w-full mx-auto mb-6">
        <LevrageWithdraw />
      </div>
      <div className="flex-none w-1/3 space-y-6 text-baseBlack font-medium">
        <AccountOverview />
      </div>
    </div>
  );
}
