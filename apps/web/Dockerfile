FROM node:22-slim AS base
RUN corepack enable

FROM base AS build
WORKDIR /app
COPY . .
RUN npm install
RUN npx turbo run build --filter=@titan/web

FROM base
WORKDIR /app
COPY --from=build /app/apps/web/dist ./dist
RUN npm install -g serve
EXPOSE 5173
CMD ["serve", "-s", "dist", "-l", "5173"]
