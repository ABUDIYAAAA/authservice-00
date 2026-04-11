import { ZodError } from "zod";
import logger from "../core/logger/logger.js";
import { AppError } from "./errors.js";

const isInvalidJsonError = (err) => {
  return (
    err?.type === "entity.parse.failed" ||
    (err instanceof SyntaxError && err?.status === 400 && "body" in err)
  );
};

const errorMiddleware = (err, req, res, _next) => {
  const requestId = req.id || null;

  if (isInvalidJsonError(err)) {
    logger.warn("Invalid JSON request body", {
      requestId,
      path: req.path,
      method: req.method,
    });

    return res.status(400).json({
      error: "Malformed JSON body",
      code: "INVALID_JSON_BODY",
      requestId,
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Validation failed",
      code: "VALIDATION_ERROR",
      requestId,
      details: err.issues,
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
      requestId,
      details: err.details,
    });
  }

  logger.error("Unhandled server error", {
    requestId,
    path: req.path,
    method: req.method,
    stack: err.stack,
  });

  return res.status(500).json({
    error: "Internal server error",
    code: "INTERNAL_SERVER_ERROR",
    requestId,
  });
};

export default errorMiddleware;
