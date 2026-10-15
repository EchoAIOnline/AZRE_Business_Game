FROM node:24-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY src ./src
COPY web ./web
ENV HOST=0.0.0.0
RUN mkdir data && chown node:node data
USER node
EXPOSE 3101
CMD ["node", "src/cli.js", "serve"]
