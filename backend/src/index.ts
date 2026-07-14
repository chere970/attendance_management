import { PrismaClient } from "../generated/prisma";
import express, { Express, Request, Response, NextFunction } from "express";
import prismaRouter from "./routes/prismahome";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import path from "path";

dotenv.config();

const app: Express = express();
const PORT: number = parseInt(process.env.PORT || "5000", 10);

const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
});

const getAllowedOrigins = () => {
  const entries = [process.env.FRONTEND_URL, process.env.FRONTEND_URLS]
    .filter((value): value is string => !!value)
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean);

  return new Set(entries);
};

const allowedOrigins = getAllowedOrigins();

const isLocalOrigin = (origin: string) =>
  /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || isLocalOrigin(origin) || allowedOrigins.has(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 204,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadsDir = path.resolve(process.cwd(), "uploads");
app.use("/uploads", express.static(uploadsDir));

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

const isAdminRole = (role?: string | null) =>
  (role || "").toString().trim().toLowerCase() === "admin";

const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : null;

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key",
    ) as AuthenticatedRequest["user"];

    (req as AuthenticatedRequest).user = {
      userId: decoded?.userId || "",
      email: decoded?.email || "",
      role: decoded?.role || "employee",
    };

    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
};

const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthenticatedRequest;
  if (!isAdminRole(authReq.user?.role)) {
    return res.status(403).json({ error: "Access denied" });
  }
  next();
};

const getStartOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const getEndOfDay = (date = new Date()) => {
  const d = getStartOfDay(date);
  d.setDate(d.getDate() + 1);
  return d;
};

const parseLimit = (value: unknown, fallback = 20, max = 100) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(Math.floor(parsed), max);
};

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

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return res.status(400).json({ error: "Invalid request dates" });
    }

    if (start > end) {
      return res
        .status(400)
        .json({ error: "End date must be after or equal to start date" });
    }

    const request = await prisma.request.create({
      data: {
        employeeId,
        type,
        title: title.toString().trim(),
        description: description.toString().trim(),
        startDate: start,
        endDate: end,
        status: "PENDING",
      } as any,
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
            employeeId: true,
          },
        },
      },
    });

    res.status(201).json(request);
  } catch (err: any) {
    console.error("POST /requests error:", err);
    res.status(500).json({ error: "Failed to create request" });
  }
});

app.get(
  "/requests/my-requests",
  verifyToken,
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const employeeId = authReq.user?.userId;

      if (!employeeId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const limit = parseLimit(req.query.limit, 50, 100);

      const requests = await prisma.request.findMany({
        where: { employeeId },
        orderBy: { createdAt: "desc" },
        take: limit,
        include: {
          employee: {
            select: {
              id: true,
              name: true,
              email: true,
              department: true,
              employeeId: true,
            },
          },
        },
      });

      res.json(requests);
    } catch (err: any) {
      console.error("GET /requests/my-requests error:", err);
      res.status(500).json({ error: "Failed to fetch requests" });
    }
  },
);

app.get(
  "/requests",
  verifyToken,
  requireAdmin,
  async (_req: Request, res: Response) => {
    try {
      const requests = await prisma.request.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          employee: {
            select: {
              id: true,
              name: true,
              email: true,
              department: true,
              employeeId: true,
            },
          },
        },
      });

      res.json(requests);
    } catch (err: any) {
      console.error("GET /requests error:", err);
      res.status(500).json({ error: "Failed to fetch requests" });
    }
  },
);

app.patch(
  "/requests/:id",
  verifyToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { id } = req.params;
      const { status, comments } = req.body;

      if (!status || !["APPROVED", "REJECTED"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      const request = await prisma.request.update({
        where: { id },
        data: {
          status,
          approvedBy: authReq.user?.userId,
          comments:
            typeof comments === "string" && comments.trim()
              ? comments.trim()
              : null,
        } as any,
        include: {
          employee: {
            select: {
              id: true,
              name: true,
              email: true,
              department: true,
              employeeId: true,
            },
          },
        },
      });

      res.json(request);
    } catch (err: any) {
      console.error("PATCH /requests/:id error:", err);
      if (err?.code === "P2025") {
        return res.status(404).json({ error: "Request not found" });
      }
      res.status(500).json({ error: "Failed to update request" });
    }
  },
);

app.get(
  "/attendance/today",
  verifyToken,
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const employeeId = authReq.user?.userId;

      if (!employeeId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const todayStart = getStartOfDay();
      const todayEnd = getEndOfDay(todayStart);

      const activeAttendance = await prisma.attendance.findFirst({
        where: {
          employeeId,
          checkOut: null,
        },
        orderBy: {
          checkIn: "desc",
        },
      });

      if (activeAttendance) {
        return res.json({
          attendance: activeAttendance,
          isCheckedIn: true,
          checkInTime: activeAttendance.checkIn,
          checkOutTime: null,
        });
      }

      const todayAttendance = await prisma.attendance.findFirst({
        where: {
          employeeId,
          date: {
            gte: todayStart,
            lt: todayEnd,
          },
        },
        orderBy: {
          checkIn: "desc",
        },
      });

      res.json({
        attendance: todayAttendance,
        isCheckedIn: false,
        checkInTime: todayAttendance?.checkIn ?? null,
        checkOutTime: todayAttendance?.checkOut ?? null,
      });
    } catch (error: any) {
      console.error("GET /attendance/today error:", error);
      res.status(500).json({ error: "Failed to fetch today's attendance" });
    }
  },
);

