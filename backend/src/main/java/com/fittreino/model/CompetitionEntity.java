package com.fittreino.model;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Competição de um grupo. O status é: PENDING (aguardando início), ACTIVE
 * (ativa) ou FINISHED (finalizada — ranking congelado).
 *
 * Os pesos de pontuação ficam persistidos para permitir ajustes futuros sem
 * código. Defaults: progressão 40%, consistência 30%, volume 20%, metas 10%.
 */
@Entity
@Table(name = "competitions")
public class CompetitionEntity {

    public static final String STATUS_PENDING = "PENDING";
    public static final String STATUS_ACTIVE = "ACTIVE";
    public static final String STATUS_FINISHED = "FINISHED";

    public static final double DEFAULT_PROGRESSION_WEIGHT = 0.40;
    public static final double DEFAULT_CONSISTENCY_WEIGHT = 0.30;
    public static final double DEFAULT_VOLUME_WEIGHT = 0.20;
    public static final double DEFAULT_GOALS_WEIGHT = 0.10;

    @Id
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private GroupEntity group;

    @Column(nullable = false)
    private String ownerId;

    @Column(nullable = false)
    private String name;

    @Column(length = 400)
    private String description;

    @Column(nullable = false)
    private Instant startsAt;

    @Column(nullable = false)
    private Instant endsAt;

    @Column(nullable = false, length = 16)
    private String status = STATUS_PENDING;

    /** Posições premiadas/destacadas; 0 = derivado automaticamente do nº de participantes. */
    @Column(nullable = false)
    private int awardedPositions = 0;

    @Column(nullable = false)
    private double progressionWeight = DEFAULT_PROGRESSION_WEIGHT;

    @Column(nullable = false)
    private double consistencyWeight = DEFAULT_CONSISTENCY_WEIGHT;

    @Column(nullable = false)
    private double volumeWeight = DEFAULT_VOLUME_WEIGHT;

    @Column(nullable = false)
    private double goalsWeight = DEFAULT_GOALS_WEIGHT;

    /** Controle de moderação de eventos no chat. */
    private LocalDate lastDailyEventDate;

    /** Marca se o evento de vencedores já foi postado no chat. */
    @Column(nullable = false)
    private boolean resultEventSent = false;

    @OneToMany(mappedBy = "competition", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("joinedAt ASC")
    private List<CompetitionParticipantEntity> participants = new ArrayList<>();

    @Column(nullable = false)
    private Instant createdAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public GroupEntity getGroup() { return group; }
    public void setGroup(GroupEntity group) { this.group = group; }

    public String getOwnerId() { return ownerId; }
    public void setOwnerId(String ownerId) { this.ownerId = ownerId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Instant getStartsAt() { return startsAt; }
    public void setStartsAt(Instant startsAt) { this.startsAt = startsAt; }

    public Instant getEndsAt() { return endsAt; }
    public void setEndsAt(Instant endsAt) { this.endsAt = endsAt; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public int getAwardedPositions() { return awardedPositions; }
    public void setAwardedPositions(int awardedPositions) { this.awardedPositions = awardedPositions; }

    public double getProgressionWeight() { return progressionWeight; }
    public void setProgressionWeight(double progressionWeight) { this.progressionWeight = progressionWeight; }

    public double getConsistencyWeight() { return consistencyWeight; }
    public void setConsistencyWeight(double consistencyWeight) { this.consistencyWeight = consistencyWeight; }

    public double getVolumeWeight() { return volumeWeight; }
    public void setVolumeWeight(double volumeWeight) { this.volumeWeight = volumeWeight; }

    public double getGoalsWeight() { return goalsWeight; }
    public void setGoalsWeight(double goalsWeight) { this.goalsWeight = goalsWeight; }

    public LocalDate getLastDailyEventDate() { return lastDailyEventDate; }
    public void setLastDailyEventDate(LocalDate lastDailyEventDate) { this.lastDailyEventDate = lastDailyEventDate; }

    public boolean isResultEventSent() { return resultEventSent; }
    public void setResultEventSent(boolean resultEventSent) { this.resultEventSent = resultEventSent; }

    public List<CompetitionParticipantEntity> getParticipants() { return participants; }
    public void setParticipants(List<CompetitionParticipantEntity> participants) { this.participants = participants; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}