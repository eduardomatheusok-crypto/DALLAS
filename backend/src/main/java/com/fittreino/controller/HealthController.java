package com.fittreino.controller;

import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
@RestController
public class HealthController {

    @GetMapping({"/", ""})
    public Map<String, String> root() {
        return Map.of(
                "status", "ok",
                "service", "dallas-api",
                "health", "/api/health");
    }

    @GetMapping("/api/health")
    public Map<String, String> health() {
        return Map.of("status", "ok");
    }
}