import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import swaggerJsdoc from "swagger-jsdoc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../..");
const outputPath = path.join(projectRoot, "src/docs/openapi.json");

const options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Auth Service API",
      version: "1.0.0",
      description: "OpenAPI docs for authservice-00",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Local",
      },
    ],
  },
  apis: [
    path.join(projectRoot, "index.js"),
    path.join(projectRoot, "src/modules/**/*.js"),
  ],
};

const spec = swaggerJsdoc(options);

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(spec, null, 2)}\n`, "utf8");

console.log(`OpenAPI spec generated at ${outputPath}`);
