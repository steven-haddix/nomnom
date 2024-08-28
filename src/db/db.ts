import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import env from "@/utils/env";

const sql = neon(env.DATABASE_URL);

const db = drizzle(sql);

export default db;
