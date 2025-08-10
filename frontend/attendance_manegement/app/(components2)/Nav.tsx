import Link from "next/link";
import React from "react";
import Image from "next/image";
import { User } from "lucide-react";

export const Nav = () => {
  return (
    <nav className="flex items-center bg-amber-50 p-2">
      <div className="flex space-x-5 mx-5 text-black justify-between w-full">
        <div className="flex items-center space-x-2">
          <Link href="/dashboard">
            <Image src="/logo.png" alt="cbe logo" width={50} height={50} />
          </Link>
          <h1 className="text-purple-700 text-2xl font-bold">CBE</h1>
        </div>
        <div className="space-x-5">
          <Link
            className="text-lg font-semibold text-gray-700 hover:text-purple-600 hover:text-xl transition-colors"
            href="/dashboard"
          >
            Home
          </Link>
          <Link
            className="text-lg font-semibold text-gray-700 hover:text-purple-600  hover:text-xl transition-colors"
            href="/About"
          >
            About
          </Link>
          <Link
            className="text-lg font-semibold text-gray-700 hover:text-purple-600  hover:text-xl transition-colors"
            href="/services"
          >
            Services
          </Link>
          <Link
            className="text-lg font-semibold text-gray-700 hover:text-purple-600  hover:text-xl transition-colors"
            href="/adress"
          >
            addres
          </Link>
          <Link
            className="text-lg font-semibold text-gray-700 hover:text-purple-600  hover:text-xl transition-colors"
            href="/leaverequest"
          >
            Request
          </Link>
        </div>
        <div className="flex item-center">
          <div className="flex px-3 py-1 text-lg  rounded-2xl bg-purple-600">
            <Link href="/login">Login </Link>
          </div>
          <div className="flex px-3 py-1 ml-2 text-lg  rounded-2xl bg-indigo-50">
            <Link href='/profile'><User href="/profile" className="text-black text-lg ml-2" /></Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Nav;
