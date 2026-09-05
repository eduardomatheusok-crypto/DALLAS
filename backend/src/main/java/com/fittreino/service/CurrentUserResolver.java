package com.fittreino.service;

import com.fittreino.config.NotFoundException;
import com.fittreino.repository.UserRepository;

import org.springframework.stereotype.Component;
@Component
public class CurrentUserResolver {

    private final TokenService tokenService;
    private final UserRepository userRepository;

    public CurrentUserResolver(TokenService tokenService, UserRepository userRepository) {
        this.tokenService = tokenService;
        this.userRepository = userRepository;
    }

    /**
     * Resolve o id do usuário autenticado a partir do cabeçalho Authorization.
     * Lança {@link NotFoundException} se o token for inválido ou o usuário não existir.
     */
    public String resolveUserId(String authorization) {
        String token = TokenService.extractToken(authorization);
        String userId = tokenService.parseToken(token);
        if (userId == null || !userRepository.existsById(userId)) {
            throw new NotFoundException("não autorizado");
        }
        return userId;
    }

    /**
     * Resolve o id do usuário autenticado. Retorna null se inválido (não lança).
     */
    public String resolveUserIdOrNull(String authorization) {
        try {
            return resolveUserId(authorization);
        } catch (NotFoundException e) {
            return null;
        }
    }
}
