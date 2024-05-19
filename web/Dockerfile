FROM node:18-alpine
WORKDIR /web
COPY web/package.json web/pnpm-lock.yaml ./
COPY web/ ./
RUN npm install -g pnpm && pnpm install

EXPOSE 5173
CMD ["pnpm run dev"]
