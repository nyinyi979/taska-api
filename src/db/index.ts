import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as userSchema from "./user";
import * as workspaceSchema from "./workspace";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
});

const db = drizzle({
  client: pool,
  schema: {
    ...userSchema,
    ...workspaceSchema,
  },
});

export default db;
