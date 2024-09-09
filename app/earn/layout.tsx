import TabComponent from "../ui/earn/TabComponent";

export default function Layout({ children }: { children: React.ReactNode }) {
  const tabs = [
    { name: "Pools", href: "/earn" },
    { name: "Analytics", href: "/analytics" },
    { name: "History", href: "/history" },
  ];

  return (
    <div className="w-9/12 mx-auto my-12">
      <TabComponent tabs={tabs} />
      {children}
    </div>
  );
}
