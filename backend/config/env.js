import { config } from "dotenv";
config({ path: `.env` });

export const {
  PORT,
  MYSQL_HOST,
  MYSQL_USER,
  MYSQL_PASSWORD,
  MYSQL_DATABASE,
  MYSQL_PORT,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  MERCHANT_API_KEY,
  MERCHANT_API_USER_ID,
  MERCHANT_U_ID,
} = process.env;
