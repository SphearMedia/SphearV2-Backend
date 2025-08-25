import { StatusCodes } from "http-status-codes";

// src/common/response.util.ts
export function SuccessResponse(
  statusCode: StatusCodes,
  message: string,
  data?: any,
) {
  return {
    statusCode,
    message,
    data: data ?? null,
  };
}
export function ErrorResponse(
  statusCode: StatusCodes,
  message: string,
  error?: any,
) {
  return {
    statusCode,
    message,
    error: error ?? null,
  };
}