FROM node:20-alpine

WORKDIR /app

# Install full dependencies (including dev) so we can run migrations at container start
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source
COPY . .

# Build client into server/public and bundle server
RUN npm run build:prod

EXPOSE 8080

# At runtime: run migrations (drizzle-kit push) then start the compiled server
ENV PORT=8080
CMD ["sh", "-c", "npx drizzle-kit push || true && node dist/index.js"]
