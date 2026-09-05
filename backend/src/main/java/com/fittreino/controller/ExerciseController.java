package com.fittreino.controller;

import com.fittreino.dto.request.CreateExerciseRequest;
import com.fittreino.dto.response.ExerciseDto;
import com.fittreino.service.CurrentUserResolver;
import com.fittreino.service.ExerciseService;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
@RestController
@RequestMapping("/api/exercises")
public class ExerciseController {

    private final ExerciseService service;
    private final CurrentUserResolver currentUser;

    public ExerciseController(ExerciseService service, CurrentUserResolver currentUser) {
        this.service = service;
        this.currentUser = currentUser;
    }

    @GetMapping
    public List<ExerciseDto> getAll(@RequestHeader(org.springframework.http.HttpHeaders.AUTHORIZATION) String authorization,
                                    @RequestParam(required = false) String query,
                                    @RequestParam(required = false) String muscleGroup) {
        return service.getAll(currentUser.resolveUserId(authorization), query, muscleGroup);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ExerciseDto> getById(@PathVariable String id,
                                               @RequestHeader(org.springframework.http.HttpHeaders.AUTHORIZATION) String authorization) {
        ExerciseDto dto = service.getById(id, currentUser.resolveUserId(authorization));
        return dto != null ? ResponseEntity.ok(dto) : ResponseEntity.notFound().build();
    }

    @PostMapping
    public ResponseEntity<ExerciseDto> create(@RequestBody CreateExerciseRequest request,
                                              @RequestHeader(org.springframework.http.HttpHeaders.AUTHORIZATION) String authorization) {
        ExerciseDto dto = service.create(currentUser.resolveUserId(authorization), request, true);
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }
}
