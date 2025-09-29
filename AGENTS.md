# Agent Guidelines for Serengo

## Commands

- **Build**: `pnpm run build`
- **Lint**: `pnpm run lint` (prettier + eslint)
- **Format**: `pnpm run format` (prettier --write)
- **Type check**: `pnpm run check` (svelte-check)
- **Dev server**: `pnpm run dev`
- **Database**: `pnpm run db:start` (docker-compose), `pnpm run db:push` (schema push)

## Important Rules

- **NEVER deploy or perform pnpm commands or run the server unless explicitly asked**

## Code Style

- **Formatting**: Tabs, single quotes, no trailing commas, 100 char width
- **TypeScript**: Strict mode enabled, use explicit types
- **Imports**: External libraries first, then internal ($lib/, $env/)
- **Svelte 5**: Use `$props()`, `$derived()`, `$effect()` runes
- **Error handling**: Throw descriptive errors for missing env vars
- **Naming**: camelCase for variables/functions, PascalCase for components/types
- **CSS**: Custom classes in separate .css files

## Testing

- **No testing framework**: Components are tested manually during development

## Database

- **ORM**: Drizzle ORM with PostgreSQL
- **Migrations**: `pnpm run db:generate` then `pnpm run db:migrate`
