# Stage 1: Build the application
FROM node:20-slim AS builder

WORKDIR /usr/src/app

COPY package*.json ./

# Install all dependencies (including devDependencies)
RUN npm ci

COPY . .

RUN npm run build

# Stage 2: Production runner
FROM node:20-slim AS runner

WORKDIR /usr/src/app

COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built code from the builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Expose the API port
EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production

CMD ["node", "dist/main"]
