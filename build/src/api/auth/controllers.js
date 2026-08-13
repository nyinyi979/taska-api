"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateUser = exports.getUserByToken = exports.getUserById = exports.getUsers = exports.login = exports.signup = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const drizzle_orm_1 = require("drizzle-orm");
const jsonwebtoken_1 = require("jsonwebtoken");
const db_1 = __importDefault(require("../../db"));
const user_1 = require("../../db/user");
const errors_1 = require("../../utils/errors");
const signup = async (data) => {
    const existingUser = await db_1.default.query.usersTable.findFirst({
        where: (0, drizzle_orm_1.eq)(user_1.usersTable.email, data.email),
        columns: { id: true },
    });
    if (existingUser)
        return null;
    const password = await bcrypt_1.default.hash(data.password, 10);
    const response = await db_1.default
        .insert(user_1.usersTable)
        .values({
        username: data.username,
        email: data.email,
        password,
        role: 0,
    })
        .returning({
        id: user_1.usersTable.id,
        username: user_1.usersTable.username,
        email: user_1.usersTable.email,
        role: user_1.usersTable.role,
    });
    return response[0];
};
exports.signup = signup;
const login = async (data) => {
    const user = await db_1.default.query.usersTable.findFirst({
        columns: {
            id: true,
            username: true,
            password: true,
            email: true,
            role: true,
        },
        where: (0, drizzle_orm_1.eq)(user_1.usersTable.email, data.email),
    });
    if (!user)
        throw new errors_1.UnauthorizedError("The email or password is incorrect.");
    const passwordMatches = await bcrypt_1.default.compare(data.password, user.password);
    if (!passwordMatches) {
        throw new errors_1.UnauthorizedError("The email or password is incorrect.");
    }
    const secret = process.env.JWT_SECRET;
    if (!secret)
        throw new errors_1.ConfigurationError("JWT_SECRET is not configured");
    const token = (0, jsonwebtoken_1.sign)({ id: user.id, accountType: "admin" }, secret, {
        algorithm: "HS256",
        expiresIn: "7d",
    });
    const { password: _password, ...safeUser } = user;
    return { user: safeUser, token };
};
exports.login = login;
const getUsers = async ({ page, perPage }) => {
    return db_1.default.transaction(async (tx) => {
        const data = await tx.query.usersTable.findMany({
            limit: perPage,
            offset: page * perPage,
            columns: {
                id: true,
                username: true,
                email: true,
                role: true,
            },
        });
        const count = await tx.$count(user_1.usersTable);
        return { data, count };
    });
};
exports.getUsers = getUsers;
const getUserById = async (id) => {
    const user = await db_1.default.query.usersTable.findFirst({
        where: (0, drizzle_orm_1.eq)(user_1.usersTable.id, id),
        columns: {
            id: true,
            username: true,
            email: true,
            role: true,
        },
    });
    if (!user)
        throw new errors_1.NotFoundError("User not found");
    return user;
};
exports.getUserById = getUserById;
const getUserByToken = async (token) => {
    const secret = process.env.JWT_SECRET;
    if (!secret)
        throw new errors_1.ConfigurationError("JWT_SECRET is not configured");
    const payload = (0, jsonwebtoken_1.verify)(token, secret, { algorithms: ["HS256"] });
    if (typeof payload === "string" ||
        typeof payload.id !== "string" ||
        payload.accountType !== "admin") {
        throw new errors_1.UnauthorizedError("Invalid token payload.");
    }
    return (0, exports.getUserById)(payload.id);
};
exports.getUserByToken = getUserByToken;
const updateUser = async (data) => {
    const user = await db_1.default.query.usersTable.findFirst({
        columns: { id: true, password: true },
        where: (0, drizzle_orm_1.eq)(user_1.usersTable.id, data.id),
    });
    if (!user)
        throw new errors_1.NotFoundError("User not found");
    const { id, password, ...updates } = data;
    const response = await db_1.default
        .update(user_1.usersTable)
        .set({
        ...updates,
        ...(password ? { password: await bcrypt_1.default.hash(password, 10) } : {}),
    })
        .where((0, drizzle_orm_1.eq)(user_1.usersTable.id, id))
        .returning({
        id: user_1.usersTable.id,
        username: user_1.usersTable.username,
        email: user_1.usersTable.email,
        role: user_1.usersTable.role,
    });
    return response[0];
};
exports.updateUser = updateUser;
const deleteUser = async (id) => {
    return db_1.default.delete(user_1.usersTable).where((0, drizzle_orm_1.eq)(user_1.usersTable.id, id)).returning({
        id: user_1.usersTable.id,
        username: user_1.usersTable.username,
        email: user_1.usersTable.email,
        role: user_1.usersTable.role,
    });
};
exports.deleteUser = deleteUser;
