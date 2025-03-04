# ---- Build Stage ----
    FROM golang:1.22-alpine AS builder
    WORKDIR /app
    
    # Copy go.mod (and go.sum if available) to download dependencies
    COPY go.mod go.sum ./
    RUN go mod download
    
    # Copy the rest of the source code
    COPY . .
    
    # Move migrations folder to the expected path (from /app/app/db/migrations to /app/db/migrations)
    RUN mkdir -p /app/db && mv /app/app/db/migrations /app/db/migrations
    
    # Build the binary; adjust the main file path if necessary.
    RUN CGO_ENABLED=0 GOOS=linux go build -o social_network ./main.go
    
    # ---- Run Stage ----
    FROM alpine:latest
    WORKDIR /app
    # Copy the compiled binary from the builder stage
    COPY --from=builder /app/social_network .
    # Copy the migrations folder to /app/db/migrations
    COPY --from=builder /app/db/migrations /app/db/migrations
    
    # Expose the port your backend listens on
    EXPOSE 8080
    
    # Run the backend server
    CMD ["./social_network"]
    