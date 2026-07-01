# syntax=docker/dockerfile:1
# --- Build Stage ---
FROM maven:3.8.5-openjdk-17 AS build
WORKDIR /app
COPY notifications/pom.xml .
RUN mvn dependency:go-offline -B
COPY notifications/src ./src
RUN mvn package -DskipTests

# --- Run Stage ---
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8082
ENTRYPOINT ["java", "-jar", "app.jar"]
