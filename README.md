# Taska API

The Taska API is built with Fastify, TypeBox, Drizzle ORM, PostgreSQL, JWT, and
AWS S3. It provides authentication and the complete project/task workspace used
by the Taska React frontend.

## Requirements

- Node.js 20 or newer
- PostgreSQL
- An S3 bucket and AWS credentials for task attachments

Configure `DATABASE_URL`, `JWT_SECRET`, `AWS_REGION`, AWS credentials, and
`S3_BUCKET_NAME` (or `AWS_S3_BUCKET`) through the local environment. Do not
commit secrets.

## Setup

```bash
npm install
npm run db:migrate
npm run dev
```

The development server defaults to `http://127.0.0.1:7000`. Swagger UI is at
`/documentation/`, and protected routes use the `x-access-token` header.

The initial migration creates users, projects, memberships, labels, tasks,
assignees, task labels, subtasks, comments, attachments, notifications, and
activity records. New users can register through `POST /api/admin/register`.

## Commands

```bash
npm run dev
npm run typecheck
npm run build
npm run format:check
npm run db:generate
npm run db:migrate
```

Workspace endpoints are grouped under `/api/workspace`; authentication is under
`/api/admin`; and the authenticated temporary/permanent file pipeline is under
`/api/file`.
