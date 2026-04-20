FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./
# RUN npm install
RUN npm ci

COPY . .

RUN npm run prisma-client:generate
RUN npm run build


# ---------- PRODUCTION STAGE ----------
FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache openssl

# Use non-root user (security)
RUN addgroup -S app && adduser -S app -G app

COPY package*.json ./
# RUN npm install --only=production
# RUN npm install
RUN npm ci --omit=dev

COPY --from=builder /app/build ./build
COPY --from=builder /app/src/prisma-client ./src/prisma-client
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/scripts ./scripts
COPY entrypoint.sh .

RUN chmod +x entrypoint.sh

USER app

EXPOSE 8000

CMD ["./entrypoint.sh"]