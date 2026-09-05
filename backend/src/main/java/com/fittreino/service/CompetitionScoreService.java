package com.fittreino.service;

import com.fittreino.model.CompetitionEntity;
import com.fittreino.model.CompetitionParticipantEntity;
import com.fittreino.model.GroupEntity;
import com.fittreino.model.GroupMessageEntity;
import com.fittreino.model.UserEntity;
import com.fittreino.model.WorkoutLogEntity;
import com.fittreino.model.WorkoutLogExerciseEntity;
import com.fittreino.repository.CompetitionParticipantRepository;
import com.fittreino.repository.CompetitionRepository;
import com.fittreino.repository.GroupMessageRepository;
import com.fittreino.repository.UserRepository;
import com.fittreino.repository.WorkoutLogRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Motor de pontuação das competições — isolado para permitir evoluir o modelo
 * sem tocar nos fluxos de grupo/chat.
 *
 * Composição (pesos persistidos na competição, default 40/30/20/10):
 *  - Progressão: melhora relativa do melhor peso por exercício na janela,
 *    comparada ao melhor dos 30 dias anteriores (escala linear 0..1 até +20%).
 *  - Consistência: dias treinados / dias decorridos.
 *  - Volume: volume da janela vs. baseline dos 30 dias anteriores.
 *  - Metas: placeholder determinístico (PRs, exercícios distintos, streak).
 *
 * Total = round(1000 * (wP*p + wC*c + wV*v + wG*g)).
 *
 * Transições automáticas: PENDING→ACTIVE (startsAt) e ACTIVE→FINISHED (endsAt),
 * com eventos no chat moderados (~2 por recálculo + 1 diário de liderança).
 */
@Service
public class CompetitionScoreService {

    private static final int BASELINE_DAYS = 30;
    private static final double FULL_PROGRESSION_PCT = 20.0;
    private static final int MAX_EXTRA_EVENTS_PER_RECALC = 2;
    private static final String SYSTEM_AUTHOR = "DALLAS";

    private final CompetitionRepository competitionRepository;
    private final CompetitionParticipantRepository participantRepository;
    private final WorkoutLogRepository workoutLogRepository;
    private final UserRepository userRepository;
    private final GroupMessageRepository messageRepository;

    public CompetitionScoreService(
            CompetitionRepository competitionRepository,
            CompetitionParticipantRepository participantRepository,
            WorkoutLogRepository workoutLogRepository,
            UserRepository userRepository,
            GroupMessageRepository messageRepository) {
        this.competitionRepository = competitionRepository;
        this.participantRepository = participantRepository;
        this.workoutLogRepository = workoutLogRepository;
        this.userRepository = userRepository;
        this.messageRepository = messageRepository;
    }

    /**
     * Posições destacadas conforme o tamanho do grupo:
     * 2–4 → 1, 5–9 → 2, 10–19 → 3, 20+ → 5. (Regra isolada para mudança simples.)
     */
    public static int defaultAwardedPositions(int participantCount) {
        if (participantCount >= 20) return 5;
        if (participantCount >= 10) return 3;
        if (participantCount >= 5) return 2;
        if (participantCount >= 2) return 1;
        return 0;
    }

    /** Chamado após o log de um treino ser criado. */
    @Transactional
    public void onWorkoutLogCreated(String userId) {
        for (CompetitionEntity c : competitionRepository.findByStatusAndParticipantsUserId(
                CompetitionEntity.STATUS_ACTIVE, userId)) {
            Instant now = Instant.now();
            transition(c, now);
            if (CompetitionEntity.STATUS_ACTIVE.equals(c.getStatus())) {
                recompute(c, userId, now);
            }
        }
    }

    /** Aplica as transições de status e entrega o estado já consistente. */
    @Transactional
    public CompetitionEntity applyTransitions(CompetitionEntity c) {
        transition(c, Instant.now());
        return c;
    }

