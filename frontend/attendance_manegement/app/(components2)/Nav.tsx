import Link from "next/link";
import React from "react";

export const Nav = () => {
  return (
    <nav className="flex items-center bg-amber-50 p-4">
      <div className="flex space-x-5 text-black justify-between w-full">
        <div>
          <Link href="/">logo</Link>
        </div>
        <div className="space-x-3">
          <Link href="home">home</Link>
          <Link href="About">About</Link>
          <Link href="services">Services</Link>
          <Link href="adress">addres</Link>
          <Link href="attendance">Atendance</Link>
        </div>
        <div>
          <Link href="#">My_Account</Link>
        </div>
      </div>
    </nav>
  );
};

export default Nav;
