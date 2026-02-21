import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/auth";
import negotiationRoutes from "./routes/negotiation";

dotenv.config();

const app = express();

app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/negotiation", negotiationRoutes);

const port = Number(process.env.PORT || 8000);

app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});
