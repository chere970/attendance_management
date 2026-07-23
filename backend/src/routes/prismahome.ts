import express, { Request, Response, NextFunction } from "express";
import { PrismaClient } from "../../generated/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import fs from "fs";

declare module "express" {
  interface Request {
    file?: Express.Multer.File;
    user?: {
      userId: string;
      email: string;
      role: string;
    };
  }
}

const router = express.Router();
const prisma = new PrismaClient();

const uploadsDir = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const safeBase = path
      .basename(file.originalname, path.extname(file.originalname))
      .replace(/[^a-zA-Z0-9-_]/g, "_")
      .slice(0, 40);

    const extension =
      path.extname(file.originalname).toLowerCase() ||
      (file.mimetype === "image/png"
        ? ".png"
        : file.mimetype === "image/jpeg"
          ? ".jpg"
          : ".bin");

    cb(null, `${Date.now()}-${safeBase || "upload"}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(
        new Error("Only JPG, PNG, WEBP, and GIF image files are allowed"),
      );
    }
    cb(null, true);
  },
});

const uploadPhoto = upload.single("photo");

const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

const normalizeRole = (role?: string | null) => {
  const value = (role || "employee").toString().trim().toLowerCase();
  return value === "admin" ? "admin" : "employee";
};

const normalizeStatus = (status?: string | null) => {
  const value = (status || "CHECK_OUT").toString().trim().toUpperCase();
  return value === "CHECK_IN" ? "CHECK_IN" : "CHECK_OUT";
};

const isAdmin = (role?: string | null) =>
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
    ) as Request["user"];

    req.user = {
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
  if (!isAdmin(req.user?.role)) {
    return res.status(403).json({ error: "Access denied" });
  }
  next();
};

const parsePage = (value: unknown, fallback = 1) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
};

const parseLimit = (value: unknown, fallback = 20, max = 100) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(Math.floor(parsed), max);
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

const getPhotoUrl = (filename: string) => `/uploads/${filename}`;

const safeDeleteFile = async (relativeUrl?: string | null) => {
  if (!relativeUrl || !relativeUrl.startsWith("/uploads/")) return;
  const filename = path.basename(relativeUrl);
  const target = path.join(uploadsDir, filename);

  try {
    await fs.promises.unlink(target);
  } catch {
    // ignore missing file / unlink failures
  }
};

const sanitizeEmployeeResponse = (employee: any) => {
  if (!employee) return employee;
  const { password, ...rest } = employee;
  return rest;
};

router.use("/uploads", express.static(uploadsDir));

router.get(
  "/",
  verifyToken,
  requireAdmin,
  async (_req: Request, res: Response) => {
    try {
      const employees = await prisma.employee.findMany({
        orderBy: { username: "asc" },
      });

      res.json(employees.map(sanitizeEmployeeResponse));
    } catch (err) {
      console.error("GET /prisma error:", err);
      res.status(500).json({ error: "Failed to load employees" });
    }
  },
);

router.get(
  "/summary",
  verifyToken,
  requireAdmin,
  async (_req: Request, res: Response) => {
    try {
      const totalEmployees = await prisma.employee.count();
      const onDuty = await prisma.employee.count({
        where: { status: "CHECK_IN" as any },
      });

      const todayStart = getStartOfDay();
      const todayEnd = getEndOfDay(todayStart);

      const todaysCheckIns = await prisma.attendance.count({
        where: {
          checkIn: {
            gte: todayStart,
            lt: todayEnd,
          },
        },
      });

      const todayPresent = await prisma.attendance.findMany({
        where: {
          date: {
            gte: todayStart,
            lt: todayEnd,
          },
        },
        select: { employeeId: true },
      });

      const uniquePresentToday = new Set(
        todayPresent.map((item) => item.employeeId),
      ).size;
      const absentToday = Math.max(totalEmployees - uniquePresentToday, 0);

      const now = new Date();
      const days = Array.from({ length: 7 }).map((_, i) => {
        const d = getStartOfDay(
          new Date(now.getFullYear(), now.getMonth(), now.getDate() - (6 - i)),
        );
        return d;
      });

      const checkInsPerDay = await Promise.all(
        days.map(async (day) => {
          const next = getEndOfDay(day);
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
        todaysCheckIns,
        presentToday: uniquePresentToday,
        absentToday,
        attendanceRate:
          totalEmployees > 0
            ? Number(((uniquePresentToday / totalEmployees) * 100).toFixed(1))
            : 0,
        checkInsPerDay,
      });
    } catch (err: any) {
      console.error("GET /prisma/summary error:", err);
      res.status(500).json({ error: err?.message || "Failed to load summary" });
    }
  },
);

router.get(
  "/attendance/all",
  verifyToken,
  requireAdmin,
  async (_req: Request, res: Response) => {
    try {
      const attendanceRecords = await prisma.attendance.findMany({
        orderBy: { checkIn: "desc" },
      });
      res.json(attendanceRecords);
    } catch (err: any) {
      console.error("GET /prisma/attendance/all error:", err);
      res
        .status(500)
        .json({ error: err?.message || "Failed to fetch attendance records" });
    }
  },
);

router.get(
  "/attendance/summary",
  verifyToken,
  requireAdmin,
  async (_req: Request, res: Response) => {
    try {
      const todayStart = getStartOfDay();
      const todayEnd = getEndOfDay(todayStart);

      const [totalEmployees, checkedInEmployees, todaysAttendance] =
        await Promise.all([
          prisma.employee.count(),
          prisma.employee.count({ where: { status: "CHECK_IN" as any } }),
          prisma.attendance.findMany({
            where: {
              date: {
                gte: todayStart,
                lt: todayEnd,
              },
            },
          }),
        ]);

      const totalCheckIns = todaysAttendance.length;
      const completedToday = todaysAttendance.filter(
        (item) => !!item.checkOut,
      ).length;
      const presentToday = new Set(
        todaysAttendance.map((item) => item.employeeId),
      ).size;

      res.json({
        totalEmployees,
        checkedInEmployees,
        totalCheckIns,
        completedToday,
        presentToday,
        absentToday: Math.max(totalEmployees - presentToday, 0),
      });
    } catch (err: any) {
      console.error("GET /prisma/attendance/summary error:", err);
      res.status(500).json({ error: "Failed to load attendance summary" });
    }
  },
);

router.get(
  "/attendance/history",
  verifyToken,
  async (req: Request, res: Response) => {
    try {
      const page = parsePage(req.query.page);
      const limit = parseLimit(req.query.limit, 20, 100);
      const skip = (page - 1) * limit;

      const employeeId =
        isAdmin(req.user?.role) && typeof req.query.employeeId === "string"
          ? req.query.employeeId
          : req.user?.userId;

      if (!employeeId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const where = { employeeId };

      const [records, total] = await Promise.all([
        prisma.attendance.findMany({
          where,
          orderBy: { checkIn: "desc" },
          skip,
          take: limit,
        }),
        prisma.attendance.count({ where }),
      ]);

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

      res.json({
        items,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (err: any) {
      console.error("GET /prisma/attendance/history error:", err);
      res.status(500).json({ error: "Failed to load attendance history" });
    }
  },
);

router.get(
  "/:id/recent-attendance",
  verifyToken,
  async (req: Request, res: Response) => {
    try {
      const id = req.params.id;

      if (id === "favicon.ico" || !uuidRegex.test(id)) {
        return res.status(404).json({ error: "Invalid employee ID" });
      }

      if (!isAdmin(req.user?.role) && req.user?.userId !== id) {
        return res.status(403).json({ error: "Access denied" });
      }

      const list = await prisma.attendance.findMany({
        where: { employeeId: id },
        orderBy: { checkIn: "desc" },
        take: 20,
      });

      res.json(list);
    } catch (err: any) {
      console.error("GET /prisma/:id/recent-attendance error:", err);
      res
        .status(500)
        .json({ error: err?.message || "Failed to load attendance" });
    }
  },
);

router.get("/:id", verifyToken, async (req: Request, res: Response) => {
  try {
    const id = req.params.id;

    if (id === "favicon.ico" || !uuidRegex.test(id)) {
      return res.status(404).json({ error: "Invalid employee ID" });
    }

    if (!isAdmin(req.user?.role) && req.user?.userId !== id) {
      return res.status(403).json({ error: "Access denied" });
    }

    const employee = await prisma.employee.findUnique({ where: { id } });

    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    res.json(sanitizeEmployeeResponse(employee));
  } catch (err) {
    console.error(`GET /prisma/${req.params.id} error:`, err);
    res.status(500).json({ error: "Failed to load employee" });
  }
});

router.post(
  "/",
  verifyToken,
  requireAdmin,
  uploadPhoto,
  async (req: Request, res: Response) => {
    const body = req.body || {};

    const name = body.name?.toString().trim() || "";
    const employeeId = body.employeeId?.toString().trim() || "";
    const username = body.username?.toString().trim() || "";
    const email = body.email?.toString().trim().toLowerCase() || "";
    const password = body.password?.toString() || "";
    const role = normalizeRole(body.role);
    const department = body.department?.toString().trim() || "";
    const fingerprint =
      body.fingerprint?.toString().trim() || "default_fingerprint";
    const status = normalizeStatus(body.status);

    if (!employeeId || !username || !email || !password || !department) {
      if (req.file) await safeDeleteFile(getPhotoUrl(req.file.filename));
      return res.status(400).json({
        error:
          "Employee ID, username, email, password, and department are required",
      });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);

      const created = await prisma.employee.create({
        data: {
          name: name || username,
          employeeId,
          username,
          email,
          password: hashedPassword,
          role: role as any,
          department,
          photo: req.file
            ? getPhotoUrl(req.file.filename)
            : "/uploads/default-avatar.png",
          fingerprint,
          status: status as any,
        } as any,
      });

      res.status(201).json(sanitizeEmployeeResponse(created));
    } catch (err: any) {
      if (req.file) await safeDeleteFile(getPhotoUrl(req.file.filename));
      console.error("POST /prisma error:", err);

      if (err?.code === "P2002") {
        return res
          .status(400)
          .json({ error: "Employee ID, username, or email already exists" });
      }

      res.status(500).json({ error: "Failed to create employee" });
    }
  },
);

router.patch(
  "/:id",
  verifyToken,
  uploadPhoto,
  async (req: Request, res: Response) => {
    const id = req.params.id;

    if (id === "favicon.ico" || !uuidRegex.test(id)) {
      if (req.file) void safeDeleteFile(getPhotoUrl(req.file.filename));
      return res.status(404).json({ error: "Invalid employee ID" });
    }

    const editingSelf = req.user?.userId === id;
    if (!isAdmin(req.user?.role) && !editingSelf) {
      if (req.file) void safeDeleteFile(getPhotoUrl(req.file.filename));
      return res.status(403).json({ error: "Access denied" });
    }

    try {
      const currentEmployee = await prisma.employee.findUnique({
        where: { id },
      });

      if (!currentEmployee) {
        if (req.file) await safeDeleteFile(getPhotoUrl(req.file.filename));
        return res.status(404).json({ error: "Employee not found" });
      }

      const body = req.body || {};
      const data: Record<string, any> = {};

      const allowedForSelf = ["name", "username", "email", "department"];
      const allowedForAdmin = [
        "name",
        "employeeId",
        "username",
        "email",
        "role",
        "department",
        "fingerprint",
        "status",
        "password",
      ];

      const allowed = isAdmin(req.user?.role)
        ? allowedForAdmin
        : allowedForSelf;

      for (const key of allowed) {
        if (
          key in body &&
          body[key] !== undefined &&
          body[key] !== null &&
          `${body[key]}`.trim() !== ""
        ) {
          data[key] = `${body[key]}`.trim();
        }
      }

      if ("email" in data) data.email = data.email.toLowerCase();
      if ("role" in data) data.role = normalizeRole(data.role);
      if ("status" in data) data.status = normalizeStatus(data.status);
      if ("password" in data)
        data.password = await bcrypt.hash(data.password, 10);

      if (req.file) {
        data.photo = getPhotoUrl(req.file.filename);
      }

      if (!Object.keys(data).length) {
        if (req.file) await safeDeleteFile(getPhotoUrl(req.file.filename));
        return res.status(400).json({ error: "No valid fields to update" });
      }

      const updated = await prisma.employee.update({
        where: { id },
        data,
      });

      if (
        req.file &&
        currentEmployee.photo &&
        currentEmployee.photo !== updated.photo
      ) {
        await safeDeleteFile(currentEmployee.photo);
      }

      res.json(sanitizeEmployeeResponse(updated));
    } catch (err: any) {
      if (req.file) await safeDeleteFile(getPhotoUrl(req.file.filename));
      console.error(`PATCH /prisma/${req.params.id} error:`, err);

      if (err?.code === "P2025") {
        return res.status(404).json({ error: "Employee not found" });
      }

      if (err?.code === "P2002") {
        return res.status(400).json({
          error: "Employee ID, username, or email already exists",
        });
      }

      res.status(500).json({ error: "Failed to update employee" });
    }
  },
);

router.delete(
  "/:id",
  verifyToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    const id = req.params.id;

    if (id === "favicon.ico" || !uuidRegex.test(id)) {
      return res.status(404).json({ error: "Invalid employee ID" });
    }

    try {
      const employee = await prisma.employee.findUnique({ where: { id } });

      if (!employee) {
        return res.status(404).json({ error: "Employee not found" });
      }

      await prisma.request.deleteMany({ where: { employeeId: id } });
      await prisma.attendance.deleteMany({ where: { employeeId: id } });
      await prisma.employee.delete({ where: { id } });

      await safeDeleteFile(employee.photo);

      res.json({ ok: true });
    } catch (err: any) {
      console.error(`DELETE /prisma/${req.params.id} error:`, err);
      res.status(500).json({ error: "Failed to delete employee" });
    }
  },
);

router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, employeeId, password } = req.body || {};

    if (!email || !employeeId || !password) {
      return res
        .status(400)
        .json({ error: "Email, employee ID, and password are required" });
    }

    const user = await prisma.employee.findUnique({
      where: { email: email.toString().trim().toLowerCase() },
    });

    if (!user || user.employeeId !== employeeId.toString().trim()) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const normalizedRole = normalizeRole(user.role?.toString());

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: normalizedRole,
      },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "24h" },
    );

    res.json({
      token,
      user: {
        ...sanitizeEmployeeResponse(user),
        role: normalizedRole,
      },
    });
  } catch (err: any) {
    console.error("POST /prisma/login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

router.post("/signup", uploadPhoto, async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    const name = body.name?.toString().trim() || "";
    const employeeId = body.employeeId?.toString().trim() || "";
    const username = body.username?.toString().trim() || "";
    const email = body.email?.toString().trim().toLowerCase() || "";
    const password = body.password?.toString() || "";
    // Public signup always creates employees; admins are provisioned by an admin.
    const role = "employee";
    const department = body.department?.toString().trim() || "";

    if (
      !name ||
      !employeeId ||
      !username ||
      !email ||
      !password ||
      !department
    ) {
      if (req.file) await safeDeleteFile(getPhotoUrl(req.file.filename));
      return res.status(400).json({ error: "Missing required fields" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.employee.create({
      data: {
        name,
        employeeId,
        username,
        email,
        password: hashedPassword,
        role: role as any,
        department,
        photo: req.file
          ? getPhotoUrl(req.file.filename)
          : "/uploads/default-avatar.png",
        fingerprint: "default_fingerprint",
        status: "CHECK_OUT" as any,
      } as any,
    });

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role,
      },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "24h" },
    );

    res.status(201).json({
      token,
      user: {
        ...sanitizeEmployeeResponse(user),
        role,
      },
    });
  } catch (err: any) {
    if (req.file) await safeDeleteFile(getPhotoUrl(req.file.filename));
    console.error("POST /prisma/signup error:", err);

    if (err?.code === "P2002") {
      return res
        .status(400)
        .json({ error: "Employee ID, username, or email already exists" });
    }

    res.status(500).json({ error: "Signup failed" });
  }
});

export default router;
