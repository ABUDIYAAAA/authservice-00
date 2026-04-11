const log = (level, message, meta = {}) => {
  const payload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...meta,
  };

  // Console logging is enough for now, while keeping JSON shape production-friendly.
  console.log(JSON.stringify(payload));
};

const logger = {
  info: (message, meta) => log("info", message, meta),
  warn: (message, meta) => log("warn", message, meta),
  error: (message, meta) => log("error", message, meta),
  debug: (message, meta) => {
    if (process.env.APP_ENV !== "production") {
      log("debug", message, meta);
    }
  },
};

export default logger;
