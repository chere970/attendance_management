// // import app from "../index.ts";
// import express, { Request, Response } from "express";
// import Employee from "../models/Employee";
// import mongoose from "mongoose";
// import LeaveRequest from "../models/Employee";
// const router = express.Router();
// router.get("/", (req: Request, res: Response) => {
//   res.send("Hello from Express and TypeScript!");
// });

// router.get("/user", (req: Request, res: Response) => {
//   res.send("User route");
// });
// router.post("/signup", async (req: Request, res: Response) => {
//   const { name, username, email, password } = req.body;

//   const newEmployee = new  Employee.Employee({
//     name,
//     username,
//     email,
//     password,
//   });
//   await newEmployee.save()
//   console.log("New Employee saved:", newEmployee);
//   res.status(201).json({
//     message: "User created successfully",
//   });
// });

// router.post('/api/request', async (req: Request, res: Response) => {
//   const { username, reason, from, to } = req.body;

//   const newRequest=new LeaveRequest.LeaveRequest({
//     username,
//     reason,
//     startDate: new Date(from),
//     endDate: new Date(to),
//   });
//   await newRequest.save()
//   console.log("New Leave Request saved:", newRequest);
//   res.status(201).json({
//     message: "Leave request created successfully",
//   });






// });

// export default router;
