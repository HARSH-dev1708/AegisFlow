package com.aegisflow.controller;

import com.aegisflow.domain.Deployment;
import com.aegisflow.domain.Environment;
import com.aegisflow.domain.Project;
import com.aegisflow.domain.User;
import com.aegisflow.repository.DeploymentRepository;
import com.aegisflow.repository.EnvironmentRepository;
import com.aegisflow.repository.ProjectRepository;
import com.aegisflow.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;
import java.util.Map;

@RestController
@RequestMapping("/api/deployments")
public class DeploymentController {

    private final DeploymentRepository deploymentRepository;
    private final ProjectRepository projectRepository;
    private final EnvironmentRepository environmentRepository;
    private final UserRepository userRepository;

    public DeploymentController(DeploymentRepository deploymentRepository, ProjectRepository projectRepository,
                                EnvironmentRepository environmentRepository, UserRepository userRepository) {
        this.deploymentRepository = deploymentRepository;
        this.projectRepository = projectRepository;
        this.environmentRepository = environmentRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    public List<Map<String, Object>> getDeployments() {
        return deploymentRepository.findAll().stream().map(this::toResponse).toList();
    }

    @GetMapping("/{id}")
    public Map<String, Object> getDeployment(@PathVariable Long id) {
        return toResponse(findDeployment(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> createDeployment(@RequestBody Map<String, Object> body) {
        Project project = findProject(ApiResponses.text(body, "project", null));
        String environmentName = ApiResponses.text(body, "environment", project.getEnvironment().getName());
        Environment environment = findOrCreateEnvironment(environmentName);
        String version = ApiResponses.text(body, "version", "v1.0.0");
        String dockerImage = ApiResponses.text(body, "dockerImage", project.getName().toLowerCase(Locale.ROOT).replace(' ', '-') + ":" + version);
        String namespace = ApiResponses.text(body, "namespace", environment.getSlug());
        Integer replicas = body.get("replicas") == null ? 1 : Integer.valueOf(body.get("replicas").toString());
        User actor = userRepository.findAll().stream().findFirst().orElse(null);
        Deployment deployment = deploymentRepository.save(new Deployment(version, "SUCCESS", project, environment,
                actor, dockerImage, namespace, replicas));
        return toResponse(deployment);
    }

    @PostMapping("/{id}/rollback")
    public Map<String, Object> rollback(@PathVariable Long id) {
        Deployment target = findDeployment(id);
        Deployment rollback = deploymentRepository.save(new Deployment(target.getVersion() + "-rollback", "SUCCESS",
                target.getProject(), target.getEnvironment(), target.getDeployedBy(), target.getDockerImage(),
                target.getNamespace(), target.getReplicas()));
        return toResponse(rollback);
    }

    private Map<String, Object> toResponse(Deployment deployment) {
        return ApiResponses.map("id", deployment.getId(), "version", deployment.getVersion(),
                "project", deployment.getProject().getName(), "environment", deployment.getEnvironment().getName(),
                "status", deployment.getStatus(), "time", ApiResponses.time(deployment.getDeployedAt()),
                "dockerImage", deployment.getDockerImage(), "namespace", deployment.getNamespace(),
                "replicas", deployment.getReplicas(),
                "deployedBy", deployment.getDeployedBy() == null ? "System" : deployment.getDeployedBy().getUsername());
    }

    private Project findProject(String name) {
        if (name == null) {
            return projectRepository.findAll().stream().findFirst()
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Create a project before deploying"));
        }
        return projectRepository.findAll().stream()
                .filter(project -> project.getName().equalsIgnoreCase(name))
                .findFirst().orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found"));
    }

    private Environment findOrCreateEnvironment(String name) {
        return environmentRepository.findAll().stream()
                .filter(environment -> environment.getName().equalsIgnoreCase(name) || environment.getSlug().equalsIgnoreCase(name))
                .findFirst().orElseGet(() -> environmentRepository.save(new Environment(
                        name.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "-"), name, null)));
    }

    private Deployment findDeployment(Long id) {
        return deploymentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Deployment not found"));
    }
}
