import "dontenv/config";

const envConfig = {
  PORT: process.env.PORT,
  DB_URL: process.env.DB_URL,
};

export default envConfig;
