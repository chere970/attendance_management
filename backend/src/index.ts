import { PrismaClient } from '../generated/prisma'
import express, { Express, Request, Response, NextFunction } from "express";
import prismaRouter from './routes/prismahome';
import cors from "cors";
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import multer from 'multer';

// Load environment variables
dotenv.config();

const app: Express = express();
// const PORT: number = 5000;
const PORT: number = parseInt(process.env.PORT || '5000', 10);

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})

// app.use(cors())
// app.use(cors({
//   // origin: process.env.FRONTEND_URL || 'http://localhost:3000',
//   origin: process.env.FRONTEND_URL || 'https://attendance-management-ynfm.onrender.com/',

//   credentials: true
// }))

app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://attendance-management.vercel.app"
  ],
  credentials: true
}));


app.use(express.json());

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

// Helper function to verify JWT token
const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    (req as AuthenticatedRequest).user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Create request endpoint
app.post("/requests", verifyToken, async (req: Request, res: Response) => {
  try {
    const { type, title, description, startDate, endDate } = req.body;
    const authReq = req as AuthenticatedRequest;
    const employeeId = authReq.user?.userId;
    
    if (!employeeId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    
    if (!type || !title || !description || !startDate || !endDate) {
      return res.status(400).json({ error: "All fields are required" });
    }
    
    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start >= end) {
      return res.status(400).json({ error: "End date must be after start date" });
    }
    
    const request = await prisma.request.create({
      data: {
        employeeId,
        type,
        title,
        description,
        startDate: start,
        endDate: end,
        status: 'PENDING'
      },
      include: {
        employee: {
          select: {
            name: true,
            email: true,
            department: true
          }
        }
      }
    });
    
    res.status(201).json(request);
    
  } catch (err: any) {
    console.error("POST /prisma/requests error:", err);
    res.status(500).json({ error: "Failed to create request" });
  }
});

// Get employee's requests
app.get("/requests/my-requests", verifyToken, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const employeeId = authReq.user?.userId;
    
    if (!employeeId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    
    const requests = await prisma.request.findMany({
      where: { employeeId },
      orderBy: { createdAt: 'desc' },
      include: {
        employee: {
          select: {
            name: true,
            email: true,
            department: true
          }
        }
      }
    });
    
    res.json(requests);
    
  } catch (err: any) {
    console.error("GET /prisma/requests/my-requests error:", err);
    res.status(500).json({ error: "Failed to fetch requests" });
  }
});

// Get all requests (for admin)
app.get("/requests", verifyToken, async (req: Request, res: Response) => {
  try {
    // Check if user is admin (case-insensitive)
    const authReq = req as AuthenticatedRequest;
    const role = (authReq.user?.role || '').toString().toLowerCase();
    if (role !== 'admin') {
      return res.status(403).json({ error: "Access denied" });
    }
    
    const requests = await prisma.request.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        employee: {
          select: {
            name: true,
            email: true,
            department: true
          }
        }
      }
    });
    
    res.json(requests);
    
  } catch (err: any) {
    console.error("GET /prisma/requests error:", err);
    res.status(500).json({ error: "Failed to fetch requests" });
  }
});

// Update request status (admin only)
app.patch("/requests/:id", verifyToken, async (req: Request, res: Response) => {
  try {
    // Check if user is admin (case-insensitive)
    const authReq = req as AuthenticatedRequest;
    const role = (authReq.user?.role || '').toString().toLowerCase();
    if (role !== 'admin') {
      return res.status(403).json({ error: "Access denied" });
    }
    
    const { id } = req.params;
    const { status, comments } = req.body;
    
    if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    
    const request = await prisma.request.update({
      where: { id },
      data: {
        status,
        approvedBy: authReq.user?.userId,
        comments
      },
      include: {
        employee: {
          select: {
            name: true,
            email: true,
            department: true
          }
        }
      }
    });
    
    res.json(request);
    
  } catch (err: any) {
    console.error("PATCH /prisma/requests/:id error:", err);
    res.status(500).json({ error: "Failed to update request" });
  }
});

// Attendance endpoints
app.post("/attendance/checkin", verifyToken, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const employeeId = authReq.user?.userId;

    if (!employeeId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    // Check if employee is already checked in
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        employeeId,
        checkOut: null, // No check-out means still checked in
      },
    });

    if (existingAttendance) {
      return res.status(400).json({
        error: "Already checked in",
        checkInTime: existingAttendance.checkIn
      });
    }

    // Create new attendance record
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Date only, no time

    const attendance = await prisma.attendance.create({
      data: {
        employeeId,
        date: today,
        checkIn: now,
      },
    });

    // Update employee status
    await prisma.employee.update({
      where: { id: employeeId },
      data: { status: "CHECK_IN" },
    });

    res.status(201).json({
      message: "Check-in successful",
      attendance,
      checkInTime: attendance.checkIn,
    });

  } catch (error: any) {
    console.error("POST /attendance/checkin error:", error);
    res.status(500).json({ error: "Failed to check in" });
  }
});

