package com.aegisflow.controller;

import com.aegisflow.domain.Pipeline;
import com.aegisflow.domain.PipelineLog;
import com.aegisflow.domain.PipelineStage;
import com.aegisflow.repository.PipelineRepository;
import com.aegisflow.repository.PipelineStageRepository;
import com.aegisflow.service.PipelineExecutionService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.Locale;
import java.time.Duration;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/pipelines")
public class PipelineController {

    private final PipelineRepository pipelineRepository;
    private final PipelineStageRepository stageRepository;
    private final PipelineExecutionService executionService;

    public PipelineController(PipelineRepository pipelineRepository, PipelineStageRepository stageRepository,
                              PipelineExecutionService executionService) {
        this.pipelineRepository = pipelineRepository;
        this.stageRepository = stageRepository;
        this.executionService = executionService;
    }

    @GetMapping
    public List<Map<String, Object>> getPipelines() {
        return pipelineRepository.findAllByOrderByCreatedAtDesc().stream().map(this::toResponse).toList();
    }

    @GetMapping("/{id}")
    public Map<String, Object> getPipeline(@PathVariable Long id) {
        return toResponse(findPipeline(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> createPipeline(@RequestBody Map<String, Object> body,
                                              @AuthenticationPrincipal Jwt jwt) {
        return toResponse(executionService.createRun(body, "MANUAL", jwt));
    }

    @PostMapping("/webhook")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> createWebhookRun(@RequestBody Map<String, Object> body,
                                                @AuthenticationPrincipal Jwt jwt) {
        return toResponse(executionService.createRun(body, "WEBHOOK", jwt));
    }

    @PostMapping("/{id}/run")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> runPipeline(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        return toResponse(executionService.retryRun(id, jwt));
    }

    @PostMapping("/{id}/retry")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> retryPipeline(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        return toResponse(executionService.retryRun(id, jwt));
    }

    @PostMapping("/{id}/cancel")
    public Map<String, Object> cancelPipeline(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        return toResponse(executionService.cancelRun(id, jwt));
    }

    @PatchMapping("/{pipelineId}/stages/{stageId}")
    public Map<String, Object> updateStage(@PathVariable Long pipelineId, @PathVariable Long stageId,
                                           @RequestBody Map<String, Object> body,
                                           @AuthenticationPrincipal Jwt jwt) {
        String status = ApiResponses.text(body, "status", null);
        String message = ApiResponses.text(body, "log", null);
        return toResponse(executionService.updateStage(pipelineId, stageId, status, message, jwt));
    }

    @PostMapping("/{id}/logs")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> appendLog(@PathVariable Long id, @RequestBody Map<String, Object> body,
                                         @AuthenticationPrincipal Jwt jwt) {
        PipelineLog log = executionService.appendRunnerLog(id,
                ApiResponses.text(body, "level", "INFO"), ApiResponses.text(body, "message", null), jwt);
        return ApiResponses.map("id", log.getId(), "level", log.getLevel(),
                "message", log.getMessage(), "createdAt", log.getCreatedAt().toString());
    }

    @GetMapping("/{id}/logs")
    public List<String> getPipelineLogs(@PathVariable Long id) {
        return executionService.getLogs(id).stream()
                .map(log -> ApiResponses.time(log.getCreatedAt()) + " [" + log.getLevel() + "] " + log.getMessage())
                .toList();
    }

    private Map<String, Object> toResponse(Pipeline pipeline) {
        List<PipelineStage> stages = stageRepository.findAllByPipeline_IdOrderByIdAsc(pipeline.getId());
        long elapsedSeconds = durationSeconds(pipeline);
        String duration = pipeline.getStatus().equalsIgnoreCase("QUEUED") && pipeline.getStartedAt() == null
                ? "Queued" : elapsedSeconds / 60 + "m " + elapsedSeconds % 60 + "s";
        return ApiResponses.map(
                "id", pipeline.getId(),
                "name", pipeline.getName(),
                "projectId", pipeline.getProject().getId(),
                "projectName", pipeline.getProject().getName(),
                "branch", pipeline.getBranch(),
                "commit", pipeline.getCommitHash() == null || pipeline.getCommitHash().isBlank()
                        ? "--" : pipeline.getCommitHash(),
                "author", pipeline.getProject().getOwner().getUsername(),
                "status", displayStatus(pipeline.getStatus()),
                "triggerSource", pipeline.getTriggerSource(),
                "createdAt", pipeline.getCreatedAt().toString(),
                "startTime", pipeline.getStartedAt() == null
                        ? ApiResponses.time(pipeline.getCreatedAt()) : ApiResponses.time(pipeline.getStartedAt()),
                "startedAt", pipeline.getStartedAt() == null ? null : pipeline.getStartedAt().toString(),
                "finishedAt", pipeline.getFinishedAt() == null ? null : pipeline.getFinishedAt().toString(),
                "durationSeconds", pipeline.getDurationSeconds(),
                "duration", duration,
                "stages", stages.stream().map(stage -> ApiResponses.map(
                        "id", stage.getId(),
                        "name", stage.getName(),
                        "status", stage.getStatus(),
                        "startedAt", stage.getStartedAt() == null ? null : stage.getStartedAt().toString(),
                        "endedAt", stage.getEndedAt() == null ? null : stage.getEndedAt().toString(),
                        "durationSeconds", stage.getDurationSeconds(),
                        "duration", stage.getDurationSeconds() == null ? "--" : stage.getDurationSeconds() + "s"))
                        .toList());
    }

    private Pipeline findPipeline(Long id) {
        return pipelineRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pipeline run not found"));
    }

    private static long durationSeconds(Pipeline pipeline) {
        if (pipeline.getDurationSeconds() != null) return pipeline.getDurationSeconds();
        if (pipeline.getStartedAt() == null) return 0;
        LocalDateTime end = pipeline.getFinishedAt() == null ? LocalDateTime.now() : pipeline.getFinishedAt();
        return Math.max(0, Duration.between(pipeline.getStartedAt(), end).toSeconds());
    }

    private static String displayStatus(String status) {
        return status.isEmpty() ? status : status.substring(0, 1).toUpperCase(Locale.ROOT)
                + status.substring(1).toLowerCase(Locale.ROOT);
    }
}
