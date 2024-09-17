import { useState } from "react";
import Link from "next/link";
import { CaretDown, CaretUp } from "@phosphor-icons/react";

const links = [
  { title: "Overview", href: "/" },
  { title: "Earn", href: "/earn" },
  { title: "Borrow", href: "/borrow" },
  { title: "Trade", href: "/trade" },
  // { title: "Analytics", href: "/analytics" },
];

const tradeSubLinks = [
  {
    title: "Dashboard",
    href: "/trade/dashboard",
    subtitle: "Contracts settled in USDT and USDC",
  },
  {
    title: "Perps",
    href: "/trade/future",
    subtitle: "Contracts settled in cryptocurrency",
  },
  {
    title: "Options",
    href: "/trade/options",
    subtitle: "USDT Options with limited downside and affordable entry",
  },
  {
    title: "Spot",
    href: "/trade/spot",
    subtitle: "USDT Options with limited downside and affordable entry",
  },
];

export default function BurgerMenu({ onClose }: BurgerMenuProps) {
  const [isTradeExpanded, setIsTradeExpanded] = useState(false);

  return (
    <div className="fixed inset-0 z-40 bg-white">
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto p-4 pt-2">
          {links.map((link) => (
            <div key={link.title}>
              {link.title === "Trade" ? (
                <div>
                  <button
                    onClick={() => setIsTradeExpanded(!isTradeExpanded)}
                    className="flex items-center justify-between w-full py-3 px-4 text-left text-lg font-medium text-baseBlack"
                  >
                    {link.title}
                    {isTradeExpanded ? (
                      <CaretUp />
                    ) : (
                      <CaretDown />
                    )}
                  </button>
                  {isTradeExpanded && (
                    <div className="pl-8 space-y-2">
                      {tradeSubLinks.map((subLink) => (
                        <Link
                          key={subLink.title}
                          href={subLink.href}
                          onClick={onClose}
                          className="block py-2 text-base hover:text-gray-900 transition-colors duration-200"
                        >
                          {subLink.title}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href={link.href}
                  onClick={onClose}
                  className="block py-3 px-4 text-lg font-medium hover:bg-gray-100 transition-colors duration-200"
                >
                  {link.title}
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
