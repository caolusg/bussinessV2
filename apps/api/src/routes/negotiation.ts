import { Router, Response } from "express";
import { randomUUID } from "crypto";
import { GoogleGenAI } from "@google/genai";
import { getPool, query } from "../db";
import { authMiddleware, AuthedRequest } from "../middleware/authMiddleware";

const router = Router();

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

async function ensureSessionOwned(sessionId: string, userId: string): Promise<boolean> {
  const sessions = await query<{ id: string }>(
    "SELECT id FROM sessions WHERE id = $1 AND user_id = $2",
    [sessionId, userId]
  );
  return sessions.length > 0;
}

router.post("/sessions", authMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const sessionId = randomUUID();
    const rows = await query<{ id: string; user_id: string; created_at: string }>(
      "INSERT INTO sessions (id, user_id) VALUES ($1, $2) RETURNING id, user_id, created_at",
      [sessionId, userId]
    );

    return res.status(201).json({ sessionId: rows[0].id });
  } catch (error) {
    const err = error as { code?: string; detail?: string; constraint?: string; message?: string };
    console.error("[negotiation] create session error", err);
    console.error({
      code: err.code,
      detail: err.detail,
      constraint: err.constraint,
      message: err.message
    });
    return res.status(500).json({
      error: "Failed to create session",
      detail: err.message,
      code: err.code
    });
  }
});

router.get("/sessions/:id", authMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const sessionId = req.params.id;
    if (!sessionId) {
      return res.status(400).json({ error: "Invalid session id" });
    }

    const isOwned = await ensureSessionOwned(sessionId, userId);
    if (!isOwned) {
      return res.status(404).json({ error: "Session not found" });
    }

    const messages = await query<{ role: string; content: string; created_at: string }>(
      "SELECT role, content, created_at FROM messages WHERE session_id = $1 ORDER BY created_at ASC",
      [sessionId]
    );

    return res.status(200).json({
      sessionId,
      messages: messages.map((message) => ({
        role: message.role,
        content: message.content,
        createdAt: message.created_at
      }))
    });
  } catch (error) {
    const err = error as { message?: string };
    console.error("[negotiation] get session error", err);
    return res.status(500).json({ error: "Failed to fetch session", detail: err.message });
  }
});

router.post("/sessions/:id/messages", authMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const sessionId = req.params.id;
    if (!sessionId) {
      return res.status(400).json({ error: "Invalid session id" });
    }

    const { content } = req.body as { content?: string };
    if (!content) {
      return res.status(400).json({ error: "content is required" });
    }

    const isOwned = await ensureSessionOwned(sessionId, userId);
    if (!isOwned) {
      return res.status(404).json({ error: "Session not found" });
    }

    await getPool().query(
      "INSERT INTO messages (session_id, role, content) VALUES ($1, $2, $3)",
      [sessionId, "user", content]
    );

    return res.status(201).json({ ok: true });
  } catch (error) {
    const err = error as { code?: string; detail?: string; constraint?: string; message?: string };
    console.error("[negotiation] create message error", err);
    console.error({
      code: err.code,
      detail: err.detail,
      constraint: err.constraint,
      message: err.message
    });
    return res.status(500).json({
      error: "Failed to create message",
      detail: err.message,
      code: err.code
    });
  }
});

router.post("/sessions/:id/ai-reply", authMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const sessionId = req.params.id;
    if (!sessionId) {
      return res.status(400).json({ error: "Invalid session id" });
    }

    const isOwned = await ensureSessionOwned(sessionId, userId);
    if (!isOwned) {
      return res.status(404).json({ error: "Session not found" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Missing GEMINI_API_KEY" });
    }

    const rows = await query<{ role: string; content: string }>(
      `SELECT role, content
       FROM (
         SELECT role, content, created_at
         FROM messages
         WHERE session_id = $1
         ORDER BY created_at DESC
         LIMIT 20
       ) recent
       ORDER BY created_at ASC`,
      [sessionId]
    );

    const contents = rows
      .map((row) => {
        if (row.role === "assistant") {
          return { role: "model", parts: [{ text: row.content }] };
        }
        if (row.role === "user") {
          return { role: "user", parts: [{ text: row.content }] };
        }
        return null;
      })
      .filter((msg): msg is { role: "user" | "model"; parts: Array<{ text: string }> } => Boolean(msg));

    let reply = "";
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents
      });

      reply = response.text?.trim() ?? "";
      if (!reply) {
        throw new Error("Gemini response missing text");
      }
    } catch (error) {
      const err = error as { message?: string; cause?: { code?: string } };
      console.error("[negotiation] gemini error", err, err?.cause);
      const fallbackReply = "AI 暂时不可用，请检查网络或 KEY。";
      await getPool().query(
        "INSERT INTO messages (session_id, role, content) VALUES ($1, $2, $3)",
        [sessionId, "assistant", fallbackReply]
      );
      return res.status(502).json({
        error: "Failed to generate AI reply",
        detail: `${err?.message ?? "Unknown error"} ${err?.cause?.code ?? ""}`.trim(),
        code: err?.cause?.code,
        reply: fallbackReply
      });
    }

    await getPool().query(
      "INSERT INTO messages (session_id, role, content) VALUES ($1, $2, $3)",
      [sessionId, "assistant", reply]
    );

    return res.status(200).json({ reply });
  } catch (error) {
    const err = error as { code?: string; detail?: string; constraint?: string; message?: string };
    console.error("[negotiation] ai reply error", err);
    console.error({
      code: err.code,
      detail: err.detail,
      constraint: err.constraint,
      message: err.message
    });
    return res.status(500).json({
      error: "Failed to generate AI reply",
      detail: err.message,
      code: err.code
    });
  }
});

export default router;
