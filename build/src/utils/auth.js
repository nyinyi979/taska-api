"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateAdmin = exports.authenticate = void 0;
const controllers_1 = require("../api/auth/controllers");
const errors_1 = require("./errors");
const getAccessToken = (req) => {
    const token = req.headers["x-access-token"];
    if (!token || typeof token !== "string")
        throw new errors_1.UnauthorizedError();
    return token;
};
const rethrowServerError = (error) => {
    if (error instanceof errors_1.AppError && error.statusCode >= 500)
        throw error;
};
const authenticate = async (req, _res) => {
    try {
        return await (0, controllers_1.getUserByToken)(getAccessToken(req));
    }
    catch (error) {
        rethrowServerError(error);
        throw new errors_1.UnauthorizedError();
    }
};
exports.authenticate = authenticate;
const authenticateAdmin = async (req, _res) => {
    try {
        const user = await (0, controllers_1.getUserByToken)(getAccessToken(req));
        if (user.role !== 1)
            throw new errors_1.ForbiddenError();
        return user;
    }
    catch (error) {
        rethrowServerError(error);
        if (error instanceof errors_1.ForbiddenError)
            throw error;
        throw new errors_1.UnauthorizedError();
    }
};
exports.authenticateAdmin = authenticateAdmin;
