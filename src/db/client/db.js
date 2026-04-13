import env from "../../core/config/config.js";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: env.PG_POOL_MAX,
  min: env.PG_POOL_MIN,
  idleTimeoutMillis: env.PG_POOL_IDLE_TIMEOUT_MS,
  connectionTimeoutMillis: env.PG_POOL_CONNECTION_TIMEOUT_MS,
  maxUses: env.PG_POOL_MAX_USES,
});

const db = drizzle(pool);

export default db;
