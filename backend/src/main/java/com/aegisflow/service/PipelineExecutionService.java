package com.aegisflow.service;

import com.aegisflow.domain.Pipeline;
import com.aegisflow.domain.PipelineLog;
import com.aegisflow.domain.PipelineStage;
import com.aegisflow.domain.Project;
import com.aegisflow.repository.PipelineLogRepository;
import com.aegisflow.repository.PipelineRepository;
import com.aegisflow.repository.PipelineStageRepository;
import com.aegisflow.repository.ProjectRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
public class PipelineExecutionService {

    private static final List<String> STAGE_NAMES = List.of(
            "Code", "Build", "Test", "SAST", "Dependency Scan",
            "Docker Build", "Container Scan", "Kubernetes Deploy", "Production");
    private static final Set<String> TERMINAL_STAGE_STATUSES = Set.of("PASSED", "FAILED", "SKIPPED", "CANCELLED");
    private static final Set<String> TERMINAL_RUN_STATUSES = Set.of("SUCCESS", "FAILED", "CANCELLED");
    private static final int MAX_MESSAGE_LENGTH = 4000;

    private final PipelineRepository pipelineRepository;
    private final PipelineStageRepository stageRepository;
    private final PipelineLogRepository logRepository;
    private final ProjectRepository projectRepository;

    public PipelineExecutionService(PipelineRepository pipelineRepository,
                                    PipelineStageRepository stageRepository,
                                    PipelineLogRepository logRepository,
                                    ProjectRepository projectRepository) {
        this.pipelineRepository = pipelineRepository;
        this.stageRepository = stageRepository;
        this.logRepository = logRepository;
        this.projectRepository = projectRepository;
    }

    @Transactional
    public Pipeline createRun(Map<String, Object> request, String triggerSource, Jwt jwt) {
        Project project = resolveProject(request);
        ensureManageAccess(project, jwt);
        if (project.isArchived()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cannot run a pipeline for an archived project");
        }
        String name = boundedText(request, "name", "CI/CD", 150);
        String branch = boundedText(request, "branch", "main", 100);
        String commit = boundedText(request, "commit", null, 50);
        LocalDateTime now = LocalDateTime.now();
        Pipeline pipeline = new Pipeline(name, branch, commit, "QUEUED", project, triggerSource);
        pipeline.setCreatedAt(now);
        pipeline.setUpdatedAt(now);
        pipeline = pipelineRepository.save(pipeline);
        for (String stageName : STAGE_NAMES) {
            stageRepository.save(new PipelineStage(stageName, "PENDING", pipeline));
        }
        appendLog(pipeline, "INFO", "Run queued from " + triggerSource.toLowerCase(Locale.ROOT) + " trigger");
        return findPipeline(pipeline.getId());
    }

    @Transactional
    public Pipeline retryRun(Long pipelineId, Jwt jwt) {
        Pipeline original = findPipeline(pipelineId);
        ensureManageAccess(original.getProject(), jwt);
        return createRun(Map.of(
                "projectId", original.getProject().getId(),
                "name", original.getName(),
                "branch", original.getBranch(),
                "commit", original.getCommitHash() == null ? "" : original.getCommitHash()), "MANUAL", jwt);
    }

