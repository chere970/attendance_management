"use client";

import { getApiUrl } from "@/lib/api";

const Page = () => {
  const message = async () => {
    const res = await fetch(getApiUrl("/health"));
    const text = await res.text();
    console.log(text);
  };

  return (
    <div>
      <button onClick={message}>Call API</button>
    </div>
  );
};

export default Page;
