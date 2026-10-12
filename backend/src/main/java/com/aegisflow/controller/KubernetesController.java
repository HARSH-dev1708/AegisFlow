package com.aegisflow.controller;

import com.aegisflow.domain.Cluster;
import com.aegisflow.domain.Deployment;
import com.aegisflow.domain.KubernetesPod;
import com.aegisflow.domain.KubernetesService;
import com.aegisflow.repository.ClusterRepository;
import com.aegisflow.repository.DeploymentRepository;
import com.aegisflow.repository.KubernetesPodRepository;
import com.aegisflow.repository.KubernetesServiceRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/kubernetes")
public class KubernetesController {

    private final ClusterRepository clusterRepository;
    private final KubernetesPodRepository podRepository;
    private final KubernetesServiceRepository serviceRepository;
    private final DeploymentRepository deploymentRepository;

    public KubernetesController(ClusterRepository clusterRepository, KubernetesPodRepository podRepository,
                                KubernetesServiceRepository serviceRepository, DeploymentRepository deploymentRepository) {
        this.clusterRepository = clusterRepository;
        this.podRepository = podRepository;
        this.serviceRepository = serviceRepository;
        this.deploymentRepository = deploymentRepository;
    }

    @GetMapping("/overview")
    public Map<String, Object> getOverview() {
        long namespaceCount = java.util.stream.Stream.concat(
                        podRepository.findAll().stream().map(KubernetesPod::getNamespace),
                        serviceRepository.findAll().stream().map(KubernetesService::getNamespace))
                .distinct().count();
        List<Cluster> clusters = clusterRepository.findAll();
        String status = clusters.isEmpty() ? "Unknown"
                : clusters.stream().allMatch(cluster -> "HEALTHY".equalsIgnoreCase(cluster.getStatus())
                || "READY".equalsIgnoreCase(cluster.getStatus())) ? "Healthy" : "Warning";
        return ApiResponses.map("status", status,
                "nodes", clusterRepository.count(), "pods", podRepository.count(),
                "deployments", deploymentRepository.count(), "services", serviceRepository.count(),
                "namespaces", namespaceCount);
    }

    @GetMapping("/nodes")
    public List<Map<String, Object>> getNodes() {
        return clusterRepository.findAll().stream().map(this::toNode).toList();
    }

    @GetMapping("/pods")
    public List<Map<String, Object>> getPods() {
        return podRepository.findAll().stream().map(pod -> ApiResponses.map(
                "id", pod.getId(), "name", pod.getName(), "namespace", pod.getNamespace(),
                "status", pod.getStatus(), "restarts", pod.getRestarts() == null ? "0" : pod.getRestarts(),
                "age", age(pod.getCreatedAt()), "node", pod.getNodeName() == null ? "--" : pod.getNodeName())).toList();
    }

    @GetMapping("/deployments")
    public List<Map<String, Object>> getDeployments() {
        return deploymentRepository.findAll().stream().map(deployment -> ApiResponses.map(
                "id", deployment.getId(), "name", deployment.getProject().getName().toLowerCase().replace(' ', '-') + "-deployment",
                "namespace", deployment.getNamespace() == null ? deployment.getEnvironment().getSlug() : deployment.getNamespace(),
                "replicas", deployment.getReplicas() == null ? "0/0" : deployment.getReplicas() + "/" + deployment.getReplicas(),
                "available", deployment.getReplicas() == null ? "0" : deployment.getReplicas().toString(),
                "updated", age(deployment.getDeployedAt()))).toList();
    }

    @GetMapping("/services")
    public List<Map<String, Object>> getServices() {
        return serviceRepository.findAll().stream()
                .map(service -> ApiResponses.map("id", service.getId(), "name", service.getName(),
                        "namespace", service.getNamespace(), "type", service.getType(),
                        "clusterIp", service.getClusterIp(), "port", service.getPort()))
                .toList();
    }

    @GetMapping("/namespaces")
    public List<Map<String, Object>> getNamespaces() {
        return java.util.stream.Stream.concat(
                        podRepository.findAll().stream().map(KubernetesPod::getNamespace),
                        serviceRepository.findAll().stream().map(KubernetesService::getNamespace))
                .distinct()
                .map(namespace -> ApiResponses.map("name", namespace, "status", "Active", "age", "--")).toList();
    }

    private Map<String, Object> toNode(Cluster cluster) {
        return ApiResponses.map("id", cluster.getId(), "name", cluster.getName(), "role", cluster.getProvider(),
                "status", cluster.getStatus(), "cpuUsage", "--", "memUsage", "--", "kubeletVersion", "--");
    }

    private static String age(LocalDateTime createdAt) {
        if (createdAt == null) return "--";
        Duration duration = Duration.between(createdAt, LocalDateTime.now());
        if (duration.toDays() > 0) return duration.toDays() + "d";
        if (duration.toHours() > 0) return duration.toHours() + "h";
        return Math.max(1, duration.toMinutes()) + "m";
    }
}
