"use client";

import { useState } from "react";

const request = () => {
  const [formdata, setformdata] = useState({
    username: "",
    reason: "",
    from: "",
    to: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setformdata((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleOnSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await fetch("http://localhost:5000/api/request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formdata),
    });
  };
  return (
    <div className=" flex flex-col mt-0 w-full  justify-center">
      {/* <h3 className="text-3xl font-bold">Fill Your Leave Request</h3> */}
      <form>
        <div className="flex flex-col  mb-4 bg-red p-4 m- rounded-lg shadow-md w-100 mx-auto">
          <div className="flex flex-col mb-4">
            {" "}
            <label className="font-bold">User Name</label>
            <input
              className="border border-gray-300 rounded-md bg-white font-bold"
              type="text"
              id="username"
              onChange={handleInputChange}
              placeholder="name"
              value={formdata.username}
            ></input>
          </div>
          <div>
            <label className="font-bold">Reason</label>
            <textarea
              className="border border-gray-300 rounded-md bg-white w-full p-2"
              placeholder="Put your message here..."
              onChange={handleInputChange}
              id="reason"
              value={formdata.reason}
              cols={5}
            ></textarea>
          </div>
          <div className="flex flex-col mb-4">
            {" "}
            <label className="font-bold">From</label>
            <input
              className="border border-gray-300 rounded-md bg-white"
              type="date"
              onChange={handleInputChange}
              id="from"
              // placeholder="name"
              value={formdata.from}
            ></input>
          </div>
          <div className="flex flex-col mb-4">
            {" "}
            <label className="font-bold">To</label>
            <input
              className="border border-gray-300 rounded-md bg-white"
              type="date"
              onChange={handleInputChange}
              id="to"
              // placeholder="name"
              value={formdata.to}
            ></input>
          </div>
          <div className="flex justify-around">
            <button
              onClick={handleOnSubmit}
              className="bg-blue-500 text-white p-2 px-3 rounded-md hover:bg-blue-600"
            >
              Submit
            </button>
            <button className="bg-red-500 text-white p-2  px-3 rounded-md hover:bg-red-600 ">
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
export default request;
