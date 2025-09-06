// import { Link } from "lucide-react";
import PhotoCard from "./PhotoCard";
import Link from "next/link";
import SubNav from "../(components2)/SubNav";
import RequestForm from "./Requestform";
const ProfilePage = () => {
  return (
    <div className="flex flex-col z-50 justify-between min-h-screen bg-purple-500 w-full">
      <div
        id="profile"
        className="flex   justify-between min-h-screen w- bg-gray-100 p-4 rounded-lg mx-2"
      >
        {/* <div>
          <PhotoCard />
        </div> */}

        <div className=" w-3/4 bg--700">
          <RequestForm />
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
