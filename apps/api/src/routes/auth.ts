import { Router, Request, Response } from "express";
import { randomUUID } from "crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { query } from "../db";

const router = Router();

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  throw new Error("JWT_SECRET is not set");
}

router.post("/register", async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body as {
      name?: string;
      email?: string;
      password?: string;
    };

    if (!name || !email || !password) {
      return res.status(400).json({ error: "name, email, and password are required" });
    }

    const existing = await query<{ id: string }>("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = randomUUID();
    const rows = await query<{ id: string; name: string; email: string }>(
      "INSERT INTO users (id, name, email, password_hash) VALUES ($1, $2, $3, $4) RETURNING id, name, email",
      [userId, name, email, passwordHash]
    );

    return res.status(201).json({ user: rows[0] });
  } catch (error) {
    const err = error as {
      code?: string;
      detail?: string;
      constraint?: string;
      message?: string;
    };
    console.error("[register] error", err);
    console.error({
      code: err.code,
      detail: err.detail,
      constraint: err.constraint,
      message: err.message
    });
    return res.status(500).json({
      error: "Failed to register",
      detail: err.message,
      code: err.code
    });
  }
});

router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const users = await query<{ id: number; name: string; email: string; password_hash: string }>(
      "SELECT id, name, email, password_hash FROM users WHERE email = $1",
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = users[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, jwtSecret, { expiresIn: "7d" });

    return res.status(200).json({
      token,
      user: { id: user.id, name: user.name, email: user.email }
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to login" });
  }
});

export default router;
