package com.fittreino.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
@Service
public class TokenService {

    private static final long TOKEN_TTL_MS = 90L * 24 * 60 * 60 * 1000; // 90 dias

    @Value("${app.token.secret:dev-secret-change-me}")
    private String tokenSecret;

    public String issueToken(String userId) {
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

    public String parseToken(String token) {
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

    public static String extractToken(String authorization) {
        if (authorization == null) return null;
        String lower = authorization.toLowerCase();
        if (!lower.startsWith("bearer ")) return null;
        String token = authorization.substring(7).trim();
        return token.isEmpty() ? null : token;
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
}
