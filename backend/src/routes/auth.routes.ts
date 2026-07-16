import { Router, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../../utils/prisma.js";
import { authentifier } from "../middlewares/auth.js";

const router = Router();

// Post/auth/register
router.post("/register", async (req: Request, res: Response) => {
  const { email, pseudo, password } = req.body;
  if (!email || !pseudo || !password) {
    return res.status(400).json({ erreur: "email, pseudo et password requis" });
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, pseudo, password: hash },
    });
    res
      .status(201)
      .json({ id: user.id, email: user.email, pseudo: user.pseudo });
  } catch {
    res.status(400).json({ erreur: "Email deja utilise" });
  }
});

// POST /auth/login
router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
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
router.get("/me", authentifier, async (req: Request, res: Response) => {
  const id = (req as any).user.sub;
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      pseudo: true,
      role: true,
      createdAt: true,
    },
  });
  res.json(user);
});

export default router;
