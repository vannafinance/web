"use client";

import Image from "next/image";
import Link from "next/link";
import NavLinks from "./nav-links";
import NavbarButtons from "./navbar-button";

export default function Navbar() {
  return (
    <nav className="border-b border-neutral-100 flex flex-row h-16 px-8 w-full">
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
      <div className="flex-1 self-center">
        <NavLinks />
      </div>
      <div className="flex-none self-center w-72 py-1">
        <NavbarButtons />
      </div>
    </nav>
  );
};
