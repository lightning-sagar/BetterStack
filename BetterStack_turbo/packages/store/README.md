# Store package setup

```bash
npm install
```

## Prisma setup

```bash
npm run -w packages/store prisma:generate
```

If your database already exists (for example from the Rust service) and has snake_case columns like `created_at` and `user_id`, pull and sync before running API:

```bash
npm run -w packages/store prisma:pull
npm run -w packages/store prisma:generate
```

If you are using Prisma migrations for this database:

```bash
npm run -w packages/store prisma:deploy
npm run -w packages/store prisma:generate
```