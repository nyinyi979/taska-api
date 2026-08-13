# Working in this API

This repository is a reusable Fastify API template. Follow the existing style,
but use judgment when a project needs a slightly different shape.

## Before changing code

- Read `package.json`, the relevant feature, and nearby shared utilities.
- Check `git status` and preserve unrelated or uncommitted work.
- Do not read or print `.env` files. Infer required configuration from source or
  documented samples, and never expose secrets in logs or responses.
- Prefer focused changes over broad rewrites.

## Feature structure

Most API features use:

```text
src/api/<feature>/
  controllers.ts  # database and domain operations
  handlers.ts     # HTTP request/response orchestration
  routes.ts       # route registration, auth, and OpenAPI metadata
  schemas.ts      # TypeBox schemas and inferred request types
  utils.ts        # optional feature-specific transformations or syncing
```

Keep create, get all, get one, update, and delete functions in that order when
it makes the module easier to scan. Database tables live in separate files
under `src/db`, with relations declared beside their respective tables.

## Conventions

- Use TypeBox schemas for runtime validation and infer request types with
  `Static`; avoid maintaining duplicate request interfaces.
- Reuse shared pagination, UUID, URL, and sorting schemas from `src/api/schemas.ts`.
- Controllers should return data or throw typed application errors. Handlers
  should send one response and let the centralized error handler format errors.
- Protect privileged routes with the appropriate authentication pre-handler.
- Do not return password hashes or other secrets.
- Prefer Drizzle query builders and relation APIs over raw SQL.
- Use UUID primary keys by default unless the domain calls for another key.
- Use transactions for multi-table writes that must succeed together.
- For child collections, update, insert, and delete by ID where practical rather
  than deleting and recreating every row.
- Put file lifecycle logic near the owning feature. Upload temporary paths before
  saving and remove replaced or deleted S3 objects.
- Keep comments for business rules or surprising behavior, not obvious syntax.

## HTTP behavior

- Keep response messages and status codes consistent with `src/api/messages.ts`.
- Use 400 for invalid input, 401 for missing/invalid authentication, 403 for
  insufficient permission, 404 for missing records, and 409 for conflicts.
- Add useful OpenAPI tags, summaries, schemas, and security metadata to routes.
- Pagination uses zero-based `page` and a required `perPage` capped at 100.

## Verification

Run checks that match the scope of the change. For normal source changes:

```bash
npm run typecheck
npm run build
npm run format:check
```

If a check cannot run because infrastructure or configuration is unavailable,
report that clearly instead of weakening validation or inventing credentials.
