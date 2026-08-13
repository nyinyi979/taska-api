"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildApp = buildApp;
const cors_1 = __importDefault(require("@fastify/cors"));
const formbody_1 = __importDefault(require("@fastify/formbody"));
const helmet_1 = __importDefault(require("@fastify/helmet"));
const multipart_1 = __importDefault(require("@fastify/multipart"));
const sensible_1 = __importDefault(require("@fastify/sensible"));
const fastify_1 = __importDefault(require("fastify"));
const rate_limit_1 = __importDefault(require("@fastify/rate-limit"));
const swagger_1 = __importDefault(require("@fastify/swagger"));
const swagger_ui_1 = __importDefault(require("@fastify/swagger-ui"));
const routes_1 = __importDefault(require("./api/auth/routes"));
const routes_2 = __importDefault(require("./api/file/routes"));
const routes_3 = __importDefault(require("./api/master/routes"));
const routes_4 = __importDefault(require("./api/workspace/routes"));
const messages_1 = require("./api/messages");
const errorHandler_1 = require("./utils/errorHandler");
let cachedApp = null;
async function buildApp() {
    if (cachedApp)
        return cachedApp;
    const app = (0, fastify_1.default)({ logger: true });
    await app.register(swagger_1.default, {
        openapi: {
            openapi: "3.0.3",
            info: {
                title: "Taska API",
                description: "API documentation for Taska project and task management.",
                version: "1.0.0",
            },
            tags: [
                { name: "Health", description: "Service health endpoints" },
                { name: "Authentication", description: "Authentication and users" },
                { name: "Files", description: "File uploads" },
                { name: "Master Data", description: "Country, state, and city data" },
                { name: "Workspace", description: "Taska projects and tasks" },
            ],
            components: {
                securitySchemes: {
                    accessToken: {
                        type: "apiKey",
                        in: "header",
                        name: "x-access-token",
                        description: "JWT access token returned by the login endpoint.",
                    },
                },
            },
        },
    });
    await app.register(swagger_ui_1.default, {
        routePrefix: "/documentation",
        staticCSP: true,
        uiConfig: {
            deepLinking: true,
            docExpansion: "list",
            persistAuthorization: true,
        },
    });
    app.register(helmet_1.default, (instance) => ({
        contentSecurityPolicy: {
            directives: {
                ...helmet_1.default.contentSecurityPolicy.getDefaultDirectives(),
                "form-action": ["'self'"],
                "img-src": ["'self'", "data:", "validator.swagger.io"],
                "script-src": ["'self'", ...instance.swaggerCSP.script],
                "style-src": ["'self'", "https:", ...instance.swaggerCSP.style],
            },
        },
    }));
    app.register(sensible_1.default);
    app.register(cors_1.default, {
        origin: "*",
        methods: ["GET", "PUT", "POST", "DELETE", "OPTIONS", "PATCH"],
    });
    app.register(rate_limit_1.default, {
        max: 60,
        timeWindow: "1 minute",
    });
    app.register(multipart_1.default, {
        limits: {
            fileSize: 5 * 1024 * 1024,
        },
    });
    app.register(formbody_1.default);
    app.setErrorHandler(errorHandler_1.handleApiError);
    app.setNotFoundHandler((_req, res) => {
        return res.status(404).send({ ...messages_1.messages.notFound });
    });
    app.get("/api", {
        schema: {
            tags: ["Health"],
            summary: "Check whether the API is available",
            response: {
                200: {
                    type: "object",
                    properties: {
                        statusCode: { type: "integer" },
                        message: { type: "string" },
                    },
                },
            },
        },
    }, (_req, res) => res.send({ statusCode: 200, message: "The API is available." }));
    app.register(routes_1.default, { prefix: "/api/admin" });
    app.register(routes_3.default, { prefix: "/api/master" });
    app.register(routes_2.default, { prefix: "/api/file" });
    app.register(routes_4.default, { prefix: "/api/workspace" });
    await app.ready();
    cachedApp = app;
    return app;
}
if (require.main === module) {
    buildApp().then((app) => app.listen({ port: +process.env.DEV_PORT || 7000, host: "127.0.0.1" }, (err, address) => {
        if (err) {
            app.log.error(err);
            process.exit(1);
        }
        app.log.info({ address }, "Server listening");
    }));
}
const handler = async (req, res) => {
    const app = await buildApp();
    app.server.emit("request", req, res);
};
module.exports = handler;
module.exports.buildApp = buildApp;
