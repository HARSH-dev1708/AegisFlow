package com.aegisflow.controller;

import com.aegisflow.domain.Deployment;
import com.aegisflow.domain.Environment;
import com.aegisflow.domain.Pipeline;
import com.aegisflow.domain.Project;
import com.aegisflow.domain.User;
import com.aegisflow.repository.ContainerRepository;
import com.aegisflow.repository.DeploymentRepository;
import com.aegisflow.repository.EnvironmentRepository;
import com.aegisflow.repository.KubernetesPodRepository;
import com.aegisflow.repository.PipelineRepository;
import com.aegisflow.repository.ProjectRepository;
import com.aegisflow.repository.UserRepository;
import com.aegisflow.repository.VulnerabilityRepository;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
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
import java.net.URI;
import java.util.Optional;

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
    private final DeploymentRepository deploymentRepository;

    public ProjectController(ProjectRepository projectRepository,
                             EnvironmentRepository environmentRepository,
                             UserRepository userRepository,
                             PipelineRepository pipelineRepository,
                             ContainerRepository containerRepository,
                             KubernetesPodRepository podRepository,
                             VulnerabilityRepository vulnerabilityRepository,
                             DeploymentRepository deploymentRepository) {
        this.projectRepository = projectRepository;
        this.environmentRepository = environmentRepository;
        this.userRepository = userRepository;
        this.pipelineRepository = pipelineRepository;
        this.containerRepository = containerRepository;
        this.podRepository = podRepository;
        this.vulnerabilityRepository = vulnerabilityRepository;
        this.deploymentRepository = deploymentRepository;
    }

    @GetMapping
    public List<Map<String, Object>> getProjects(@RequestParam(defaultValue = "false") boolean archived) {
        List<Project> projects = archived
                ? projectRepository.findAllByArchivedTrueOrderByUpdatedAtDesc()
                : projectRepository.findAllByArchivedFalseOrderByUpdatedAtDesc();
        return projects.stream().map(this::toResponse).toList();
    }

    @GetMapping("/{id}")
    public Map<String, Object> getProject(@PathVariable Long id) {
        return toResponse(findProject(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> createProject(@RequestBody Map<String, Object> body,
                                             @AuthenticationPrincipal Jwt jwt) {
        String name = projectName(body, "name");
        Environment environment = resolveEnvironment(body, "Development");
        User owner = currentUser(jwt);
        Project project = new Project(name, description(body, "description"),
                repositoryUrl(body), "Healthy", environment, owner);
        return toResponse(projectRepository.save(project));
    }

    @PutMapping("/{id}")
    public Map<String, Object> updateProject(@PathVariable Long id, @RequestBody Map<String, Object> body,
                                             @AuthenticationPrincipal Jwt jwt) {
        Project project = findProject(id);
        ensureManageAccess(project, jwt);
        if (project.isArchived()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Restore this project before editing it");
        }
        if (body.containsKey("name")) project.setName(projectName(body, "name"));
        if (body.containsKey("description")) project.setDescription(description(body, "description"));
        if (body.containsKey("repository") || body.containsKey("repositoryUrl")) {
            project.setRepositoryUrl(repositoryUrl(body));
        }
        if (body.containsKey("environment") || body.containsKey("environmentId")) {
            project.setEnvironment(resolveEnvironment(body, null));
        }
        project.setUpdatedAt(LocalDateTime.now());
        return toResponse(projectRepository.save(project));
    }

    @PatchMapping("/{id}/archive")
    public Map<String, Object> archiveProject(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        Project project = findProject(id);
        ensureManageAccess(project, jwt);
        project.setArchived(true);
        project.setUpdatedAt(LocalDateTime.now());
        return toResponse(projectRepository.save(project));
    }

    @PatchMapping("/{id}/restore")
    public Map<String, Object> restoreProject(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        Project project = findProject(id);
        ensureManageAccess(project, jwt);
        project.setArchived(false);
        project.setUpdatedAt(LocalDateTime.now());
        return toResponse(projectRepository.save(project));
    }

    private Map<String, Object> toResponse(Project project) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", project.getId());
        response.put("name", project.getName());
        response.put("description", project.getDescription());
        response.put("environment", project.getEnvironment().getName());
        Optional<Deployment> latestDeployment =
                deploymentRepository.findFirstByProject_IdOrderByDeployedAtDesc(project.getId());
        String deploymentStatus = latestDeployment.map(Deployment::getStatus).orElse("Not deployed");
        response.put("status", healthStatus(project.getStatus(), deploymentStatus));
        response.put("deploymentStatus", deploymentStatus);
        response.put("archived", project.isArchived());
        response.put("ownerId", project.getOwner().getId());
        response.put("securityScore", Math.max(0, 100 - vulnerabilityRepository.countByProject_Id(project.getId()) * 5));
        response.put("repository", project.getRepositoryUrl());
        response.put("branch", pipelineRepository.findAll().stream()
                .filter(pipeline -> pipeline.getProject().getId().equals(project.getId()))
                .max(java.util.Comparator.comparing(Pipeline::getCreatedAt))
                .map(Pipeline::getBranch).orElse("--"));
        response.put("lastDeployment", latestDeployment
                .map(deployment -> ApiResponses.time(deployment.getDeployedAt())).orElse("Not deployed"));
        response.put("containersCount", containerRepository.countByProject_Id(project.getId()));
        response.put("podsCount", podRepository.countByProject_Id(project.getId()));
        response.put("activePipelines", pipelineRepository.countByProject_IdAndStatusIgnoreCase(project.getId(), "RUNNING"));
        return response;
    }

    private Project findProject(Long id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found"));
    }

    private Environment resolveEnvironment(Map<String, Object> body, String defaultName) {
        Object rawId = body.get("environmentId");
        if (rawId != null) {
            try {
                return environmentRepository.findById(Long.parseLong(rawId.toString()))
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Environment not found"));
            } catch (NumberFormatException exception) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid environmentId");
            }
        }
        String name = text(body, "environment", defaultName);
        if (name == null || name.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "environment is required");
        }
        return environmentRepository.findByNameIgnoreCase(name.trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Environment not found"));
    }

    private User currentUser(Jwt jwt) {
        return userRepository.findById(Long.parseLong(jwt.getSubject()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Session user not found"));
    }

    private static void ensureManageAccess(Project project, Jwt jwt) {
        boolean isOwner = project.getOwner().getId().equals(Long.parseLong(jwt.getSubject()));
        boolean isAdmin = jwt.getClaimAsStringList("roles").contains("ROLE_ADMIN");
        if (!isOwner && !isAdmin) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the project owner or an administrator can manage this project");
        }
    }

    private static String healthStatus(String storedStatus, String deploymentStatus) {
        return switch (deploymentStatus.toUpperCase(java.util.Locale.ROOT)) {
            case "SUCCESS" -> "Healthy";
            case "FAILED" -> "Degraded";
            case "RUNNING" -> "Deploying";
            default -> storedStatus;
        };
    }

    private static String projectName(Map<String, Object> body, String key) {
        String value = requiredText(body, key).trim();
        if (value.length() > 150) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Project name must be 150 characters or fewer");
        }
        return value;
    }

    private static String description(Map<String, Object> body, String key) {
        String value = text(body, key, null);
        if (value == null || value.isBlank()) return null;
        value = value.trim();
        if (value.length() > 500) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Description must be 500 characters or fewer");
        }
        return value;
    }

    private static String repositoryUrl(Map<String, Object> body) {
        String value = text(body, "repository", text(body, "repositoryUrl", null));
        if (value == null || value.isBlank()) return null;
        value = value.trim();
        if (value.length() > 255) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Repository URL must be 255 characters or fewer");
        }
        try {
            URI uri = URI.create(value);
            if (uri.getHost() == null || uri.getScheme() == null
                    || !List.of("http", "https").contains(uri.getScheme().toLowerCase(java.util.Locale.ROOT))) {
                throw new IllegalArgumentException("Invalid URL scheme or host");
            }
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Repository URL must be a valid HTTP or HTTPS URL");
        }
        return value;
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
