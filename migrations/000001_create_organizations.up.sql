CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE "organizations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" varchar,
  "created_at" timestamp DEFAULT NOW()
);