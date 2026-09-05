package com.fittreino.service;

import com.fittreino.config.NotFoundException;
import com.fittreino.dto.response.AuthResponse;
import com.fittreino.dto.response.UserDto;
import com.fittreino.model.UserEntity;
import com.fittreino.repository.UserRepository;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
@Service
public class UserService {

    private final UserRepository repository;
    private final TokenService tokenService;

    public UserService(UserRepository repository, TokenService tokenService) {
        this.repository = repository;
        this.tokenService = tokenService;
    }

    // --------- Autenticação ---------

    @Transactional
    public AuthResponse register(String username, String password, String deviceId) {
        String uname = normalizeUsername(username);
        if (uname == null) {
            throw new IllegalArgumentException("username é obrigatório");
        }
        if (password == null || password.length() < 4) {
            throw new IllegalArgumentException("senha deve ter ao menos 4 caracteres");
        }
        if (repository.existsByUsername(uname)) {
            throw new IllegalArgumentException("usuario já existe");
        }
        UserEntity entity = new UserEntity();
        entity.setId(UUID.randomUUID().toString());
        entity.setUsername(uname);
        entity.setName(uname);
        entity.setPasswordHash(hash(uname, password));
        entity.setDeviceId(deviceId != null && !deviceId.isBlank() ? deviceId : null);
        entity.setCreatedAt(Instant.now());
        UserEntity saved = repository.save(entity);
        return new AuthResponse(tokenService.issueToken(saved.getId()), UserDto.from(saved));
    }

    @Transactional(readOnly = true)
    public AuthResponse login(String username, String password) {
        String uname = normalizeUsername(username);
        if (uname == null || password == null) {
            throw new IllegalArgumentException("credenciais obrigatórias");
        }
        UserEntity entity = repository.findByUsername(uname)
                .orElseThrow(() -> new NotFoundException("credenciais inválidas"));
        if (!verify(uname, password, entity.getPasswordHash())) {
            throw new NotFoundException("credenciais inválidas");
        }
        return new AuthResponse(tokenService.issueToken(entity.getId()), UserDto.from(entity));
    }

    @Transactional(readOnly = true)
    public UserDto getByToken(String token) {
        String userId = tokenService.parseToken(token);
        if (userId == null) {
            throw new NotFoundException("sessão inválida ou expirada");
        }
        return repository.findById(userId)
                .map(UserDto::from)
                .orElseThrow(() -> new NotFoundException("usuário não encontrado"));
    }

    // --------- Compatibilidade com deviceId ---------

    @Transactional
    public UserDto getOrCreateByDevice(String deviceId, String name) {
        if (deviceId == null || deviceId.isBlank()) {
            throw new IllegalArgumentException("deviceId é obrigatório");
        }
        return repository.findByDeviceId(deviceId)
                .map(UserDto::from)
                .orElseGet(() -> create(deviceId, name != null ? name : "Atleta"));
    }

    @Transactional(readOnly = true)
    public UserDto getById(String id) {
        return repository.findById(id)
                .map(UserDto::from)
                .orElseThrow(() -> new NotFoundException("Usuário não encontrado: " + id));
    }

    @Transactional
    public UserDto updateName(String id, String name) {
        UserEntity entity = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("Usuário não encontrado: " + id));
        if (name != null && !name.isBlank()) {
            entity.setName(name.trim());
        }
        return UserDto.from(repository.save(entity));
    }

    private UserDto create(String deviceId, String name) {
        UserEntity entity = new UserEntity();
        entity.setId(UUID.randomUUID().toString());
        entity.setUsername(deviceId);
        entity.setDeviceId(deviceId);
        entity.setName(name.trim());
        entity.setPasswordHash(hash(deviceId, "device-only"));
        entity.setCreatedAt(Instant.now());
        return UserDto.from(repository.save(entity));
    }

    // --------- Senha (SHA-256 com salt) ---------

    private static String hash(String salt, String password) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest((salt + "::" + password).getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(digest);
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    private static boolean verify(String salt, String password, String hash) {
        String expected = hash(salt, password);
        return MessageDigest.isEqual(expected.getBytes(StandardCharsets.UTF_8),
                hash.getBytes(StandardCharsets.UTF_8));
    }

    private static String normalizeUsername(String username) {
        if (username == null) return null;
        String trimmed = username.trim().toLowerCase();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
