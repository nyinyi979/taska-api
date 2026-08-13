import { Static, Type } from "@fastify/type-provider-typebox";

export const stateQuerySchema = Type.Object({
  country: Type.String({ minLength: 1 }),
});
export const cityQuerySchema = Type.Object({
  country: Type.String({ minLength: 1 }),
  state: Type.String({ minLength: 1 }),
});

export type StateQuery = Static<typeof stateQuerySchema>;
export type CityQuery = Static<typeof cityQuerySchema>;
