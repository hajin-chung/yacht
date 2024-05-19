FROM node:18-alpine
WORKDIR /web
COPY . .
RUN npm install -g pnpm && pnpm install

EXPOSE 5173
CMD ["pnpm run dev"]
