package com.aegisflow.controller;

import com.aegisflow.domain.Deployment;
import com.aegisflow.domain.MonitoringMetric;
import com.aegisflow.domain.Pipeline;
import com.aegisflow.domain.Project;
import com.aegisflow.domain.Vulnerability;
import com.aegisflow.repository.ContainerRepository;
import com.aegisflow.repository.DeploymentRepository;
import com.aegisflow.repository.KubernetesPodRepository;
import com.aegisflow.repository.MonitoringMetricRepository;
import com.aegisflow.repository.PipelineRepository;
import com.aegisflow.repository.ProjectRepository;
import com.aegisflow.repository.VulnerabilityRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.LinkedHashMap;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final ProjectRepository projectRepository;
    private final PipelineRepository pipelineRepository;
    private final VulnerabilityRepository vulnerabilityRepository;
    private final ContainerRepository containerRepository;
    private final KubernetesPodRepository podRepository;
    private final DeploymentRepository deploymentRepository;
    private final MonitoringMetricRepository metricRepository;

    public DashboardController(ProjectRepository projectRepository, PipelineRepository pipelineRepository,
                               VulnerabilityRepository vulnerabilityRepository, ContainerRepository containerRepository,
                               KubernetesPodRepository podRepository, DeploymentRepository deploymentRepository,
                               MonitoringMetricRepository metricRepository) {
        this.projectRepository = projectRepository;
        this.pipelineRepository = pipelineRepository;
        this.vulnerabilityRepository = vulnerabilityRepository;
        this.containerRepository = containerRepository;
        this.podRepository = podRepository;
        this.deploymentRepository = deploymentRepository;
        this.metricRepository = metricRepository;
    }

    @GetMapping
    public Map<String, Object> getDashboard() {
        List<Project> projects = projectRepository.findAll();
        List<Pipeline> pipelines = pipelineRepository.findAll();
        List<Vulnerability> vulnerabilities = vulnerabilityRepository.findAll();
        List<Deployment> deployments = deploymentRepository.findAll();
        Map<String, Map<String, Object>> resourceRows = new LinkedHashMap<>();
        metricRepository.findAll().stream().sorted((left, right) -> left.getCapturedAt().compareTo(right.getCapturedAt()))
                .filter(metric -> metric.getMetricName().equalsIgnoreCase("cpu") || metric.getMetricName().equalsIgnoreCase("memory"))
                .forEach(metric -> resourceRows.computeIfAbsent(ApiResponses.time(metric.getCapturedAt()), time ->
                        ApiResponses.map("time", time, "cpu", 0, "memory", 0))
                        .put(metric.getMetricName().toLowerCase(), metric.getMetricValue()));
        Map<String, Long> severityCounts = vulnerabilities.stream().collect(Collectors.groupingBy(
                vulnerability -> vulnerability.getSeverity().toUpperCase(), Collectors.counting()));
        Map<String, Long> pipelineCounts = pipelines.stream().collect(Collectors.groupingBy(
                pipeline -> pipeline.getStatus().toUpperCase(), Collectors.counting()));
        List<Map<String, Object>> deploymentActivity = deployments.stream()
                .filter(deployment -> deployment.getDeployedAt().toLocalDate().equals(LocalDate.now()))
                .collect(Collectors.groupingBy(deployment -> deployment.getDeployedAt().getHour(), Collectors.counting()))
                .entrySet().stream().sorted(Map.Entry.comparingByKey())
                .map(entry -> ApiResponses.map("time", String.format("%02d:00", entry.getKey()), "success", entry.getValue(), "failed", 0))
                .toList();
        List<Map<String, Object>> severityData = List.of("Critical", "High", "Medium", "Low").stream()
                .map(severity -> ApiResponses.map("severity", severity,
                        "count", severityCounts.getOrDefault(severity.toUpperCase(), 0L),
                        "color", colorForSeverity(severity)))
                .toList();
        List<Map<String, Object>> pipelineData = List.of(
                ApiResponses.map("name", "Successful", "value", pipelineCounts.getOrDefault("SUCCESS", 0L), "color", "#10b981"),
                ApiResponses.map("name", "Failed", "value", pipelineCounts.getOrDefault("FAILED", 0L), "color", "#f43f5e"),
                ApiResponses.map("name", "Running", "value", pipelineCounts.getOrDefault("RUNNING", 0L), "color", "#06b6d4"));
        return ApiResponses.map(
                "projects", projects.size(),
                "activePipelines", pipelineCounts.getOrDefault("RUNNING", 0L) + pipelineCounts.getOrDefault("QUEUED", 0L),
                "securityIssues", vulnerabilities.stream().filter(vulnerability -> !"RESOLVED".equalsIgnoreCase(vulnerability.getStatus())).count(),
                "runningContainers", containerRepository.countByStatusIgnoreCase("Running"),
                "kubernetesPods", podRepository.countByStatusIgnoreCase("Running"),
                "deployments", deployments.size(),
                "securityScore", vulnerabilities.isEmpty() ? 100 : Math.max(0, 100 - vulnerabilities.size() * 5),
                "trends", ApiResponses.map("projects", "", "activePipelines", "", "securityIssues", "", "runningContainers", "", "kubernetesPods", "", "deployments", ""),
                "deploymentActivity", deploymentActivity,
                "pipelineSuccessRate", pipelineData,
                "securityVulnerabilities", severityData,
                "resourceUsage", List.copyOf(resourceRows.values()));
    }

    private static String colorForSeverity(String severity) {
        return switch (severity) {
            case "Critical" -> "#f43f5e";
            case "High" -> "#f97316";
            case "Medium" -> "#eab308";
            default -> "#3b82f6";
        };
    }
}
