import express, { Request, Response } from 'express'
import { PrismaClient } from '../../generated/prisma'
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = express.Router()
const prisma = new PrismaClient()

router.get('/', async (req: Request, res: Response) => {
  try {
    const employees = await prisma.employee.findMany()
    res.json(employees)
    console.log("employees are fetched")
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to load employees' })
  }
})
router.get("/summary", async (req: Request, res: Response) => {

  try{
    const totalEmployees=await prisma.employee.count();
    const onWorkEmployees=await prisma.employee.count({where:{status:"CHECK_IN"}});
    const today=new Date();
    today.setHours(0,0,0,0);
    const todaysCheckIns = await prisma.attendance.count({ where: { checkIn: { gte: today } } });

     const now = new Date();
      const days = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date();
        d.setDate(now.getDate() - (6 - i));
        d.setHours(0, 0, 0, 0);
        return d;
      });
       const checkInsPerDay = await Promise.all(
        days.map(async (d, i) => {
          const next = new Date(d);
          next.setDate(d.getDate() + 1);
          const c = await prisma.attendance.count({
            where: { checkIn: { gte: d, lt: next } },
          });
          return { date: d.toISOString().slice(0, 10), count: c };
        })
      );
       res.json({
        totalEmployees,
        onDuty:onWorkEmployees,
        todaysCheckIns,
        checkInsPerDay,
      });
  }
  catch(err:any){
    console.error("GET /prisma/summary error:",err);
    res.status(500).json({error:err?.message || "Failed to load summary"});
  }

  });

router.get('/:id', async (req: Request, res: Response) => {
  try {
    // Skip favicon.ico and other non-ObjectId requests
    if (req.params.id === 'favicon.ico' || !/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
      return res.status(404).json({ error: "Invalid employee ID" });
    }

    const employee = await prisma.employee.findUnique({ where: { id: req.params.id } });
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }
    res.json(employee);
  }
  catch (err) {
    console.error(`GET/prisma/${req.params.id} error:`, err);
    res.status(500).json({ error: "Failed to load employee" });

  }
}
);
router.patch('/:id', async (req: Request, res: Response) => {
  // Skip favicon.ico and other non-ObjectId requests
  if (req.params.id === 'favicon.ico' || !/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
    return res.status(404).json({ error: "Invalid employee ID" });
  }

  const allowed = ['name', 'username', 'email', 'role', 'department', 'photo', 'fingerprint', 'password'];
  const data: Record<string, any> = {};
  for (const k of allowed) if (k in req.body) data[k] = req.body[k];

  if (!Object.keys(data).length) return res.status(400).json({ error: "No valid fields to update" });

  try {
    // Hash password if it's being updated
    if (data.password) {
      const hashedPassword = await bcrypt.hash(data.password, 10);
      data.password = hashedPassword;
    }

    const updated = await prisma.employee.update({ where: { id: req.params.id }, data });
    res.json(updated);
  } catch (err: any) {
    console.error(`PATCH /prisma/${req.params.id} error:`, err);
    if (err?.code === "P2025") return res.status(404).json({ error: "Employee not found" });
    res.status(500).json({ error: "Failed to update employee" });
  }
});
router.delete("/:id", async (req: Request, res: Response) => {
  // Skip favicon.ico and other non-ObjectId requests
  if (req.params.id === 'favicon.ico' || !/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
    return res.status(404).json({ error: "Invalid employee ID" });
  }

  try {
    await prisma.employee.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err: any) {
    console.error(`DELETE /prisma/${req.params.id} error:`, err);
    if (err?.code === "P2025") return res.status(404).json({ error: "Employee not found" });
    res.status(500).json({ error: "Failed to delete employee" });
  }
});


router.get("/:id/recent-attendance", async (req: Request, res: Response) => {
  try {
    const id = req.params.id;

    // Skip favicon.ico and other non-ObjectId requests
    if (id === 'favicon.ico' || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(404).json({ error: "Invalid employee ID" });
    }

    const list = await prisma.attendance.findMany({
      where: { employeeId: id },
      orderBy: { checkIn: "desc" },
      take: 20,
    });
    res.json(list);
  } catch (err: any) {
    console.error("GET /prisma/:id/recent-attendance error:", err);
    res.status(500).json({ error: err?.message || "Failed" });
  }
});

router.post("/", async (req: Request, res: Response) => {
const allowed=['name','username','email','role','department','photo','fingerprint','password'];
const data:Record<string,any>={};
for(const k of allowed) if(k in req.body) data[k]=req.body[k];
if(!data.username || !data.email || !data.password || !data.role || !data.department || !data.photo || !data.fingerprint){
  return res.status(400).json({error:"Missing required fields"});
}
try{
  // Hash the password before storing it
  const hashedPassword = await bcrypt.hash(data.password, 10);
  data.password = hashedPassword;

  const created=await prisma.employee.create({data:data as any});
  res.status(201).json(created);
}catch(err:any){
  console.error("POST /prisma error:",err);
  if(err?.code==="P2002"){
    return res.status(400).json({error:"Username or email already exists"});
  }
  res.status(500).json({error:"Failed to create employee"});
}



});

// Login endpoint
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Find user by email
    const user = await prisma.employee.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check password (you'll need to hash passwords during signup)
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Create JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department
      }
    });

  } catch (err: any) {
    console.error("POST /prisma/login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

// Signup endpoint
router.post("/signup", async (req: Request, res: Response) => {
  try {
    const { name, username, email, password, role = 'employee', department, photo, fingerprint } = req.body;

    if (!name || !username || !email || !password || !department || !photo || !fingerprint) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Check if user already exists
    const existingUser = await prisma.employee.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.employee.create({
      data: {
        name,
        username,
        email,
        password: hashedPassword,
        role,
        department,
        photo,
        fingerprint,
        status: 'CHECK_OUT'
      }
    });

    // Create JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department
      }
    });

  } catch (err: any) {
    console.error("POST /prisma/signup error:", err);
    if (err?.code === "P2002") {
      return res.status(400).json({ error: "Email already exists" });
    }
    res.status(500).json({ error: "Signup failed" });
  }
});


export default router
