FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json tsconfig.json tsconfig.base.json ./
COPY apps/api ./apps/api
COPY packages ./packages
COPY db ./db

RUN npm ci
RUN npm run build:api

FROM node:20-alpine

WORKDIR /app

COPY --from=build /app /app

EXPOSE 3000

CMD ["sh", "-c", "node apps/api/dist/scripts/migrate.js && node apps/api/dist/server.js"]
