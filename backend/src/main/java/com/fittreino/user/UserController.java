package com.fittreino.user;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService service;

    public UserController(UserService service) {
        this.service = service;
    }

    @GetMapping("/by-device")
    public UserDto getByDevice(@RequestParam String deviceId) {
        return service.getOrCreateByDevice(deviceId, null);
    }

    @PostMapping("/by-device")
    public ResponseEntity<UserDto> createOrGet(@RequestBody CreateUserRequest request) {
        UserDto dto = service.getOrCreateByDevice(request.deviceId(), request.name());
        return ResponseEntity.status(HttpStatus.OK).body(dto);
    }

    @GetMapping("/{id}")
    public UserDto getById(@PathVariable String id) {
        return service.getById(id);
    }

    @PutMapping("/{id}")
    public UserDto updateName(@PathVariable String id, @RequestBody CreateUserRequest request) {
        return service.updateName(id, request.name());
    }
}
