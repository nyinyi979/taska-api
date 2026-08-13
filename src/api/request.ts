import { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import {
  FastifyBaseLogger,
  FastifyRequest,
  RawRequestDefaultExpression,
  RawServerDefault,
} from "fastify";
import { RouteGenericInterface } from "fastify/types/route";
import { FastifySchema } from "fastify/types/schema";

export type TypeBoxRequest<TSchema extends FastifySchema> = FastifyRequest<
  RouteGenericInterface,
  RawServerDefault,
  RawRequestDefaultExpression<RawServerDefault>,
  TSchema,
  TypeBoxTypeProvider,
  unknown,
  FastifyBaseLogger
>;
