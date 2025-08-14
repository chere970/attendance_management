import React from "react";
import Link from "next/link";
const SubNav = () => {
  return (
    <div
      id="subnav"
      className="text-white flex flex-row space-x-10 my-2 rounded-3xl bg-purple-800 mx-100 bg-amber-400 p-4 justify-between"
    >
      <Link href="/profile/history">History</Link>
      <Link href="/history">History</Link>
      <Link href="/history">History</Link>
      <Link href="/profile/request">Request</Link>
    </div>
  );
};

export default SubNav;
