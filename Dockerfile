FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN DATABASE_URL="postgres://user:pass@localhost:5432/db" npm run build
# DATABASE_URL is only needed at build time for Prisma to generate the client. It is not needed at runtime and will be replaced by the hosted neon database.
FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app ./

ENV NODE_ENV=production
EXPOSE 3000

# Start the application
CMD ["node", "build"]
