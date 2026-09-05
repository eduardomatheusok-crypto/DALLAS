FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /build
COPY backend/pom.xml .
COPY backend/src ./src
RUN mvn -q -DskipTests package

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /build/target/fit-treino-api-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]