    private void transition(CompetitionEntity c, Instant now) {
        if (CompetitionEntity.STATUS_PENDING.equals(c.getStatus()) && !now.isBefore(c.getStartsAt())) {
            c.setStatus(CompetitionEntity.STATUS_ACTIVE);
            c.setLastDailyEventDate(null);
            postSystem(c, "🚀 A competição \"" + c.getName() + "\" começou! Bora treinar forte. 💪");
        }
        if (CompetitionEntity.STATUS_ACTIVE.equals(c.getStatus()) && !now.isBefore(c.getEndsAt())) {
            c.setStatus(CompetitionEntity.STATUS_FINISHED);
            recompute(c, null, now);
            if (!c.isResultEventSent()) {
                publishResult(c);
                c.setResultEventSent(true);
            }
        }
        competitionRepository.save(c);
    }

    /** Recálculo completo: escores → ordenação → posições → eventos moderados. */
    private void recompute(CompetitionEntity c, String triggerUserId, Instant now) {
        List<CompetitionParticipantEntity> participants = participantRepository.findByCompetitionId(c.getId());
        if (participants.isEmpty()) {
            return;
        }

        long activeDays = elapsedDays(c.getStartsAt(), now);
        Map<String, Integer> oldPositions = new HashMap<>();
        Map<String, Double> oldProgression = new HashMap<>();
        for (CompetitionParticipantEntity p : participants) {
            oldPositions.put(p.getUserId(), p.getPosition());
            oldProgression.put(p.getUserId(), p.getProgressPct());
            computeScores(c, p, now, activeDays);
        }

        List<CompetitionParticipantEntity> ranked = new ArrayList<>(participants);
        ranked.sort(Comparator.comparingDouble(CompetitionParticipantEntity::getTotalScore).reversed()
                .thenComparing(CompetitionParticipantEntity::getJoinedAt));

        int pos = 1;
        for (CompetitionParticipantEntity p : ranked) {
            p.setPosition(pos);
            p.setLastPosition(oldPositions.getOrDefault(p.getUserId(), 0));
            p.setLastProgressionPct(oldProgression.getOrDefault(p.getUserId(), 0.0));
            pos++;
        }
        participantRepository.saveAll(ranked);

        emitEvents(c, triggerUserId, oldPositions, oldProgression, now);
    }

    private void computeScores(CompetitionEntity c, CompetitionParticipantEntity p, Instant now, long activeDays) {
        Map<String, Double> baseline = bestWeights(p.getUserId(), c.getStartsAt().minus(BASELINE_DAYS, ChronoUnit.DAYS), c.getStartsAt());
        Map<String, Double> window = bestWeights(p.getUserId(), c.getStartsAt(), min(now, c.getEndsAt()));

        List<WorkoutLogEntity> logs = workoutLogRepository.findAllByUserIdAndStartedAtBetweenOrderByStartedAtAsc(
                p.getUserId(), c.getStartsAt(), min(now, c.getEndsAt()));

        double windowVolume = logs.stream().mapToDouble(WorkoutLogEntity::getTotalVolume).sum();
        List<WorkoutLogEntity> baselineLogs = workoutLogRepository.findAllByUserIdAndStartedAtBetweenOrderByStartedAtAsc(
                p.getUserId(), c.getStartsAt().minus(BASELINE_DAYS, ChronoUnit.DAYS), c.getStartsAt());
        double baselineVolume = baselineLogs.stream().mapToDouble(WorkoutLogEntity::getTotalVolume).sum();

        double progression = weightedProgression(baseline, window);
        double consistency = activeDays <= 0 ? 0 : (double) trainedDays(logs) / activeDays;
        double volume = baselineVolume <= 0 ? (windowVolume > 0 ? 1.0 : 0.0)
                : clamp01(windowVolume / baselineVolume);
        double prCount = countPrs(baseline, window);
        int distinctExercises = distinctExercises(logs);
        int streak = currentStreak(p.getUserId(), c.getStartsAt(), now);
        double goals = clamp01((prCount + 0.25 * distinctExercises + 0.05 * streak) / 12.0);

        p.setProgressionScore(round1000(c.getProgressionWeight() * progression));
        p.setConsistencyScore(round1000(c.getConsistencyWeight() * consistency));
        p.setVolumeScore(round1000(c.getVolumeWeight() * volume));
        p.setGoalsScore(round1000(c.getGoalsWeight() * goals));
        p.setTotalScore(p.getProgressionScore() + p.getConsistencyScore() + p.getVolumeScore() + p.getGoalsScore());
        p.setProgressPct(Math.round(progression * FULL_PROGRESSION_PCT * 10.0) / 10.0);
        p.setTrainedDays(trainedDays(logs));
        p.setTotalVolume(Math.round(windowVolume * 10.0) / 10.0);
        p.setPrCount((int) prCount);
    }

