# ---- Build Stage ----
    FROM node:18-alpine AS builder
    WORKDIR /app
    
    # Copy package files and install dependencies
    COPY package*.json ./
    RUN npm install
    
    # Copy the rest of your application code
    COPY . .
    
    # Build the Next.js application
    RUN npm run build
    
    # ---- Production Stage ----
    FROM node:18-alpine AS runner
    WORKDIR /app
    
    # Copy the built application from the builder stage
    COPY --from=builder /app . 
    
    # Expose port 3000 to serve the frontend
    EXPOSE 3000
    
    # Start the Next.js server
    CMD ["npm", "start"]
    