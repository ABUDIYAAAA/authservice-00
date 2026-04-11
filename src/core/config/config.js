import "dotenv/config";

const envConfig = {
  APP_ENV: process.env.APP_ENV,
  PORT: process.env.PORT,
  FRONTEND_URL: process.env.FRONTEND_URL,
  DB_URL: process.env.DB_URL,
  REDIS_URL: process.env.REDIS_URL,
};

export default envConfig;
