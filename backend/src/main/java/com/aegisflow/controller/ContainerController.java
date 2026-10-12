package com.aegisflow.controller;

import com.aegisflow.domain.Container;
import com.aegisflow.repository.ContainerRepository;
import com.aegisflow.repository.LogEventRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/containers")
public class ContainerController {

    private final ContainerRepository containerRepository;
    private final LogEventRepository logRepository;

    public ContainerController(ContainerRepository containerRepository, LogEventRepository logRepository) {
        this.containerRepository = containerRepository;
        this.logRepository = logRepository;
    }

    @GetMapping
    public List<Map<String, Object>> getContainers() {
        return containerRepository.findAll().stream().map(this::toResponse).toList();
    }

    @GetMapping("/{id}")
    public Map<String, Object> getContainer(@PathVariable Long id) {
        return toResponse(findContainer(id));
    }

    @PostMapping("/{id}/start")
    public Map<String, Object> start(@PathVariable Long id) {
        return setStatus(id, "Running");
    }

    @PostMapping("/{id}/stop")
    public Map<String, Object> stop(@PathVariable Long id) {
        return setStatus(id, "Stopped");
    }

    @PostMapping("/{id}/restart")
    public Map<String, Object> restart(@PathVariable Long id) {
        return setStatus(id, "Running");
    }

    @GetMapping("/{id}/logs")
    public List<String> getLogs(@PathVariable Long id) {
        Container container = findContainer(id);
        return logRepository.findAll().stream()
                .filter(log -> log.getProject().getId().equals(container.getProject().getId()))
                .map(log -> ApiResponses.time(log.getCreatedAt()) + " [" + log.getLevel() + "] " + log.getMessage())
                .toList();
    }

    private Map<String, Object> setStatus(Long id, String status) {
        Container container = findContainer(id);
        container.setStatus(status);
        if ("Stopped".equals(status)) {
            container.setCpuUsage("--");
            container.setMemoryUsage("--");
        }
        containerRepository.save(container);
        return ApiResponses.map("success", true, "message", "Container " + id + " " + status.toLowerCase());
    }

    private Map<String, Object> toResponse(Container container) {
        return ApiResponses.map("id", container.getId(), "name", container.getName(), "image", container.getImage(),
                "status", container.getStatus(), "cpu", container.getCpuUsage() == null ? "--" : container.getCpuUsage(),
                "memory", container.getMemoryUsage() == null ? "--" : container.getMemoryUsage(),
                "created", ApiResponses.time(container.getCreatedAt()),
                "ports", container.getPort() == null ? "--" : container.getPort());
    }

    private Container findContainer(Long id) {
        return containerRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Container not found"));
    }
}
