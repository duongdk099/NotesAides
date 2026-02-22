FROM node:20-alpine AS base

WORKDIR /usr/src/app

RUN npm i -g pnpm
COPY package.json ./
# For workspaces, you'd typically need a lockfile, but this works for simple dev Boilerplate
RUN pnpm install

COPY . .

EXPOSE 3000

CMD ["pnpm", "run", "dev"]
