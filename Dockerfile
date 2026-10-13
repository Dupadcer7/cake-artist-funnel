FROM oven/bun:1.3.10 AS build
WORKDIR /app
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile || bun install
COPY . .
RUN bun run build

FROM oven/bun:1.3.10-slim
WORKDIR /app
ENV NODE_ENV=production PORT=3000 DATA_DIR=/data UPLOAD_DIR=/data/uploads DIST_DIR=/app/dist
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/server ./server
COPY --from=build /app/dist ./dist
COPY --from=build /app/client/src/assets ./client/src/assets
RUN mkdir -p /data/uploads
EXPOSE 3000
CMD ["bun", "server/src/server.ts"]
