package com.fittreino;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class BackendIntegrationTest {

    @Autowired
    private MockMvc mvc;

    private final ObjectMapper om = new ObjectMapper();

    private static int seq = 0;

    private String registerAndGetToken(String suffix) throws Exception {
        seq++;
        String username = "atleta" + suffix + "-" + seq;
        String res = mvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "%s",
                                  "password": "senha123"
                                }
                                """.formatted(username)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andReturn().getResponse().getContentAsString();
        return om.readTree(res).get("token").asText();
    }

    private String bearer(String token) {
        return "Bearer " + token;
    }

    @Test
    void healthDisponivel() throws Exception {
        mvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ok"));
    }

    @Test
    void registroLoginEMe() throws Exception {
        String token = registerAndGetToken("login");

        mvc.perform(get("/api/auth/me")
                        .header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("atleta" + "login" + "-1"));

        mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "atletalogin-1",
                                  "password": "senha123"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty());
    }

    @Test
    void meComHeaderInvalidoRetorna401() throws Exception {
        mvc.perform(get("/api/auth/me")
                        .header(HttpHeaders.AUTHORIZATION, "Basic credenciais-invalidas"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void recursoProtegidoSemTokenValidoRetorna404() throws Exception {
        mvc.perform(get("/api/workouts")
                        .header(HttpHeaders.AUTHORIZATION, "Basic credenciais-invalidas"))
                .andExpect(status().isNotFound());
    }

    @Test
    void listaExerciciosSeedEBase() throws Exception {
        String token = registerAndGetToken("exerc");

        String res = mvc.perform(get("/api/exercises")
                        .header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode arr = om.readTree(res);
        org.junit.jupiter.api.Assertions.assertTrue(arr.isArray());
        org.junit.jupiter.api.Assertions.assertTrue(arr.size() > 0, "exercícios seed devem existir");

        String created = mvc.perform(post("/api/exercises")
                        .header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Agachamento Hack",
                                  "muscleGroup": "Pernas"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.custom").value(true))
                .andExpect(jsonPath("$.name").value("Agachamento Hack"))
                .andReturn().getResponse().getContentAsString();

        String id = om.readTree(created).get("id").asText();

        mvc.perform(get("/api/exercises/" + id)
                        .header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Agachamento Hack"));
    }

    @Test
    void cicloCompletoWorkout() throws Exception {
        String token = registerAndGetToken("workout");

        String created = mvc.perform(post("/api/workouts")
                        .header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Treino A",
                                  "exercises": [
                                    {
                                      "exerciseId": "ex-padrao-1",
                                      "order": 1,
                                      "plannedSets": 3,
                                      "plannedReps": 10,
                                      "initialWeight": 20.0,
                                      "warmupSets": 2,
                                      "preparationSets": 1,
                                      "workingSets": 3
                                    }
                                  ]
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Treino A"))
                .andExpect(jsonPath("$.exercises[0].plannedSets").value(3))
                .andReturn().getResponse().getContentAsString();

        String id = om.readTree(created).get("id").asText();

        mvc.perform(get("/api/workouts/" + id)
                        .header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id));

        mvc.perform(put("/api/workouts/" + id)
                        .header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Treino A (atualizado)",
                                  "exercises": [
                                    {
                                      "exerciseId": "ex-padrao-2",
                                      "order": 1,
                                      "plannedSets": 4,
                                      "plannedReps": 8
                                    }
                                  ]
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Treino A (atualizado)"));

        mvc.perform(delete("/api/workouts/" + id)
                        .header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isNoContent());

        mvc.perform(get("/api/workouts/" + id)
                        .header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isNotFound());
    }

    @Test
    void cicloCompletoWorkoutLog() throws Exception {
        String token = registerAndGetToken("log");

        String created = mvc.perform(post("/api/workout-logs")
                        .header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "workoutId": "w-1",
                                  "workoutName": "Treino A",
                                  "startedAt": "2026-09-05T10:00:00Z",
                                  "finishedAt": "2026-09-05T11:00:00Z",
                                  "exercises": [
                                    {
                                      "exerciseId": "ex-1",
                                      "exerciseName": "Supino reto",
                                      "muscleGroup": "Peito",
                                      "order": 1,
                                      "plannedSets": 3,
                                      "plannedReps": 10,
                                      "done": true,
                                      "sets": [
                                        {
                                          "id": "set-1",
                                          "setNumber": 1,
                                          "weight": 20.0,
                                          "reps": 10,
                                          "done": true,
                                          "type": "normal"
                                        }
                                      ]
                                    }
                                  ]
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.workoutName").value("Treino A"))
                .andExpect(jsonPath("$.totalVolume").value(200.0))
                .andReturn().getResponse().getContentAsString();

        String id = om.readTree(created).get("id").asText();

        mvc.perform(get("/api/workout-logs")
                        .header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].totalVolume").value(200.0));

        mvc.perform(get("/api/workout-logs/" + id)
                        .header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id));

        mvc.perform(get("/api/workout-logs/streak")
                        .header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isNumber());
    }
}