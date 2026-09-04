package com.fittreino.workoutlog;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/workout-logs")
public class WorkoutLogController {

    private final WorkoutLogService service;
    private final com.fittreino.user.UserService userService;

    public WorkoutLogController(WorkoutLogService service, com.fittreino.user.UserService userService) {
        this.service = service;
        this.userService = userService;
    }

    private String userId(String authorization) {
        String token = com.fittreino.user.AuthController.extractToken(authorization);
        var user = userService.resolveByToken(token);
        if (user == null) {
            throw new com.fittreino.config.NotFoundException("não autorizado");
        }
        return user.getId();
    }

    @GetMapping
    public List<WorkoutLogDto> getAll(@RequestHeader(org.springframework.http.HttpHeaders.AUTHORIZATION) String authorization) {
        return service.getAll(userId(authorization));
    }

    @GetMapping("/{id}")
    public WorkoutLogDto getById(@PathVariable String id,
                                 @RequestHeader(org.springframework.http.HttpHeaders.AUTHORIZATION) String authorization) {
        return service.getById(id, userId(authorization));
    }

    @PostMapping
    public ResponseEntity<WorkoutLogDto> create(@RequestBody WorkoutLogRequest request,
                                                @RequestHeader(org.springframework.http.HttpHeaders.AUTHORIZATION) String authorization) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(userId(authorization), request));
    }

    @GetMapping("/streak")
    public int getStreak(@RequestHeader(org.springframework.http.HttpHeaders.AUTHORIZATION) String authorization) {
        return service.getStreak(userId(authorization));
    }
}
