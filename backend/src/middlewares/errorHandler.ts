import { ErrorRequestHandler, RequestHandler } from "express";

const isProduction = process.env.NODE_ENV === "production";

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({
    error: "Route not found",
  });
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  const statusCode =
    typeof error?.status === "number" && error.status >= 400
      ? error.status
      : 500;

  if (!isProduction) {
    console.error("Unhandled error:", error);
  }

  res.status(statusCode).json({
    error: statusCode >= 500 ? "Something went wrong" : error.message,
    ...(isProduction
      ? {}
      : {
          detail: error.message,
          stack: error.stack,
        }),
  });
};
