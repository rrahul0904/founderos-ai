FROM node:22-alpine
WORKDIR /app
COPY apps/worker/package.json ./package.json
RUN npm install --ignore-scripts
COPY apps/worker/tsconfig.json ./tsconfig.json
COPY apps/worker/src ./src
CMD ["npm", "run", "dev"]