    @Transactional
    public Pipeline updateStage(Long pipelineId, Long stageId, String requestedStatus, String logMessage, Jwt jwt) {
        Pipeline pipeline = findPipeline(pipelineId);
        ensureManageAccess(pipeline.getProject(), jwt);
        ensureRunActive(pipeline);
        PipelineStage stage = stageRepository.findById(stageId)
                .filter(candidate -> candidate.getPipeline().getId().equals(pipelineId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pipeline stage not found"));
        String status = normalizeStatus(requestedStatus);
        LocalDateTime now = LocalDateTime.now();

        switch (status) {
            case "RUNNING" -> startStage(pipeline, stage, now);
            case "PASSED", "FAILED" -> finishStage(pipeline, stage, status, now);
            case "SKIPPED" -> skipStage(pipeline, stage, now);
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Stage status must be RUNNING, PASSED, FAILED, or SKIPPED");
        }
        if (logMessage != null && !logMessage.isBlank()) {
            appendLog(pipeline, "INFO", boundedMessage(logMessage));
        }
        updateRunStatus(pipeline, now);
        pipeline.setUpdatedAt(now);
        pipelineRepository.save(pipeline);
        return findPipeline(pipelineId);
    }

    @Transactional
    public PipelineLog appendRunnerLog(Long pipelineId, String level, String message, Jwt jwt) {
        Pipeline pipeline = findPipeline(pipelineId);
        ensureManageAccess(pipeline.getProject(), jwt);
        ensureRunActive(pipeline);
        String normalizedLevel = level == null ? "INFO" : level.trim().toUpperCase(Locale.ROOT);
        if (!Set.of("INFO", "WARN", "ERROR", "DEBUG").contains(normalizedLevel)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Log level must be INFO, WARN, ERROR, or DEBUG");
        }
        return logRepository.save(new PipelineLog(pipeline, normalizedLevel, boundedMessage(message)));
    }

    @Transactional
    public Pipeline cancelRun(Long pipelineId, Jwt jwt) {
        Pipeline pipeline = findPipeline(pipelineId);
        ensureManageAccess(pipeline.getProject(), jwt);
        ensureRunActive(pipeline);
        LocalDateTime now = LocalDateTime.now();
        List<PipelineStage> stages = stageRepository.findAllByPipeline_IdOrderByIdAsc(pipelineId);
        for (PipelineStage stage : stages) {
            if (!TERMINAL_STAGE_STATUSES.contains(stage.getStatus().toUpperCase(Locale.ROOT))) {
                finishStage(stage, "CANCELLED", now);
            }
        }
        finishRun(pipeline, "CANCELLED", now);
        appendLog(pipeline, "WARN", "Run cancelled");
        pipelineRepository.save(pipeline);
        return findPipeline(pipelineId);
    }

    @Transactional(readOnly = true)
    public List<PipelineLog> getLogs(Long pipelineId) {
        findPipeline(pipelineId);
        return logRepository.findAllByPipeline_IdOrderByCreatedAtAscIdAsc(pipelineId);
    }

    private void startStage(Pipeline pipeline, PipelineStage stage, LocalDateTime now) {
        if (!"PENDING".equalsIgnoreCase(stage.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only pending stages can be started");
        }
        List<PipelineStage> stages = stageRepository.findAllByPipeline_IdOrderByIdAsc(pipeline.getId());
        int stageIndex = -1;
        for (int index = 0; index < stages.size(); index++) {
            if (stages.get(index).getId().equals(stage.getId())) {
                stageIndex = index;
                break;
            }
        }
        if (stageIndex < 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Pipeline stage not found");
        }
        boolean priorStagesComplete = stages.subList(0, stageIndex).stream()
                .allMatch(prior -> Set.of("PASSED", "SKIPPED").contains(prior.getStatus().toUpperCase(Locale.ROOT)));
        boolean anotherStageRunning = stages.stream()
                .anyMatch(candidate -> "RUNNING".equalsIgnoreCase(candidate.getStatus()));
        if (!priorStagesComplete || anotherStageRunning) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Stages must run sequentially");
        }
        stage.setStatus("RUNNING");
        stage.setStartedAt(now);
        stage.setEndedAt(null);
        stage.setDurationSeconds(null);
        if (pipeline.getStartedAt() == null) pipeline.setStartedAt(now);
        pipeline.setStatus("RUNNING");
        appendLog(pipeline, "INFO", "Stage started: " + stage.getName());
    }

    private void finishStage(Pipeline pipeline, PipelineStage stage, String status, LocalDateTime now) {
        if (!"RUNNING".equalsIgnoreCase(stage.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only running stages can finish");
        }
        finishStage(stage, status, now);
        appendLog(pipeline, "FAILED".equals(status) ? "ERROR" : "INFO",
                "Stage " + status.toLowerCase(Locale.ROOT) + ": " + stage.getName());
        if ("FAILED".equals(status)) {
            List<PipelineStage> stages = stageRepository.findAllByPipeline_IdOrderByIdAsc(pipeline.getId());
            boolean afterFailedStage = false;
            for (PipelineStage following : stages) {
                if (following.getId().equals(stage.getId())) {
                    afterFailedStage = true;
                    continue;
                }
                if (afterFailedStage && "PENDING".equalsIgnoreCase(following.getStatus())) {
                    skipStage(following, now);
                }
            }
            appendLog(pipeline, "WARN", "Remaining pending stages skipped after failure");
        }
    }

    private void skipStage(Pipeline pipeline, PipelineStage stage, LocalDateTime now) {
        if (!"PENDING".equalsIgnoreCase(stage.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only pending stages can be skipped");
        }
        List<PipelineStage> stages = stageRepository.findAllByPipeline_IdOrderByIdAsc(pipeline.getId());
        int stageIndex = -1;
        for (int index = 0; index < stages.size(); index++) {
            if (stages.get(index).getId().equals(stage.getId())) {
                stageIndex = index;
                break;
            }
        }
        if (stageIndex < 0 || stages.subList(0, stageIndex).stream()
                .anyMatch(prior -> !TERMINAL_STAGE_STATUSES.contains(prior.getStatus().toUpperCase(Locale.ROOT)))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Stages must be completed in order");
        }
        skipStage(stage, now);
        appendLog(pipeline, "INFO", "Stage skipped: " + stage.getName());
    }

    private void updateRunStatus(Pipeline pipeline, LocalDateTime now) {
        List<PipelineStage> stages = stageRepository.findAllByPipeline_IdOrderByIdAsc(pipeline.getId());
        if (stages.stream().anyMatch(stage -> "FAILED".equalsIgnoreCase(stage.getStatus()))) {
            finishRun(pipeline, "FAILED", now);
        } else if (stages.stream().allMatch(stage ->
                Set.of("PASSED", "SKIPPED").contains(stage.getStatus().toUpperCase(Locale.ROOT)))) {
            String result = stages.stream().anyMatch(stage -> "PASSED".equalsIgnoreCase(stage.getStatus()))
                    ? "SUCCESS" : "FAILED";
            finishRun(pipeline, result, now);
        } else if (stages.stream().anyMatch(stage -> "RUNNING".equalsIgnoreCase(stage.getStatus()))) {
            pipeline.setStatus("RUNNING");
        }
    }

    private static void finishStage(PipelineStage stage, String status, LocalDateTime now) {
        stage.setStatus(status);
        stage.setEndedAt(now);
        stage.setDurationSeconds(stage.getStartedAt() == null ? null
                : Math.max(0, Duration.between(stage.getStartedAt(), now).toSeconds()));
    }

    private static void skipStage(PipelineStage stage, LocalDateTime now) {
        stage.setStatus("SKIPPED");
        stage.setEndedAt(now);
        stage.setDurationSeconds(null);
    }

    private static void finishRun(Pipeline pipeline, String status, LocalDateTime now) {
        pipeline.setStatus(status);
        pipeline.setFinishedAt(now);
        pipeline.setDurationSeconds(pipeline.getStartedAt() == null ? null
                : Math.max(0, Duration.between(pipeline.getStartedAt(), now).toSeconds()));
        pipeline.setUpdatedAt(now);
    }

    private void appendLog(Pipeline pipeline, String level, String message) {
        logRepository.save(new PipelineLog(pipeline, level, message));
    }

    private Pipeline findPipeline(Long id) {
        return pipelineRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pipeline run not found"));
    }

    private Project resolveProject(Map<String, Object> request) {
        Long projectId = parseId(request.get("projectId"));
        if (projectId != null) {
            return projectRepository.findById(projectId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found"));
        }

        String projectName = request.get("projectName") == null ? null : request.get("projectName").toString();
        if (projectName == null || projectName.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "projectId is required");
        }
        return projectRepository.findAll().stream()
                .filter(project -> project.getName().equalsIgnoreCase(projectName.trim()))
                .findFirst().orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found"));
    }

    private static void ensureManageAccess(Project project, Jwt jwt) {
        boolean isOwner = project.getOwner().getId().equals(Long.parseLong(jwt.getSubject()));
        List<String> roles = jwt.getClaimAsStringList("roles");
        boolean isAdmin = roles != null && roles.contains("ROLE_ADMIN");
        if (!isOwner && !isAdmin) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Only the project owner or an administrator can manage pipeline runs");
        }
    }

    private static Long parseId(Object rawId) {
        if (rawId == null) return null;
        try {
            return Long.parseLong(rawId.toString());
        } catch (NumberFormatException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid projectId");
        }
    }

    private static String boundedText(Map<String, Object> request, String key, String fallback, int maxLength) {
        Object raw = request.get(key);
        String value = raw == null ? fallback : raw.toString().trim();
        if (value == null || value.isBlank()) value = fallback;
        if (value == null) return null;
        if (value.length() > maxLength) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, key + " must be " + maxLength + " characters or fewer");
        }
        return value;
    }

    private static String normalizeStatus(String status) {
        if (status == null || status.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Stage status is required");
        }
        return status.trim().toUpperCase(Locale.ROOT);
    }

    private static String boundedMessage(String message) {
        if (message == null || message.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Log message is required");
        }
        String normalized = message.trim();
        if (normalized.length() > MAX_MESSAGE_LENGTH) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Log message must be " + MAX_MESSAGE_LENGTH + " characters or fewer");
        }
        return normalized;
    }

    private static void ensureRunActive(Pipeline pipeline) {
        if (TERMINAL_RUN_STATUSES.contains(pipeline.getStatus().toUpperCase(Locale.ROOT))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Pipeline run is already complete");
        }
    }
}
