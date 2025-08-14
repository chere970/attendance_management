// import { p, text } from "framer-motion/client";
import mongoose from "mongoose";
import { endianness } from "os";
import { start } from "repl";
const EmployeeSchema = new mongoose.Schema({
  name: String,
  username: String,
  email: String,
  password: String,
  role: String,
  department: String,
  photo: String,
  fingerprint: String,
});

const Employee = mongoose.model("Employee", EmployeeSchema);

const LeaveRequestSchema = new mongoose.Schema({
  username: String,
  name: String,
  reason: String,
  
  status: {type: String, default: "pending"},
  startDate: Date,
  endianness: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },




});

const LeaveRequest = mongoose.model("LeaveRequest", LeaveRequestSchema);





export default { LeaveRequest, Employee };
