"use client";

import OverviewTabMenu from "./ui/overview/overview-tab-menu";

export default function Page() {
  return (
    <div className="container mx-auto px-2 lg:px-10 pt-4 lg:pt-14 dark:bg-baseDark">
      <div className="text-2xl font-semibold dark:text-baseWhite">Dashboard</div>
      <OverviewTabMenu />
    </div>
  );
}
