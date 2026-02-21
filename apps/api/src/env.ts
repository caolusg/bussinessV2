import fs from "fs";
import path from "path";
import dotenv from "dotenv";

const envPath = path.resolve(__dirname, "..", ".env");
if (!fs.existsSync(envPath)) {
  throw new Error(
    "Missing apps/api/.env. Copy apps/api/.env.example to apps/api/.env and set required variables."
  );
}

dotenv.config({ path: envPath, override: true });
