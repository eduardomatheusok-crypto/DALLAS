package com.fittreino.controller;

import com.fittreino.dto.request.AuthRequest;
import com.fittreino.dto.response.AuthResponse;
import com.fittreino.dto.response.UserDto;
import com.fittreino.service.TokenService;
import com.fittreino.service.UserService;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService service;

    public AuthController(UserService service) {
        this.service = service;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody AuthRequest request) {
        AuthResponse res = service.register(request.username(), request.password(), request.deviceId());
        return ResponseEntity.status(HttpStatus.CREATED).body(res);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest request) {
        return ResponseEntity.ok(service.login(request.username(), request.password()));
    }

    @GetMapping("/me")
    public ResponseEntity<UserDto> me(@RequestHeader(HttpHeaders.AUTHORIZATION) String authorization) {
        String token = TokenService.extractToken(authorization);
        if (token == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(service.getByToken(token));
    }
}
