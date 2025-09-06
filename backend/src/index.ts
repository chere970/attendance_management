// import express, { Express, Request, Response } from "express";
// import mongoose from "mongoose";
// import homeRouter from "./routes/home";
// import cors from "cors";

// // Define the Express application instance with the Express type
// const app: Express = express();
// const PORT: number = 5000;
// const MONGO_URI =
//   process.env.MONGODB_URL ||
//   " ";
// // Connect to MongoDB
// app.use(cors());
// app.use(express.json());
// mongoose
//   .connect(MONGO_URI)
//   .then(() => {
//     console.log("Connected to MongoDB");
//   })
//   .catch((err: Error) => {
//     console.error("MongoDB connection error:", err);
//   });

// // Basic Express route with explicit types for request and response
// app.use("/", homeRouter);
// app.use("/user", homeRouter);

// // Start the server
// app.listen(PORT, () => {
//   console.log(`Server is running on http://localhost:${PORT}`);
// });
// export default app;


import { PrismaClient } from '../generated/prisma'
import express, { Express } from "express";
import prismaRouter from './routes/prismahome';
import cors from "cors"
import { p } from 'framer-motion/client';

const app: Express = express();

const PORT: number = 5000;

const prisma = new PrismaClient()
app.use(cors())

// app.get("/", (req, res) => {
//   res.send("Hello from Express and TypeScript!");});
app.use(express.json());
app.use("/prisma", prismaRouter);
app.use("/",prismaRouter);
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
export default app;


async function main() {
  // ... you will write your Prisma Client queries here
try{
  await prisma.$connect();
  console.log("connected to database")
  // await prisma.employee.create({
  //   data: {
  //     name: 'josi',
  //     username:'richssks',
  //     email: 'hellojosi@prisma.com',
  //     password:'qer3434ss',
  //     role:'emp',
  //     department:'emgineeri',
  //     photo:'sff',
  //     fingerprint:'hdifkdf',
  //     status:'CHECK_IN'


      
  //   },
    await prisma.attendance.create({
      data:{
        employeeId:'650f1c4e2f1b2c6d88f0e8b5',
        date: new Date(),
        checkIn: new Date(),

      }
  })

  const allemployee= await prisma.employee.findMany()
  console.log(allemployee);
}
catch(error){
  console.log(error);
}
}

main()
  .catch(async (e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
