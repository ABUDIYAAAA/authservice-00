import path from "node:path";
import { fileURLToPath } from "node:url";
import swaggerJsdoc from "swagger-jsdoc";
import env from "./config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../..");

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
        url: `http://localhost:${env.PORT}`,
        description: "Local",
      },
    ],
  },
  apis: [
    path.join(projectRoot, "index.js"),
    path.join(projectRoot, "src/modules/**/*.js"),
  ],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
