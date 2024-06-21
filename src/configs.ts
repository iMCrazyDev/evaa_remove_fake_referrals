import {PoolConfig} from "pg";
import dotenv from 'dotenv';

dotenv.config();

export const pgConfig: PoolConfig = {
  max: parseInt(process.env.DB_MAX_CONNECTIONS as string) || 5,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
};

export const supabaseConfig = {
  url: process.env.SUPABASE_URL,
  key: process.env.SUPABASE_KEY,
};
