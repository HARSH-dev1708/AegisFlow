package com.aegisflow.controller;

import com.aegisflow.domain.Environment;
import com.aegisflow.domain.Project;
import com.aegisflow.domain.User;
import com.aegisflow.repository.ContainerRepository;
import com.aegisflow.repository.EnvironmentRepository;
import com.aegisflow.repository.KubernetesPodRepository;
import com.aegisflow.repository.PipelineRepository;
import com.aegisflow.repository.ProjectRepository;
import com.aegisflow.repository.UserRepository;
import com.aegisflow.repository.VulnerabilityRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Locale;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    private final ProjectRepository projectRepository;
    private final EnvironmentRepository environmentRepository;
    private final UserRepository userRepository;
    private final PipelineRepository pipelineRepository;
    private final ContainerRepository containerRepository;
    private final KubernetesPodRepository podRepository;
    private final VulnerabilityRepository vulnerabilityRepository;

    public ProjectController(ProjectRepository projectRepository,
                             EnvironmentRepository environmentRepository,
                             UserRepository userRepository,
                             PipelineRepository pipelineRepository,
                             ContainerRepository containerRepository,
                             KubernetesPodRepository podRepository,
                             VulnerabilityRepository vulnerabilityRepository) {
        this.projectRepository = projectRepository;
        this.environmentRepository = environmentRepository;
        this.userRepository = userRepository;
        this.pipelineRepository = pipelineRepository;
        this.containerRepository = containerRepository;
        this.podRepository = podRepository;
        this.vulnerabilityRepository = vulnerabilityRepository;
    }

    @GetMapping
    public List<Map<String, Object>> getProjects() {
        return projectRepository.findAll().stream().map(this::toResponse).toList();
    }

    @GetMapping("/{id}")
    public Map<String, Object> getProject(@PathVariable Long id) {
        return toResponse(findProject(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> createProject(@RequestBody Map<String, Object> body) {
        String name = requiredText(body, "name");
        String environmentName = text(body, "environment", "Development");
        Environment environment = findOrCreateEnvironment(environmentName);
        User owner = userRepository.findAll().stream().findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Register a user before creating projects"));

        Project project = new Project(name, text(body, "description", null),
                text(body, "repository", text(body, "repositoryUrl", null)), "Healthy", environment, owner);
        return toResponse(projectRepository.save(project));
    }

    @PutMapping("/{id}")
    public Map<String, Object> updateProject(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Project project = findProject(id);
        if (body.containsKey("name")) project.setName(requiredText(body, "name"));
        if (body.containsKey("description")) project.setDescription(text(body, "description", null));
        if (body.containsKey("repository")) project.setRepositoryUrl(text(body, "repository", null));
        if (body.containsKey("repositoryUrl")) project.setRepositoryUrl(text(body, "repositoryUrl", null));
        if (body.containsKey("environment")) project.setEnvironment(findOrCreateEnvironment(text(body, "environment", "Development")));
        project.setUpdatedAt(LocalDateTime.now());
        return toResponse(projectRepository.save(project));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> deleteProject(@PathVariable Long id) {
        Project project = findProject(id);
        projectRepository.delete(project);
        return Map.of("success", true, "id", id);
    }

    private Map<String, Object> toResponse(Project project) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", project.getId());
        response.put("name", project.getName());
        response.put("description", project.getDescription());
        response.put("environment", project.getEnvironment().getName());
        response.put("status", project.getStatus());
        response.put("securityScore", Math.max(0, 100 - vulnerabilityRepository.countByProject_Id(project.getId()) * 5));
        response.put("repository", project.getRepositoryUrl());
        response.put("branch", "main");
        response.put("lastDeployment", "Not deployed");
        response.put("containersCount", containerRepository.countByProject_Id(project.getId()));
        response.put("podsCount", podRepository.countByProject_Id(project.getId()));
        response.put("activePipelines", pipelineRepository.countByProject_IdAndStatusIgnoreCase(project.getId(), "RUNNING"));
        return response;
    }

    private Project findProject(Long id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found"));
    }

    private Environment findOrCreateEnvironment(String name) {
        return environmentRepository.findAll().stream()
                .filter(environment -> environment.getName().equalsIgnoreCase(name) || environment.getSlug().equalsIgnoreCase(name))
                .findFirst()
                .orElseGet(() -> environmentRepository.save(new Environment(
                        name.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "-"), name, null)));
    }

    private static String requiredText(Map<String, Object> body, String key) {
        String value = text(body, key, null);
        if (value == null || value.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, key + " is required");
        }
        return value;
    }

    private static String text(Map<String, Object> body, String key, String fallback) {
        Object value = body.get(key);
        return value == null ? fallback : value.toString();
    }
}