    /** Melhor peso realizado por exercício (séries concluídas). */
    private Map<String, Double> bestWeights(String userId, Instant from, Instant to) {
        Map<String, Double> best = new HashMap<>();
        for (WorkoutLogEntity log : workoutLogRepository.findAllByUserIdAndStartedAtBetweenOrderByStartedAtAsc(userId, from, to)) {
            for (WorkoutLogExerciseEntity ex : log.getExercises()) {
                if (ex.getSets() == null) continue;
                for (var set : ex.getSets()) {
                    if (Boolean.TRUE.equals(set.isDone()) && set.getWeight() > 0) {
                        best.merge(ex.getExerciseName(), set.getWeight(), Math::max);
                    }
                }
            }
        }
        return best;
    }

    private double weightedProgression(Map<String, Double> baseline, Map<String, Double> window) {
        if (window.isEmpty()) return 0;
        double sum = 0;
        Set<String> keys = new HashSet<>(window.keySet());
        keys.addAll(baseline.keySet());
        for (String exercise : keys) {
            double w = window.getOrDefault(exercise, 0.0);
            double b = baseline.getOrDefault(exercise, 0.0);
            if (b <= 0) {
                sum += w > 0 ? 1.0 : 0.0;
            } else {
                double improvementPct = (w - b) / b;
                sum += clamp01(improvementPct * 100.0 / FULL_PROGRESSION_PCT);
            }
        }
        return sum / window.keySet().size();
    }

    private long countPrs(Map<String, Double> baseline, Map<String, Double> window) {
        long prs = 0;
        for (Map.Entry<String, Double> e : window.entrySet()) {
            Double b = baseline.get(e.getKey());
            if (b != null && e.getValue() > b) {
                prs++;
            }
        }
        return prs;
    }

    private int trainedDays(List<WorkoutLogEntity> logs) {
        Set<LocalDate> dates = new HashSet<>();
        for (WorkoutLogEntity log : logs) {
            dates.add(log.getStartedAt().atZone(ZoneOffset.UTC).toLocalDate());
        }
        return dates.size();
    }

    private int distinctExercises(List<WorkoutLogEntity> logs) {
        Set<String> names = new HashSet<>();
        for (WorkoutLogEntity log : logs) {
            for (WorkoutLogExerciseEntity ex : log.getExercises()) {
                names.add(ex.getExerciseName());
            }
        }
        return names.size();
    }

    /** Streak atual de dias treinados consecutivos (contado de hoje para trás). */
    private int currentStreak(String userId, Instant start, Instant now) {
        LocalDate today = now.atZone(ZoneOffset.UTC).toLocalDate();
        List<WorkoutLogEntity> logs = workoutLogRepository.findAllByUserIdAndStartedAtBetweenOrderByStartedAtAsc(
                userId, start, now);
        Set<LocalDate> dates = new HashSet<>();
        for (WorkoutLogEntity log : logs) {
            dates.add(log.getStartedAt().atZone(ZoneOffset.UTC).toLocalDate());
        }
        LocalDate cursor = dates.contains(today) ? today : today.minus(1, ChronoUnit.DAYS);
        int streak = 0;
        while (dates.contains(cursor)) {
            streak++;
            cursor = cursor.minus(1, ChronoUnit.DAYS);
        }
        return streak;
    }

    private long elapsedDays(Instant start, Instant now) {
        long days = Math.max(1, ChronoUnit.DAYS.between(
                start.atZone(ZoneOffset.UTC).toLocalDate(),
                now.atZone(ZoneOffset.UTC).toLocalDate()) + 1);
        return days;
    }

    private double clamp01(double v) {
        return Math.max(0.0, Math.min(1.0, v));
    }

    private long round1000(double v) {
        return Math.round(v * 1000.0);
    }

    private Instant min(Instant a, Instant b) {
        return a.isBefore(b) ? a : b;
    }