app.post(
  "/attendance/checkin",
  verifyToken,
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const employeeId = authReq.user?.userId;

      if (!employeeId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const existingAttendance = await prisma.attendance.findFirst({
        where: {
          employeeId,
          checkOut: null,
        },
        orderBy: {
          checkIn: "desc",
        },
      });

      if (existingAttendance) {
        return res.status(400).json({
          error: "Already checked in",
          checkInTime: existingAttendance.checkIn,
        });
      }

      const now = new Date();
      const today = getStartOfDay(now);

      const attendance = await prisma.attendance.create({
        data: {
          employeeId,
          date: today,
          checkIn: now,
        },
      });

      await prisma.employee.update({
        where: { id: employeeId },
        data: { status: "CHECK_IN" as any },
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
  },
);

app.post(
  "/attendance/checkout",
  verifyToken,
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const employeeId = authReq.user?.userId;

      if (!employeeId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const attendance = await prisma.attendance.findFirst({
        where: {
          employeeId,
          checkOut: null,
        },
        orderBy: {
          checkIn: "desc",
        },
      });

      if (!attendance) {
        return res.status(400).json({ error: "No active check-in found" });
      }

      const updatedAttendance = await prisma.attendance.update({
        where: { id: attendance.id },
        data: {
          checkOut: new Date(),
        },
      });

      await prisma.employee.update({
        where: { id: employeeId },
        data: { status: "CHECK_OUT" as any },
      });

      res.json({
        message: "Check-out successful",
        attendance: updatedAttendance,
        checkOutTime: updatedAttendance.checkOut,
      });
    } catch (error: any) {
      console.error("POST /attendance/checkout error:", error);
      res.status(500).json({ error: "Failed to check out" });
    }
  },
);

app.get(
  "/attendance/history",
  verifyToken,
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const requestedEmployeeId =
        typeof req.query.employeeId === "string" ? req.query.employeeId : null;

      const employeeId =
        isAdminRole(authReq.user?.role) && requestedEmployeeId
          ? requestedEmployeeId
          : authReq.user?.userId;

      if (!employeeId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const limit = parseLimit(req.query.limit, 30, 100);

      const records = await prisma.attendance.findMany({
        where: { employeeId },
        orderBy: { checkIn: "desc" },
        take: limit,
      });

      const items = records.map((record) => {
        const workedMinutes = record.checkOut
          ? Math.max(
              Math.floor(
                (new Date(record.checkOut).getTime() -
                  new Date(record.checkIn).getTime()) /
                  60000,
              ),
              0,
            )
          : null;

        return {
          ...record,
          workedMinutes,
        };
      });

      res.json(items);
    } catch (error: any) {
      console.error("GET /attendance/history error:", error);
      res.status(500).json({ error: "Failed to fetch attendance history" });
    }
  },
);

app.get(
  "/attendance/summary",
  verifyToken,
  requireAdmin,
  async (_req: Request, res: Response) => {
    try {
      const todayStart = getStartOfDay();
      const todayEnd = getEndOfDay(todayStart);

      const [totalEmployees, onDuty, todaysAttendance] = await Promise.all([
        prisma.employee.count(),
        prisma.employee.count({
          where: { status: "CHECK_IN" as any },
        }),
        prisma.attendance.findMany({
          where: {
            date: {
              gte: todayStart,
              lt: todayEnd,
            },
          },
        }),
      ]);

      const uniquePresentToday = new Set(
        todaysAttendance.map((item) => item.employeeId),
      ).size;

      const completedToday = todaysAttendance.filter(
        (item) => !!item.checkOut,
      ).length;

      const now = new Date();
      const days = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(now);
        d.setDate(now.getDate() - (6 - i));
        d.setHours(0, 0, 0, 0);
        return d;
      });

      const checkInsPerDay = await Promise.all(
        days.map(async (day) => {
          const next = new Date(day);
          next.setDate(day.getDate() + 1);

          const count = await prisma.attendance.count({
            where: {
              checkIn: {
                gte: day,
                lt: next,
              },
            },
          });

          return {
            date: day.toISOString().slice(0, 10),
            count,
          };
        }),
      );

      res.json({
        totalEmployees,
        onDuty,
        todaysCheckIns: todaysAttendance.length,
        presentToday: uniquePresentToday,
        absentToday: Math.max(totalEmployees - uniquePresentToday, 0),
        completedToday,
        attendanceRate:
          totalEmployees > 0
            ? Number(((uniquePresentToday / totalEmployees) * 100).toFixed(1))
            : 0,
        checkInsPerDay,
      });
    } catch (error: any) {
      console.error("GET /attendance/summary error:", error);
      res.status(500).json({ error: "Failed to fetch attendance summary" });
    }
  },
);

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

app.use("/prisma", prismaRouter);
app.use("/", prismaRouter);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

async function main() {
  try {
    await prisma.$connect();
    console.log("✅ Connected to database successfully");

    const employeeCount = await prisma.employee.count();
    console.log(`📊 Found ${employeeCount} employees in database`);
  } catch (error) {
    console.error("❌ Database connection failed:");
    console.error(error);

    if (error instanceof Error && error.message.includes("timeout")) {
      console.log("\n🔧 Troubleshooting tips:");
      console.log("1. Check your MongoDB Atlas cluster status");
      console.log("2. Verify your IP address is whitelisted in MongoDB Atlas");
      console.log("3. Ensure your DATABASE_URL is correct in .env file");
      console.log("4. Check if your cluster is paused (free tier)");
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

export default app;
