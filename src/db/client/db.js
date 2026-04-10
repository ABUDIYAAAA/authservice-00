import env from "../../core/config/config.js";
import { drizzle } from "drizzle-orm/node-postgres";

const db = drizzle(env.DATABASE_URL);

export default db;
