export class AppError extends Error {
  constructor(message, statusCode, options = {}) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = options.code || "APP_ERROR";
    this.details = options.details || null;
    this.isOperational = true;
  }
}

export const notFound = (message = "Resource not found") => {
  throw new AppError(message, 404, { code: "NOT_FOUND" });
};

export const unauthorized = (message = "Unauthorized") => {
  throw new AppError(message, 401, { code: "UNAUTHORIZED" });
};

export const forbidden = (message = "Forbidden") => {
  throw new AppError(message, 403, { code: "FORBIDDEN" });
};

export const badRequest = (message = "Bad request", details = null) => {
  throw new AppError(message, 400, { code: "BAD_REQUEST", details });
};

export const conflict = (message = "Conflict") => {
  throw new AppError(message, 409, { code: "CONFLICT" });
};
