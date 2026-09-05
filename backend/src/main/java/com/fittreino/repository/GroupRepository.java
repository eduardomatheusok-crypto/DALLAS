package com.fittreino.repository;

import com.fittreino.model.GroupEntity;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
public interface GroupRepository extends JpaRepository<GroupEntity, String> {
    Optional<GroupEntity> findByInviteCode(String inviteCode);
    List<GroupEntity> findAllByMembersUserIdOrderByCreatedAtDesc(String userId);
}