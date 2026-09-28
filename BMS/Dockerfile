# 1. Use official Node.js LTS image as the base
FROM node:18-alpine

# 2. Set working directory inside the container
WORKDIR /usr/src/app

# 3. Copy package files and install dependencies
COPY package*.json ./
RUN npm install --legacy-peer-deps

# 4. Copy the rest of the source code
COPY . .

# 5. Build the application
RUN npm run build

# 6. Set permissions for the uploads folder
RUN mkdir -p uploads && chown -R node:node /usr/src/app

# 7. Use the non-root 'node' user for security
USER node

# 8. Expose the port
EXPOSE 2546

# 9. Start the application
CMD ["node", "dist/src/main"]