    // ---------------------------------------------------------------- eventos

    private void emitEvents(CompetitionEntity c, String triggerUserId,
                            Map<String, Integer> oldPositions,
                            Map<String, Double> oldProgression,
                            Instant now) {
        List<CompetitionParticipantEntity> ranked = participantRepository.findByCompetitionIdOrderByTotalScoreDescJoinedAtAsc(c.getId());
        if (ranked.isEmpty()) return;

        List<String> messages = new ArrayList<>(1);

        LocalDate today = now.atZone(ZoneOffset.UTC).toLocalDate();
        if (!today.equals(c.getLastDailyEventDate())) {
            CompetitionParticipantEntity leader = ranked.get(0);
            UserEntity leaderUser = userRepository.findById(leader.getUserId()).orElse(null);
            if (leaderUser != null && leader.getTotalScore() > 0) {
                messages.add("🏆 " + displayName(leaderUser) + " assumiu a liderança com "
                        + leader.getTotalScore() + " pts! Bora reagir? 🔥");
                c.setLastDailyEventDate(today);
            }
        }

        if (triggerUserId != null) {
            CompetitionParticipantEntity p = ranked.stream()
                    .filter(x -> x.getUserId().equals(triggerUserId))
                    .findFirst().orElse(null);
            if (p != null && p.getTotalScore() > 0) {
                int extras = 0;
                if (p.getLastPosition() > 0 && p.getPosition() < p.getLastPosition()
                        && extras < MAX_EXTRA_EVENTS_PER_RECALC) {
                    UserEntity u = userRepository.findById(p.getUserId()).orElse(null);
                    if (u != null) {
                        messages.add("⬆️ " + displayName(u) + " subiu para #" + p.getPosition() + "!");
                        extras++;
                    }
                }
                if (p.getProgressPct() - p.getLastProgressionPct() >= 5.0 && extras < MAX_EXTRA_EVENTS_PER_RECALC) {
                    UserEntity u = userRepository.findById(p.getUserId()).orElse(null);
                    if (u != null) {
                        messages.add("🔥 " + displayName(u) + " deu um salto de evolução: +"
                                + String.format("%.1f", p.getProgressPct()) + "%!");
                        extras++;
                    }
                }
            }
        }

        for (String text : messages) {
            postSystem(c, text);
        }
    }

    private void publishResult(CompetitionEntity c) {
        List<CompetitionParticipantEntity> ranked = participantRepository.findByCompetitionIdOrderByTotalScoreDescJoinedAtAsc(c.getId());
        if (ranked.isEmpty()) return;
        int top = c.getAwardedPositions() > 0
                ? Math.min(c.getAwardedPositions(), ranked.size())
                : Math.min(3, ranked.size());
        StringBuilder sb = new StringBuilder("🏁 Competição \"" + c.getName() + "\" encerrada! ");
        String[] medals = {"🥇", "🥈", "🥉", "🏅", "🏅", "🏅", "🏅", "🏅"};
        for (int i = 0; i < top; i++) {
            CompetitionParticipantEntity p = ranked.get(i);
            UserEntity u = userRepository.findById(p.getUserId()).orElse(null);
            if (u == null) continue;
            sb.append(medals[Math.min(i, medals.length - 1)])
              .append(" ").append(displayName(u)).append(" (").append(p.getTotalScore()).append(" pts) ");
        }
        postSystem(c, sb.toString().trim());
    }

    private UserEntity findUser(CompetitionParticipantEntity p) {
        return userRepository.findById(p.getUserId()).orElse(null);
    }

    private void postSystem(CompetitionEntity c, String text) {
        GroupMessageEntity m = new GroupMessageEntity();
        m.setId(UUID.randomUUID().toString());
        m.setGroup(c.getGroup());
        m.setUserId(null);
        m.setAuthorName(SYSTEM_AUTHOR);
        m.setText(text);
        m.setSystem(true);
        m.setSentAt(Instant.now());
        messageRepository.save(m);
    }

    private String displayName(UserEntity u) {
        if (u.getName() != null && !u.getName().isBlank()) {
            return u.getName();
        }
        return u.getUsername();
    }
}