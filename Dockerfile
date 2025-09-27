FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN DATABASE_URL="postgres://user:pass@localhost:5432/db" npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app ./



ENV NODE_ENV=production
EXPOSE 3000

# Start the application
CMD ["node", "build"]
