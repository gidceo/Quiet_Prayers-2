import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

// `pg` ships as a default export in ESM contexts; access `Pool` from the
// default import to avoid runtime "does not provide an export named 'Pool'".
const PgPool = (pg as any).Pool;

// Export optional `pool` and `db` so importing this module doesn't throw
// when `DATABASE_URL` is not set. This allows the server to run in
// in-memory `MemStorage` mode without requiring Postgres at import time.
export const pool: any | undefined = process.env.DATABASE_URL
  ? new PgPool({ connectionString: process.env.DATABASE_URL })
  : undefined;

export const db: any | undefined = pool ? drizzle(pool) : undefined;
