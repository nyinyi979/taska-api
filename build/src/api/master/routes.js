"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const handlers_1 = require("./handlers");
const schemas_1 = require("./schemas");
const masterRoutes = async (app) => {
    app.get("/countries", {
        schema: { tags: ["Master Data"], summary: "List countries" },
        handler: handlers_1.handleGetCountries,
    });
    app.get("/states", {
        schema: {
            tags: ["Master Data"],
            summary: "List states for a country",
            querystring: schemas_1.stateQuerySchema,
        },
        handler: handlers_1.handleGetStates,
    });
    app.get("/cities", {
        schema: {
            tags: ["Master Data"],
            summary: "List cities for a state",
            querystring: schemas_1.cityQuerySchema,
        },
        handler: handlers_1.handleGetCities,
    });
};
exports.default = masterRoutes;
