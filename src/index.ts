import cors from "@fastify/cors";
import formBody from "@fastify/formbody";
import helmet from "@fastify/helmet";
import multipart from "@fastify/multipart";
import sensible from "@fastify/sensible";
import Fastify, {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import rateLimit from "@fastify/rate-limit";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import authRoutes from "./api/auth/routes";
import fileRoutes from "./api/file/routes";
import masterRoutes from "./api/master/routes";
import workspaceRoutes from "./api/workspace/routes";
import { messages } from "./api/messages";
import { handleApiError } from "./utils/errorHandler";

let cachedApp: FastifyInstance | null = null;
export async function buildApp(): Promise<FastifyInstance> {
  if (cachedApp) return cachedApp;

  const app: FastifyInstance = Fastify({ logger: true });

  await app.register(swagger, {
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

  await app.register(swaggerUi, {
    routePrefix: "/documentation",
    staticCSP: true,
    uiConfig: {
      deepLinking: true,
      docExpansion: "list",
      persistAuthorization: true,
    },
  });

  app.register(helmet, (instance) => ({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "form-action": ["'self'"],
        "img-src": ["'self'", "data:", "validator.swagger.io"],
        "script-src": ["'self'", ...instance.swaggerCSP.script],
        "style-src": ["'self'", "https:", ...instance.swaggerCSP.style],
      },
    },
  }));
  app.register(sensible);
  app.register(cors, {
    origin: "*",
    methods: ["GET", "PUT", "POST", "DELETE", "OPTIONS", "PATCH"],
  });
  app.register(rateLimit, {
    max: 60,
    timeWindow: "1 minute",
  });

  app.register(multipart, {
    limits: {
      fileSize: 5 * 1024 * 1024,
    },
  });
  app.register(formBody);

  app.setErrorHandler(handleApiError);
  app.setNotFoundHandler((_req, res) => {
    return res.status(404).send({ ...messages.notFound });
  });

  app.get(
    "/api",
    {
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
    },
    (_req, res) =>
      res.send({ statusCode: 200, message: "The API is available." }),
  );
  app.register(authRoutes, { prefix: "/api/admin" });
  app.register(masterRoutes, { prefix: "/api/master" });
  app.register(fileRoutes, { prefix: "/api/file" });
  app.register(workspaceRoutes, { prefix: "/api/workspace" });
  await app.ready();
  cachedApp = app;
  return app;
}

if (require.main === module) {
  buildApp().then((app) =>
    app.listen(
      { port: +process.env.DEV_PORT! || 7000, host: "127.0.0.1" },
      (err, address) => {
        if (err) {
          app.log.error(err);
          process.exit(1);
        }
        app.log.info({ address }, "Server listening");
      },
    ),
  );
}

const handler = async (req: FastifyRequest, res: FastifyReply) => {
  const app = await buildApp();
  app.server.emit("request", req, res);
};

module.exports = handler;
module.exports.buildApp = buildApp;
