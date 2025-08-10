const request = () => {
  return (
    <form>
      <div className="flex flex-col items-center mb-4 bg-gray-300 p-4 rounded-lg shadow-md w-1/3 mx-auto">
        <div className="flex flex-col mb-4">
          {" "}
          <label className="font-bold">User Name</label>
          <input
            className="border border-gray-300 rounded-md bg-white"
            type="text"
            placeholder="name"
            value="name"
          ></input>
        </div>
        <div>
          <label className="font-bold">Message</label>
          <textarea
            className="border border-gray-300 rounded-md bg-white w-full p-2"
            placeholder="Put your message here..."
            value="name"
            cols={5}
          ></textarea>
        </div>
        <div>
          <label className="font-bold">Reason</label>
          <textarea
            placeholder="put your reason here..."
            value="name"
          ></textarea>
        </div>
        <label>From Date</label>
      </div>
    </form>
  );
};
export default request;
