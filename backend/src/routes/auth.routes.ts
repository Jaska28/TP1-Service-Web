import { Router, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../../utils/prisma.js";
import { authentifier } from "../middlewares/auth.js";

const routerAuth = Router();

// Post/auth/register
routerAuth.post("/auth/register", async (req: Request, res: Response) => {
  const { username, password ,role } = req.body;
  if (!username || !password || !role) {
    return res.status(400).json({ erreur: "username, password et role requis" });
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { username, password: hash, role },
    });
    res
      .status(201)
      .json({ id: user.id, username: user.username, role: user.role });
  } catch {
    res.status(400).json({ erreur: "Username deja utilise" });
  }
});

// POST /auth/login
routerAuth.post("/auth/login", async (req: Request, res: Response) => {
  const { username, password } = req.body;
  const user = await prisma.user.findUnique({ where: { username } });

  if (!user) return res.status(401).json({ erreur: "Identifiants invalides" });
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ erreur: "Identifiants invalides" });

  const token = jwt.sign(
    { sub: user.id, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: "2h" },
  );
  res.json({ token });
});

// GET /auth/me (route protegee)
routerAuth.get("/me", authentifier, async (req: Request, res: Response) => {
  const id = (req as any).user.sub;
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      role: true,
      createdAt: true,
    },
  });
  res.json(user);
});

export default routerAuth;
