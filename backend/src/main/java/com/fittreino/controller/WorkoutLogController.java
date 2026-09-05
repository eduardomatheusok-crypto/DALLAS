package com.fittreino.controller;

import com.fittreino.dto.request.WorkoutLogRequest;
import com.fittreino.dto.response.WorkoutLogDto;
import com.fittreino.service.CurrentUserResolver;
import com.fittreino.service.WorkoutLogService;

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
    private final CurrentUserResolver currentUser;

    public WorkoutLogController(WorkoutLogService service, CurrentUserResolver currentUser) {
        this.service = service;
        this.currentUser = currentUser;
    }

    @GetMapping
    public List<WorkoutLogDto> getAll(@RequestHeader(org.springframework.http.HttpHeaders.AUTHORIZATION) String authorization) {
        return service.getAll(currentUser.resolveUserId(authorization));
    }

    @GetMapping("/{id}")
    public WorkoutLogDto getById(@PathVariable String id,
                                 @RequestHeader(org.springframework.http.HttpHeaders.AUTHORIZATION) String authorization) {
        return service.getById(id, currentUser.resolveUserId(authorization));
    }

    @PostMapping
    public ResponseEntity<WorkoutLogDto> create(@RequestBody WorkoutLogRequest request,
                                                @RequestHeader(org.springframework.http.HttpHeaders.AUTHORIZATION) String authorization) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(currentUser.resolveUserId(authorization), request));
    }

    @GetMapping("/streak")
    public int getStreak(@RequestHeader(org.springframework.http.HttpHeaders.AUTHORIZATION) String authorization) {
        return service.getStreak(currentUser.resolveUserId(authorization));
    }
}
