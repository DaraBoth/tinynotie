FROM node:16.19.1-alpine
RUN npm install -g pnpm
WORKDIR /app
COPY ["package.json", "pnpm-lock.yaml", "./"]
RUN pnpm install
COPY . .
ENV NODE_ENV=production
EXPOSE 2023
CMD ["pnpm", "run", "dev"]