"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import NavLinks from "./nav-links";
import NavbarButtons from "./navbar-button";
import { List, X } from "@phosphor-icons/react";
import BurgerMenu from "./burger-menu";

export default function Navbar() {
  const [isBurgerMenuOpen, setIsBurgerMenuOpen] = useState(false);

  const toggleBurgerMenu = () => {
    setIsBurgerMenuOpen(!isBurgerMenuOpen);
  };

  return (
    <nav className="border-b border-neutral-100 flex flex-row h-16 px-4 lg:px-8 w-full justify-between items-center">
      <div className="flex-none content-center py-1 w-44">
        <Link className="flex flex-row pl-2" href="/">
          <Image
            alt="Vanna Logo"
            width={35}
            height={35}
            src="/vanna-logo.svg"
          />
          <p className="font-extrabold text-2xl">&nbsp;VANNA</p>
        </Link>
      </div>
      <div>
        <div className="flex-1 lg:hidden flex justify-end items-center">
          <button onClick={toggleBurgerMenu} className="p-2 text-baseBlack z-50">
            {isBurgerMenuOpen ? <X size={24} /> : <List size={24} />}
          </button>
        </div>
        <div className="hidden lg:flex lg:flex-1 self-center">
          <NavLinks />
        </div>
      </div>
      <div className="hidden lg:flex lg:flex-none self-center w-72 py-1">
        <NavbarButtons />
      </div>
      {isBurgerMenuOpen && <BurgerMenu onClose={toggleBurgerMenu} />}
    </nav>
  );
}
