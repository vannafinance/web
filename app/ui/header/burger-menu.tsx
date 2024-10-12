import { useState } from "react";
import Link from "next/link";
import { CaretDown, CaretUp } from "@phosphor-icons/react";
import { menuLinks, tradeMenuSubLinks } from "@/app/lib/static-values";
import Image from "next/image";

export default function BurgerMenu({ onClose }: BurgerMenuProps) {
  const [isTradeExpanded, setIsTradeExpanded] = useState(false);

  return (
    <div className="fixed inset-0 z-40 bg-white dark:bg-baseDark text-baseBlack dark:text-baseWhite">
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto p-4 pt-2">
          {menuLinks.map((link) => (
            <div key={link.title}>
              {link.title === "Trade" ? (
                <div>
                  <button
                    onClick={() => setIsTradeExpanded(!isTradeExpanded)}
                    className="flex items-center justify-between w-full py-3 px-4 text-left text-lg font-medium"
                  >
                    {link.title}
                    {isTradeExpanded ? <CaretUp /> : <CaretDown />}
                  </button>
                  {isTradeExpanded && (
                    <div className="pl-8 space-y-2">
                      {tradeMenuSubLinks.map((subLink) => (
                        <Link
                          key={subLink.title}
                          href={subLink.href}
                          onClick={onClose}
                          className="block py-2 text-base hover:text-gray-900 transition-colors duration-200"
                        >
                          <span className="flex flex-row items-center">
                            <Image
                              width="24"
                              height="24"
                              src={subLink.icon}
                              alt={subLink.title + " menu icon"}
                              className="mr-2"
                            />{" "}
                            {subLink.title}
                          </span>
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
