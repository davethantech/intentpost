FROM node:22-bookworm-slim AS base
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force
COPY . .
RUN useradd --system --uid 10001 --create-home appuser && chown -R appuser:appuser /app
USER appuser
EXPOSE 3000
CMD ["node", "server.js"]
