FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json tsconfig.json tsconfig.base.json ./
COPY apps/worker ./apps/worker
COPY db ./db

RUN npm ci
RUN npm run build:worker

FROM node:20-alpine

WORKDIR /app

COPY --from=build /app /app

CMD ["node", "apps/worker/dist/index.js"]
