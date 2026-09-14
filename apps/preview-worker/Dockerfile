FROM mcr.microsoft.com/playwright:v1.55.0-noble
WORKDIR /app
COPY apps/preview-worker/package.json ./package.json
RUN npm install --ignore-scripts
COPY apps/preview-worker/tsconfig.json ./tsconfig.json
COPY apps/preview-worker/src ./src
CMD ["npm", "run", "dev"]
