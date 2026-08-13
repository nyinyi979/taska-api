export const messages = {
  somethingWentWrong: {
    statusCode: 500,
    error: "Internal Server Error",
    message: "Something went wrong. Please try again later.",
  },
  loginError: {
    statusCode: 401,
    error: "Authentication Failed",
    message: "The email or password is incorrect.",
  },
  foreignKeyError: {
    statusCode: 409,
    error: "Conflict",
    message:
      "This operation cannot be completed because related records exist.",
  },
  forbiddenAccess: {
    statusCode: 403,
    error: "Forbidden",
    message: "You do not have permission to perform this action.",
  },
  clientDataError: {
    statusCode: 400,
    error: "Validation Error",
    message: "The provided data does not meet the expected requirements.",
  },
  notFound: {
    statusCode: 404,
    error: "Not Found",
    message: "The requested record was not found.",
  },
  schemaError: {
    statusCode: 400,
    error: "Bad Request",
    message: "Please provide all required data.",
  },
  createOk: {
    statusCode: 201,
    message: "The record was created successfully.",
  },
  updateOk: {
    statusCode: 200,
    message: "The record was updated successfully.",
  },
  verifyOk: {
    statusCode: 200,
    message: "The request completed successfully.",
  },
  deleteOk: {
    statusCode: 200,
    message: "The record was deleted successfully.",
  },
  duplicateEmail: {
    statusCode: 409,
    error: "Conflict",
    message: "This email address is already in use.",
  },
  duplicateData: {
    statusCode: 409,
    error: "Conflict",
    message: "This record already exists.",
  },
} as const;
