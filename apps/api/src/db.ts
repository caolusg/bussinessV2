import "./env";
import { Pool } from "pg";

let pool: Pool | null = null;

function getDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is not set. Create apps/api/.env based on apps/api/.env.example or set DATABASE_URL."
    );
  }
  return databaseUrl;
}

export function getDbInfo(): { host: string; port: number; database: string; user: string } {
  const databaseUrl = getDatabaseUrl();
  const url = new URL(databaseUrl);
  const host = url.hostname;
  const port = url.port ? Number(url.port) : 5432;
  const database = url.pathname.replace("/", "");
  const user = decodeURIComponent(url.username);
  return { host, port, database, user };
}

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: getDatabaseUrl()
    });
  }
  return pool;
}

export async function query<T>(text: string, params?: unknown[]): Promise<T[]> {
  const result = await getPool().query<T>(text, params);
  return result.rows;
}
