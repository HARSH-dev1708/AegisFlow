package com.aegisflow.controller;

import com.aegisflow.domain.LogEvent;
import com.aegisflow.domain.Project;
import com.aegisflow.repository.LogEventRepository;
import com.aegisflow.repository.ProjectRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/logs")
public class LogController {

    private final LogEventRepository logRepository;
    private final ProjectRepository projectRepository;

    public LogController(LogEventRepository logRepository, ProjectRepository projectRepository) {
        this.logRepository = logRepository;
        this.projectRepository = projectRepository;
    }

    @GetMapping
    public List<Map<String, Object>> getLogs(@RequestParam(required = false) String level,
                                              @RequestParam(required = false) String search) {
        return logRepository.findAll().stream()
                .filter(log -> level == null || level.equalsIgnoreCase("ALL") || log.getLevel().equalsIgnoreCase(level))
                .filter(log -> search == null || search.isBlank() || log.getMessage().toLowerCase().contains(search.toLowerCase())
                        || log.getSource().toLowerCase().contains(search.toLowerCase()))
                .map(this::toResponse).toList();
    }

    @PostMapping
    public Map<String, Object> createLog(@RequestBody Map<String, Object> body) {
        Long projectId = ApiResponses.longValue(body, "projectId");
        Project project = projectId == null ? projectRepository.findAll().stream().findFirst().orElse(null)
                : projectRepository.findById(projectId).orElse(null);
        if (project == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A valid projectId is required");
        LogEvent log = logRepository.save(new LogEvent(ApiResponses.text(body, "service", "Application"),
                ApiResponses.text(body, "level", "INFO"), ApiResponses.text(body, "message", ""), project));
        return toResponse(log);
    }

    @DeleteMapping
    public List<Map<String, Object>> clearLogs() {
        logRepository.deleteAllInBatch();
        return List.of();
    }

    private Map<String, Object> toResponse(LogEvent log) {
        return ApiResponses.map("id", log.getId(), "timestamp", ApiResponses.time(log.getCreatedAt()),
                "level", log.getLevel().toUpperCase(), "message", log.getMessage(), "service", log.getSource());
    }
}
