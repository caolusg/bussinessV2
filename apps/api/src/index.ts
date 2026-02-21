import "./env";
import express from "express";
import authRoutes from "./routes/auth";
import negotiationRoutes from "./routes/negotiation";
import { getDbInfo, getPool } from "./db";

const app = express();

app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/api/health/db", async (_req, res) => {
  try {
    await getPool().query("SELECT 1");
    const db = getDbInfo();
    return res.status(200).json({ ok: true, db });
  } catch (error) {
    const err = error as { code?: string; message?: string };
    return res.status(500).json({
      ok: false,
      error: "Database connection failed",
      code: err.code,
      detail: err.message
    });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/negotiation", negotiationRoutes);

const port = Number(process.env.PORT || 8000);

app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});
