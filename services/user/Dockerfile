FROM oven/bun:1-alpine
RUN apk add --no-cache libpq
WORKDIR /app
COPY package.json ./
RUN bun install
COPY . .
EXPOSE 3001
CMD ["bun", "run", "services/user/index.ts"]
