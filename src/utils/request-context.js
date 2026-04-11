import crypto from "node:crypto";

const requestContext = (req, _res, next) => {
  req.id = req.header("x-request-id") || crypto.randomUUID();
  next();
};

export default requestContext;
