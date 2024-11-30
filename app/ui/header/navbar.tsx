"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import NavLinks from "./nav-links";
import NavbarButtons from "./navbar-button";
import { List, SunDim, X } from "@phosphor-icons/react";
import BurgerMenu from "./burger-menu";
import { useDarkMode } from "./use-dark-mode";

export default function Navbar() {
  const [isBurgerMenuOpen, setIsBurgerMenuOpen] = useState(false);
  const { toggleDarkMode } = useDarkMode();

  const toggleBurgerMenu = () => {
    setIsBurgerMenuOpen(!isBurgerMenuOpen);
  };

  return (
    <nav className="border-b border-neutral-100 dark:border-neutral-900 flex flex-row h-16 px-4 lg:px-8 w-full justify-between items-center dark:bg-baseDark">
      <div className="flex-none content-center py-1 w-44">
        <Link className="flex flex-row pl-2" href="/">
          <Image
            alt="Vanna Logo"
            width={35}
            height={35}
            src="/vanna-tilted-logo.svg"
          />
          <p className="font-extrabold text-2xl dark:text-white">&nbsp;VANNA</p>
        </Link>
      </div>
      <div>
        <div className="flex-1 lg:hidden flex justify-end items-center">
          <div className="p-2 border border-neutral-100 dark:border-neutral-200 dark; rounded-lg cursor-pointer dark:text-purple text-baseBlack">
            <SunDim size={24} weight="fill" onClick={toggleDarkMode} />
          </div>
          <button
            onClick={toggleBurgerMenu}
            className="p-2 text-baseBlack dark:text-white z-50"
          >
            {isBurgerMenuOpen ? <X size={24} /> : <List size={24} />}
          </button>
        </div>
        <div className="hidden lg:flex lg:flex-1 self-center">
          <NavLinks />
        </div>
      </div>
      <div className="hidden lg:flex lg:flex-none self-center py-1">
        <NavbarButtons />
      </div>
      {isBurgerMenuOpen && <BurgerMenu onClose={toggleBurgerMenu} />}
    </nav>
  );
}
