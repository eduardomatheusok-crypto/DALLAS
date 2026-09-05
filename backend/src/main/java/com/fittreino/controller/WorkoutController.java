package com.fittreino.controller;

import com.fittreino.dto.request.WorkoutRequest;
import com.fittreino.dto.response.WorkoutDto;
import com.fittreino.service.CurrentUserResolver;
import com.fittreino.service.WorkoutService;

import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
@RestController
@RequestMapping("/api/workouts")
public class WorkoutController {

    private final WorkoutService service;
    private final CurrentUserResolver currentUser;

    public WorkoutController(WorkoutService service, CurrentUserResolver currentUser) {
        this.service = service;
        this.currentUser = currentUser;
    }

    @GetMapping
    public List<WorkoutDto> getAll(@RequestHeader(org.springframework.http.HttpHeaders.AUTHORIZATION) String authorization) {
        return service.getAll(currentUser.resolveUserId(authorization));
    }

    @GetMapping("/{id}")
    public WorkoutDto getById(@PathVariable String id,
                              @RequestHeader(org.springframework.http.HttpHeaders.AUTHORIZATION) String authorization) {
        return service.getById(id, currentUser.resolveUserId(authorization));
    }

    @PostMapping
    public ResponseEntity<WorkoutDto> create(@Valid @RequestBody WorkoutRequest request,
                                             @RequestHeader(org.springframework.http.HttpHeaders.AUTHORIZATION) String authorization) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(currentUser.resolveUserId(authorization), request));
    }

    @PutMapping("/{id}")
    public WorkoutDto update(@PathVariable String id, @Valid @RequestBody WorkoutRequest request,
                             @RequestHeader(org.springframework.http.HttpHeaders.AUTHORIZATION) String authorization) {
        return service.update(id, currentUser.resolveUserId(authorization), request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id,
                                       @RequestHeader(org.springframework.http.HttpHeaders.AUTHORIZATION) String authorization) {
        service.delete(id, currentUser.resolveUserId(authorization));
        return ResponseEntity.noContent().build();
    }
}
