import { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import {
  handleGetCities,
  handleGetCountries,
  handleGetStates,
} from "./handlers";
import { cityQuerySchema, stateQuerySchema } from "./schemas";

const masterRoutes: FastifyPluginAsyncTypebox = async (app) => {
  app.get("/countries", {
    schema: { tags: ["Master Data"], summary: "List countries" },
    handler: handleGetCountries,
  });
  app.get("/states", {
    schema: {
      tags: ["Master Data"],
      summary: "List states for a country",
      querystring: stateQuerySchema,
    },
    handler: handleGetStates,
  });
  app.get("/cities", {
    schema: {
      tags: ["Master Data"],
      summary: "List cities for a state",
      querystring: cityQuerySchema,
    },
    handler: handleGetCities,
  });
};

export default masterRoutes;
