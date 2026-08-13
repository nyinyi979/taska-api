import { FastifyReply, FastifyRequest } from "fastify";
import { countryData } from "../../data";
import { NotFoundError } from "../../utils/errors";
import { TypeBoxRequest } from "../request";
import { cityQuerySchema, stateQuerySchema } from "./schemas";

export const handleGetCountries = (_req: FastifyRequest, res: FastifyReply) => {
  return res.status(200).send({ data: Object.keys(countryData) });
};

export const handleGetStates = (
  req: TypeBoxRequest<{ querystring: typeof stateQuerySchema }>,
  res: FastifyReply,
) => {
  const { country } = req.query;
  const countryEntry = countryData[country];
  if (!countryEntry)
    throw new NotFoundError(`Country "${country}" was not found.`);

  return res.status(200).send({ data: Object.keys(countryEntry) });
};

export const handleGetCities = (
  req: TypeBoxRequest<{ querystring: typeof cityQuerySchema }>,
  res: FastifyReply,
) => {
  const { state, country } = req.query;
  const countryEntry = countryData[country];
  if (!countryEntry)
    throw new NotFoundError(`Country "${country}" was not found.`);
  if (!Object.prototype.hasOwnProperty.call(countryEntry, state)) {
    throw new NotFoundError(`State "${state}" was not found in ${country}.`);
  }

  return res.status(200).send({ data: countryEntry[state] });
};
