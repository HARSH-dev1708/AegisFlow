package com.aegisflow.controller;

import com.aegisflow.domain.Pipeline;
import com.aegisflow.domain.PipelineStage;
import com.aegisflow.domain.Project;
import com.aegisflow.repository.PipelineRepository;
import com.aegisflow.repository.PipelineStageRepository;
import com.aegisflow.repository.ProjectRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/pipelines")
public class PipelineController {

    private static final List<String> STAGE_NAMES = List.of("Code", "Build", "Test", "SAST", "Dependency Scan",
            "Docker Build", "Container Scan", "Kubernetes Deploy", "Production");

    private final PipelineRepository pipelineRepository;
    private final PipelineStageRepository stageRepository;
    private final ProjectRepository projectRepository;

    public PipelineController(PipelineRepository pipelineRepository, PipelineStageRepository stageRepository,
                              ProjectRepository projectRepository) {
        this.pipelineRepository = pipelineRepository;
        this.stageRepository = stageRepository;
        this.projectRepository = projectRepository;
    }

    @GetMapping
    public List<Map<String, Object>> getPipelines() {
        return pipelineRepository.findAll().stream().map(this::toResponse).toList();
    }

    @GetMapping("/{id}")
    public Map<String, Object> getPipeline(@PathVariable Long id) {
        return toResponse(findPipeline(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> createPipeline(@RequestBody(required = false) Map<String, Object> body) {
        Map<String, Object> request = body == null ? Map.of() : body;
        Project project = resolveProject(request);
        String branch = ApiResponses.text(request, "branch", "main");
        Pipeline pipeline = pipelineRepository.save(new Pipeline("CI/CD", branch, "local-demo", "RUNNING", project));
        for (int index = 0; index < STAGE_NAMES.size(); index++) {
            stageRepository.save(new PipelineStage(STAGE_NAMES.get(index), index == 0 ? "RUNNING" : "PENDING", pipeline));
        }
        return toResponse(pipelineRepository.findById(pipeline.getId()).orElseThrow());
    }

    @PostMapping("/{id}/run")
    public Map<String, Object> runPipeline(@PathVariable Long id) {
        return updateStatus(id, "RUNNING");
    }

    @PostMapping("/{id}/retry")
    public Map<String, Object> retryPipeline(@PathVariable Long id) {
        return updateStatus(id, "RUNNING");
    }

    @PostMapping("/{id}/cancel")
    public Map<String, Object> cancelPipeline(@PathVariable Long id) {
        return updateStatus(id, "CANCELLED");
    }

    @GetMapping("/{id}/logs")
    public List<String> getPipelineLogs(@PathVariable Long id) {
        Pipeline pipeline = findPipeline(id);
        List<String> lines = new ArrayList<>();
        lines.add("[INFO] Pipeline " + pipeline.getId() + " for " + pipeline.getProject().getName() + " is " + pipeline.getStatus());
        pipeline.getStages().forEach(stage -> lines.add("[" + stage.getStatus() + "] " + stage.getName()));
        return lines;
    }

    private Map<String, Object> updateStatus(Long id, String status) {
        Pipeline pipeline = findPipeline(id);
        pipeline.setStatus(status);
        pipeline.getStages().forEach(stage -> stage.setStatus("RUNNING".equals(status) ? "PENDING" : status));
        if ("RUNNING".equals(status) && !pipeline.getStages().isEmpty()) {
            pipeline.getStages().getFirst().setStatus("RUNNING");
        }
        pipelineRepository.save(pipeline);
        return ApiResponses.map("success", true, "message", "Pipeline " + id + " " + status.toLowerCase());
    }

    private Map<String, Object> toResponse(Pipeline pipeline) {
        String author = pipeline.getProject().getOwner().getUsername();
        long seconds = pipeline.getStages().stream().map(PipelineStage::getDurationSeconds)
                .filter(value -> value != null).mapToLong(Long::longValue).sum();
        return ApiResponses.map(
                "id", pipeline.getId(),
                "projectId", pipeline.getProject().getId(),
                "projectName", pipeline.getProject().getName(),
                "branch", pipeline.getBranch(),
                "commit", pipeline.getCommitHash(),
                "author", author,
                "status", displayStatus(pipeline.getStatus()),
                "startTime", ApiResponses.time(pipeline.getCreatedAt()),
                "duration", seconds / 60 + "m " + seconds % 60 + "s",
                "stages", pipeline.getStages().stream().map(stage -> ApiResponses.map(
                        "id", stage.getId(), "name", stage.getName(), "status", stage.getStatus(),
                        "duration", stage.getDurationSeconds() == null ? "--" : stage.getDurationSeconds() + "s")).toList());
    }

    private Project resolveProject(Map<String, Object> body) {
        Long projectId = ApiResponses.longValue(body, "projectId");
        if (projectId != null) {
            return projectRepository.findById(projectId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found"));
        }
        String projectName = ApiResponses.text(body, "projectName", null);
        return projectRepository.findAll().stream()
                .filter(project -> projectName == null || project.getName().equalsIgnoreCase(projectName))
                .findFirst().orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Create a project before triggering a pipeline"));
    }

    private Pipeline findPipeline(Long id) {
        return pipelineRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pipeline not found"));
    }

    private static String displayStatus(String status) {
        return status.isEmpty() ? status : status.substring(0, 1).toUpperCase() + status.substring(1).toLowerCase();
    }
}
