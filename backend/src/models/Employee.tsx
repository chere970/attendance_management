import { p, text } from "framer-motion/client";
import mongoose from "mongoose";
const EmployeeSchema = new mongoose.Schema({
  name: String,
  username: String,
  email: String,
  password: String || Number,
  role: String,
  department: String,
  phote: String,
  fingerprint: String,
});

const Emplyee = mongoose.model("Emplyee", EmployeeSchema);

const LeaveRequestSchema = new mongoose.Schema({
  username: String,
  name: String,
  message: String,
  status: "Pending",
});

const LeaveRequest = mongoose.model("LeaveRequest", LeaveRequestSchema);
export default { LeaveRequest, Emplyee };
