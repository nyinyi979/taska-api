"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleDeleteAdmin = exports.handleUpdateUser = exports.handleGetUserByToken = exports.handleGetUserById = exports.handleGetUsers = exports.handleLogin = exports.handleSignup = void 0;
const auth_1 = require("../../utils/auth");
const messages_1 = require("../messages");
const controllers_1 = require("./controllers");
const handleSignup = async (req, res) => {
    try {
        const data = await (0, controllers_1.signup)(req.body);
        if (!data)
            return res.status(409).send({ ...messages_1.messages.duplicateEmail });
        return res.status(201).send({ ...messages_1.messages.createOk, data });
    }
    catch (err) {
        throw err;
    }
};
exports.handleSignup = handleSignup;
const handleLogin = async (req, res) => {
    try {
        const data = await (0, controllers_1.login)(req.body);
        return res.code(200).send({ ...messages_1.messages.verifyOk, data });
    }
    catch (err) {
        throw err;
    }
};
exports.handleLogin = handleLogin;
const handleGetUsers = async (req, res) => {
    try {
        const response = await (0, controllers_1.getUsers)(req.query);
        return res.code(200).send({ ...messages_1.messages.verifyOk, ...response });
    }
    catch (err) {
        throw err;
    }
};
exports.handleGetUsers = handleGetUsers;
const handleGetUserById = async (req, res) => {
    try {
        const response = await (0, controllers_1.getUserById)(req.params.id);
        return res.code(200).send({ ...messages_1.messages.verifyOk, data: response });
    }
    catch (err) {
        throw err;
    }
};
exports.handleGetUserById = handleGetUserById;
const handleGetUserByToken = async (req, res) => {
    try {
        const data = await (0, auth_1.authenticate)(req, res);
        return res.code(200).send({ ...messages_1.messages.verifyOk, data });
    }
    catch (err) {
        throw err;
    }
};
exports.handleGetUserByToken = handleGetUserByToken;
const handleUpdateUser = async (req, res) => {
    try {
        const data = await (0, controllers_1.updateUser)(req.body);
        return res.code(200).send({ ...messages_1.messages.updateOk, data });
    }
    catch (err) {
        throw err;
    }
};
exports.handleUpdateUser = handleUpdateUser;
const handleDeleteAdmin = async (req, res) => {
    try {
        const data = await (0, controllers_1.deleteUser)(req.params.id);
        return res.code(200).send({ ...messages_1.messages.deleteOk, data });
    }
    catch (err) {
        throw err;
    }
};
exports.handleDeleteAdmin = handleDeleteAdmin;
