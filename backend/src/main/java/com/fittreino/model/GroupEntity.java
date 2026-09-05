package com.fittreino.model;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Grupo de treinamento. O criador é o administrador (OWNER) e pode criar
 * competições. A entrada de novos membros é feita por código de convite ou
 * por id quando já conhecido.
 */
@Entity
@Table(name = "groups")
public class GroupEntity {

    public static final String ROLE_OWNER = "OWNER";
    public static final String ROLE_MEMBER = "MEMBER";

    @Id
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(length = 300)
    private String description;

    /** Emoji/ícone escolhido para o grupo (avatar leve). */
    @Column(nullable = false, length = 16)
    private String icon = "🏋️";

    /** Código de convite com 6 caracteres. */
    @Column(nullable = false, unique = true, length = 8)
    private String inviteCode;

    @Column(nullable = false)
    private String ownerId;

    @OneToMany(mappedBy = "group", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("joinedAt ASC")
    private List<GroupMemberEntity> members = new ArrayList<>();

    @Column(nullable = false)
    private Instant createdAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }

    public String getInviteCode() { return inviteCode; }
    public void setInviteCode(String inviteCode) { this.inviteCode = inviteCode; }

    public String getOwnerId() { return ownerId; }
    public void setOwnerId(String ownerId) { this.ownerId = ownerId; }

    public List<GroupMemberEntity> getMembers() { return members; }
    public void setMembers(List<GroupMemberEntity> members) { this.members = members; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}