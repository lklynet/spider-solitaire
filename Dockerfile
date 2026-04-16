# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Copy workspace manifests so npm can install all workspace deps
COPY package.json package-lock.json tsconfig.json tsconfig.base.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/worker/package.json ./apps/worker/package.json
COPY packages/shared-types/package.json ./packages/shared-types/package.json
COPY packages/game-engine/package.json ./packages/game-engine/package.json

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
