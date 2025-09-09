"use client";
import Link from "next/link";
import React, { useState, useRef } from "react";
import Image from "next/image";
import { User } from "lucide-react";

export const Nav = () => {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return (
    <nav className="flex items-center bg-amber-50 p-2">
      <div className="flex space-x-5 mx-5 text-black justify-between w-full">
        {/* Logo + Title */}
        <div className="flex items-center space-x-2">
          <Link href="/dashboard">
            <Image src="/logo.png" alt="cbe logo" width={50} height={50} />
          </Link>
          <h1 className="text-purple-700 text-2xl font-bold">CBE</h1>
        </div>

        {/* Links + Dropdown */}
        <div className="space-x-5 flex items-center relative">
          <Link
            className="text-lg font-semibold text-gray-700 hover:text-purple-600 hover:text-xl transition-colors"
            href="/employee/dashboard"
          >
            Home
          </Link>
          <Link
            className="text-lg font-semibold text-gray-700 hover:text-purple-600 hover:text-xl transition-colors"
            href="/employee/attendance"
          >
            Attendance
          </Link>

          {/* Dropdown (hover fix) */}
          <div
            className="relative inline-block text-left"
            onMouseEnter={() => {
              if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
              }
              setIsOpen(true);
            }}
            onMouseLeave={() => {
              timeoutRef.current = setTimeout(() => {
                setIsOpen(false);
              }, 150); // Small delay to prevent flickering
            }}
          >
            <button
              type="button"
              className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-lg font-semibold text-gray-700 hover:text-purple-600 hover:text-xl transition-colors focus:outline-none"
              aria-expanded={isOpen}
              aria-haspopup="true"
            >
              Requests
              <svg
                className="-mr-1 ml-2 h-5 w-5 text-gray-500"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.516l3.71-4.285a.75.75 0 111.14.976l-4.25 4.914a.75.75 0 01-1.14 0l-4.25-4.914a.75.75 0 01.02-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {/* Dropdown menu (stays open while hovering) */}
            {isOpen && (
              <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                <div className="py-1">
                  <Link
                    href="/employee/request"
                    className="block px-4 py-2 text-gray-700 hover:bg-purple-100 hover:text-purple-800 transition"
                  >
                    New Request
                  </Link>
                  <Link
                    href="/employee/history"
                    className="block px-4 py-2 text-gray-700 hover:bg-purple-100 hover:text-purple-800 transition"
                  >
                    Request History
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Profile */}
        <div className="flex item-center">
          <div className="flex px-3 py-1 ml-2 text-lg rounded-2xl bg-indigo-50">
            <Link href="/employee/profile">
              <User className="text-black text-lg ml-2" />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Nav;
