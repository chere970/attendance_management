"use client";

const Page = () => {
  const message = async () => {
    const res = await fetch("http://localhost:5000");
    const text = await res.text();
    console.log(text);
  };

  return 
  <div><button onClick={message}>Call API</button>
  </div>;
};

export default Page;
