FROM node:22-alpine
RUN apk add --no-cache git docker-cli
WORKDIR /app
COPY apps/build-worker/package.json ./package.json
RUN npm install --ignore-scripts
COPY apps/build-worker/tsconfig.json ./tsconfig.json
COPY apps/build-worker/src ./src
CMD ["npm", "run", "dev"]
