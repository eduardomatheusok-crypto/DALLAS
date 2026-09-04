package com.fittreino.exercise;

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
    private final com.fittreino.user.UserService userService;

    public ExerciseController(ExerciseService service, com.fittreino.user.UserService userService) {
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
    public List<ExerciseDto> getAll(@RequestHeader(org.springframework.http.HttpHeaders.AUTHORIZATION) String authorization,
                                    @RequestParam(required = false) String query,
                                    @RequestParam(required = false) String muscleGroup) {
        return service.getAll(userId(authorization), query, muscleGroup);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ExerciseDto> getById(@PathVariable String id,
                                               @RequestHeader(org.springframework.http.HttpHeaders.AUTHORIZATION) String authorization) {
        ExerciseDto dto = service.getById(id, userId(authorization));
        return dto != null ? ResponseEntity.ok(dto) : ResponseEntity.notFound().build();
    }

    @PostMapping
    public ResponseEntity<ExerciseDto> create(@RequestBody CreateExerciseRequest request,
                                              @RequestHeader(org.springframework.http.HttpHeaders.AUTHORIZATION) String authorization) {
        ExerciseDto dto = service.create(userId(authorization), request, true);
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }
}
