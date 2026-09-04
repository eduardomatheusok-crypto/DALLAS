package com.fittreino.user;

import com.fittreino.config.NotFoundException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.UUID;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final long TOKEN_TTL_MS = 90L * 24 * 60 * 60 * 1000; // 90 dias

    private final UserRepository repository;

    @Value("${app.token.secret:dev-secret-change-me}")
    private String tokenSecret;

    public UserService(UserRepository repository) {
        this.repository = repository;
    }

    // --------- Autenticação ---------

    @Transactional(readOnly = true)
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
        return new AuthResponse(issueToken(saved.getId()), UserDto.from(saved));
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
        return new AuthResponse(issueToken(entity.getId()), UserDto.from(entity));
    }

    @Transactional(readOnly = true)
    public UserDto getByToken(String token) {
        String userId = parseToken(token);
        if (userId == null) {
            throw new NotFoundException("sessão inválida ou expirada");
        }
        return repository.findById(userId)
                .map(UserDto::from)
                .orElseThrow(() -> new NotFoundException("usuário não encontrado"));
    }

    /** Resolve o usuário autenticado a partir de um token. Retorna null se inválido. */
    @Transactional(readOnly = true)
    public UserEntity resolveByToken(String token) {
        String userId = parseToken(token);
        if (userId == null) return null;
        return repository.findById(userId).orElse(null);
    }

    // --------- Compatibilidade com deviceId ---------

    @Transactional(readOnly = true)
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

    // --------- Token (HMAC) ---------

    private String issueToken(String userId) {
        try {
            long issuedAt = System.currentTimeMillis();
            String payload = userId + ":" + issuedAt + ":" + (issuedAt + TOKEN_TTL_MS);
            String sig = hmac(payload);
            return Base64.getUrlEncoder().withoutPadding().encodeToString(payload.getBytes(StandardCharsets.UTF_8))
                    + "." + sig;
        } catch (Exception e) {
            throw new IllegalStateException("falha ao emitir token", e);
        }
    }

    private String parseToken(String token) {
        if (token == null || token.isBlank()) return null;
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 2) return null;
            String payload = new String(Base64.getUrlDecoder().decode(parts[0]), StandardCharsets.UTF_8);
            String expected = hmac(payload);
            if (!MessageDigest.isEqual(expected.getBytes(StandardCharsets.UTF_8),
                    parts[1].getBytes(StandardCharsets.UTF_8))) {
                return null;
            }
            String[] fields = payload.split(":");
            if (fields.length != 3) return null;
            long exp = Long.parseLong(fields[2]);
            if (System.currentTimeMillis() > exp) return null;
            return fields[0];
        } catch (Exception e) {
            return null;
        }
    }

    private String hmac(String value) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(tokenSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return Base64.getUrlEncoder().withoutPadding()
                    .encodeToString(mac.doFinal(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
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