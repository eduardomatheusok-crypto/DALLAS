package com.fittreino.repository;

import com.fittreino.model.UserEntity;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface UserRepository extends JpaRepository<UserEntity, String> {
    Optional<UserEntity> findByDeviceId(String deviceId);
    Optional<UserEntity> findByUsername(String username);
    boolean existsByUsername(String username);
}
