package com.fittreino.workout;

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
    private final com.fittreino.user.UserService userService;

    public WorkoutController(WorkoutService service, com.fittreino.user.UserService userService) {
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
    public List<WorkoutDto> getAll(@RequestHeader(org.springframework.http.HttpHeaders.AUTHORIZATION) String authorization) {
        return service.getAll(userId(authorization));
    }

    @GetMapping("/{id}")
    public WorkoutDto getById(@PathVariable String id,
                              @RequestHeader(org.springframework.http.HttpHeaders.AUTHORIZATION) String authorization) {
        return service.getById(id, userId(authorization));
    }

    @PostMapping
    public ResponseEntity<WorkoutDto> create(@Valid @RequestBody WorkoutRequest request,
                                             @RequestHeader(org.springframework.http.HttpHeaders.AUTHORIZATION) String authorization) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(userId(authorization), request));
    }

    @PutMapping("/{id}")
    public WorkoutDto update(@PathVariable String id, @Valid @RequestBody WorkoutRequest request,
                             @RequestHeader(org.springframework.http.HttpHeaders.AUTHORIZATION) String authorization) {
        return service.update(id, userId(authorization), request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id,
                                       @RequestHeader(org.springframework.http.HttpHeaders.AUTHORIZATION) String authorization) {
        service.delete(id, userId(authorization));
        return ResponseEntity.noContent().build();
    }
}
