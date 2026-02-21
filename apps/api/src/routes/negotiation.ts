import { Router, Response } from "express";
import { query } from "../db";
import { authMiddleware, AuthedRequest } from "../middleware/authMiddleware";

const router = Router();

router.post("/sessions", authMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const rows = await query<{ id: number; user_id: number; created_at: string }>(
      "INSERT INTO sessions (user_id) VALUES ($1) RETURNING id, user_id, created_at",
      [userId]
    );

    return res.status(201).json({ session: rows[0] });
  } catch (error) {
    return res.status(500).json({ error: "Failed to create session" });
  }
});

router.post("/sessions/:id/messages", authMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const sessionId = Number(req.params.id);
    if (Number.isNaN(sessionId)) {
      return res.status(400).json({ error: "Invalid session id" });
    }

    const { role, content } = req.body as { role?: string; content?: string };
    if (!role || !content) {
      return res.status(400).json({ error: "role and content are required" });
    }

    const sessions = await query<{ id: number }>(
      "SELECT id FROM sessions WHERE id = $1 AND user_id = $2",
      [sessionId, userId]
    );

    if (sessions.length === 0) {
      return res.status(404).json({ error: "Session not found" });
    }

    const rows = await query<{ id: number; session_id: number; role: string; content: string; created_at: string }>(
      "INSERT INTO messages (session_id, role, content) VALUES ($1, $2, $3) RETURNING id, session_id, role, content, created_at",
      [sessionId, role, content]
    );

    return res.status(201).json({ message: rows[0] });
  } catch (error) {
    return res.status(500).json({ error: "Failed to create message" });
  }
});

export default router;
