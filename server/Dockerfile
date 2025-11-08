FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
COPY src ./src
COPY generated ./generated
COPY .env.example ./.env

ENV NODE_ENV=production \
    PORT=4000 \
    DATABASE_URL="file:./dev.db" \
    FRONTEND_ORIGIN="http://localhost:5173" \
    WORK_HOURS_START="12:00" \
    WORK_HOURS_END="22:00" \
    TIME_SLOT_MINUTES=30

RUN npm install && npm run prisma:generate

EXPOSE 4000

CMD ["sh", "-c", "npm run prisma:seed && node src/index.js"]
