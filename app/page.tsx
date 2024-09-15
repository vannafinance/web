"use client";

import OverviewTabMenu from "./ui/overview/overview-tab-menu";

export default function Page() {
  return (
    <div className="px-10 pt-14">
      <div className="text-2xl font-semibold">Dashboard</div>
      <OverviewTabMenu />
    </div>
  );
}
