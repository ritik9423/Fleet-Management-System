# Multi-stage build for Spring Boot 3 on Java 17
FROM maven:3.9.9-eclipse-temurin-17-alpine AS build
WORKDIR /app

# Copy root pom and backend pom for dependency caching
COPY pom.xml ./
COPY backend/pom.xml ./backend/
RUN mvn -B -pl backend dependency:go-offline

# Copy backend source and compile
COPY backend/src ./backend/src
RUN mvn -B -pl backend clean package -DskipTests

# Lightweight runtime stage
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Run as non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

COPY --from=build /app/backend/target/fleet-ops-1.0.0.jar app.jar

# Render passes $PORT dynamically (default 8080)
ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java -Djava.security.egd=file:/dev/./urandom -Dserver.port=${PORT:-8080} -jar app.jar"]