app.post("/attendance/checkout", verifyToken, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const employeeId = authReq.user?.userId;

    if (!employeeId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    console.log("Check-out attempt for employee:", employeeId);

    // Find the latest attendance record without check-out
    // First, let's check all attendance records for this employee
    console.log("Searching for attendance records with employeeId:", employeeId);

    const allRecords = await prisma.attendance.findMany({
      where: {
        employeeId,
      },
      orderBy: {
        checkIn: 'desc',
      },
    });

    console.log("All attendance records for employee:", allRecords);
    console.log("Number of records found:", allRecords.length);

    const attendance = await prisma.attendance.findFirst({
      where: {
        employeeId,
        checkOut: null,
      },
      orderBy: {
        checkIn: 'desc',
      },
    });

    console.log("Found attendance record with checkOut=null:", attendance);

    if (!attendance) {
      console.log("No active check-in found for employee:", employeeId);
      return res.status(400).json({ error: "No active check-in found" });
    }

    // Update attendance with check-out time
    const updatedAttendance = await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        checkOut: new Date(),
      },
    });

    console.log("Updated attendance:", updatedAttendance);

    // Update employee status
    await prisma.employee.update({
      where: { id: employeeId },
      data: { status: "CHECK_OUT" },
    });

    console.log("Check-out successful for employee:", employeeId);

    res.json({
      message: "Check-out successful",
      attendance: updatedAttendance,
      checkOutTime: updatedAttendance.checkOut,
    });

  } catch (error: any) {
    console.error("POST /attendance/checkout error:", error);
    res.status(500).json({ error: "Failed to check out" });
  }
});

app.get("/attendance/today", verifyToken, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const employeeId = authReq.user?.userId;

    if (!employeeId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    // First, check if there's any active check-in (checkOut is null)
    const activeAttendance = await prisma.attendance.findFirst({
      where: {
        employeeId,
        checkOut: null,
      },
      orderBy: {
        checkIn: 'desc',
      },
    });

    // If there's an active check-in, return it
    if (activeAttendance) {
      return res.json({
        attendance: activeAttendance,
        isCheckedIn: true,
        checkInTime: activeAttendance.checkIn,
        checkOutTime: null,
      });
    }

    // If no active check-in, check for today's completed attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAttendance = await prisma.attendance.findFirst({
      where: {
        employeeId,
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
      orderBy: {
        checkIn: 'desc',
      },
    });

    res.json({
      attendance: todayAttendance,
      isCheckedIn: false,
      checkInTime: todayAttendance?.checkIn,
      checkOutTime: todayAttendance?.checkOut,
    });

  } catch (error: any) {
    console.error("GET /attendance/today error:", error);
    res.status(500).json({ error: "Failed to fetch today's attendance" });
  }
});

// Add a simple health check route
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

app.use("/prisma", prismaRouter);
app.use("/",prismaRouter);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

async function main() {
  try {
    await prisma.$connect();
    console.log("✅ Connected to database successfully");
    
    // Test the connection with a simple query
    const employeeCount = await prisma.employee.count();
    console.log(`📊 Found ${employeeCount} employees in database`);
    
    // Only create test data if database is empty
    // if (employeeCount === 0) {
    //   console.log("📝 Creating test employee...");
    //   const testEmployee = await prisma.employee.create({
    //     data: {
    //       name: 'Test Employee',
    //       username: 'testuser',
    //       email: 'test@example.com',
    //       password: 'password123',
    //       role: 'employee',
    //       department: 'IT',
    //       photo: 'default.jpg',
    //       fingerprint: 'test_fingerprint',
    //       status: 'CHECK_OUT'
    //     }
    //   });
    //   console.log("✅ Test employee created:", testEmployee.id);
    // }
    
  } catch (error) {
    console.error("❌ Database connection failed:");
    console.error(error);
    
    // Check if it's a connection timeout issue
    if (error instanceof Error && error.message.includes('timeout')) {
      console.log("\n🔧 Troubleshooting tips:");
      console.log("1. Check your MongoDB Atlas cluster status");
      console.log("2. Verify your IP address is whitelisted in MongoDB Atlas");
      console.log("3. Ensure your DATABASE_URL is correct in .env file");
      console.log("4. Check if your cluster is paused (free tier)");
    }
  }
}

// Call main function
main()
  .catch(async (e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

export default app;
