FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run prisma-client:generate
RUN npm run build


# ---------- PRODUCTION STAGE ----------
FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./
# RUN npm install --only=production
RUN npm install

COPY --from=builder /app/build ./build
COPY --from=builder /app/src/prisma-client ./src/prisma-client
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/scripts ./scripts

COPY entrypoint.sh .
RUN chmod +x entrypoint.sh

EXPOSE 8000

CMD ["./entrypoint.sh"]