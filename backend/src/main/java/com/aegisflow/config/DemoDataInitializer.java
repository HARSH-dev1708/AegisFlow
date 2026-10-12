package com.aegisflow.config;

import com.aegisflow.domain.Cluster;
import com.aegisflow.domain.Container;
import com.aegisflow.domain.Deployment;
import com.aegisflow.domain.Environment;
import com.aegisflow.domain.KubernetesPod;
import com.aegisflow.domain.LogEvent;
import com.aegisflow.domain.MonitoringMetric;
import com.aegisflow.domain.Pipeline;
import com.aegisflow.domain.PipelineStage;
import com.aegisflow.domain.Project;
import com.aegisflow.domain.Role;
import com.aegisflow.domain.SecurityScan;
import com.aegisflow.domain.User;
import com.aegisflow.domain.Vulnerability;
import com.aegisflow.repository.ClusterRepository;
import com.aegisflow.repository.ContainerRepository;
import com.aegisflow.repository.DeploymentRepository;
import com.aegisflow.repository.EnvironmentRepository;
import com.aegisflow.repository.KubernetesPodRepository;
import com.aegisflow.repository.LogEventRepository;
import com.aegisflow.repository.MonitoringMetricRepository;
import com.aegisflow.repository.PipelineRepository;
import com.aegisflow.repository.PipelineStageRepository;
import com.aegisflow.repository.ProjectRepository;
import com.aegisflow.repository.RoleRepository;
import com.aegisflow.repository.SecurityScanRepository;
import com.aegisflow.repository.UserRepository;
import com.aegisflow.repository.VulnerabilityRepository;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.List;

@Configuration
@ConditionalOnProperty(name = "aegisflow.demo-data.enabled", havingValue = "true", matchIfMissing = true)
public class DemoDataInitializer {

    @Bean
    ApplicationRunner loadDemoData(RoleRepository roleRepository, EnvironmentRepository environmentRepository,
                                   UserRepository userRepository, ProjectRepository projectRepository,
                                   PipelineRepository pipelineRepository, PipelineStageRepository stageRepository,
                                   DeploymentRepository deploymentRepository, ContainerRepository containerRepository,
                                   ClusterRepository clusterRepository, KubernetesPodRepository podRepository,
                                   VulnerabilityRepository vulnerabilityRepository, SecurityScanRepository scanRepository,
                                   MonitoringMetricRepository metricRepository, LogEventRepository logRepository) {
        return arguments -> {
            if (userRepository.count() > 0) return;

            Role adminRole = roleRepository.save(new Role("ADMIN", "Demo platform administrator"));
            Environment production = environmentRepository.save(new Environment("production", "Production", "Production environment"));
            User admin = userRepository.save(new User("DevOps Lead", "devops@aegisflow.io",
                    new BCryptPasswordEncoder().encode("password123"), adminRole));
            Project project = projectRepository.save(new Project("Aegis API", "Core demo service",
                    "https://github.com/aegisflow/aegis-api", "Healthy", production, admin));

            Pipeline pipeline = pipelineRepository.save(new Pipeline("CI/CD", "main", "7f8b92c", "SUCCESS", project));
            for (String stageName : List.of("Code", "Build", "Test", "SAST", "Dependency Scan", "Docker Build", "Container Scan", "Kubernetes Deploy", "Production")) {
                PipelineStage stage = new PipelineStage(stageName, "PASSED", pipeline);
                stage.setDurationSeconds(12L);
                stageRepository.save(stage);
            }

            Cluster cluster = clusterRepository.save(new Cluster("demo-cluster", "Control Plane", "local-demo", "Ready"));
            Container container = new Container("aegis-api-prod-1", "aegisflow/aegis-api:v1.0.0", "Running", project);
            container.setCpuUsage("12%");
            container.setMemoryUsage("256MB");
            container.setPort("8080:8080");
            container.setCluster(cluster);
            containerRepository.save(container);

            KubernetesPod pod = new KubernetesPod("aegis-api-demo-1", "production", "Running", project);
            pod.setReady("1/1");
            pod.setRestarts("0");
            pod.setNodeName(cluster.getName());
            pod.setCluster(cluster);
            podRepository.save(pod);

            deploymentRepository.save(new Deployment("v1.0.0", "Success", project, production, admin,
                    "aegisflow/aegis-api:v1.0.0", "production", 1));
            vulnerabilityRepository.save(new Vulnerability("CVE-DEMO-001", "demo-library 1.0", "MEDIUM", "OPEN", project));
            scanRepository.save(new SecurityScan("Dependency Scan", "DEPENDENCY", "PASSED", 95, project));
            logRepository.save(new LogEvent("PipelineEngine", "INFO", "Demo pipeline completed successfully", project));
            logRepository.save(new LogEvent("ContainerRuntime", "INFO", "Demo container is running", project));

            metricRepository.save(new MonitoringMetric("cpu", 34.0, "%", project, production));
            metricRepository.save(new MonitoringMetric("memory", 4.2, "GB", project, production));
            metricRepository.save(new MonitoringMetric("network.in", 120.0, "MB/s", project, production));
            metricRepository.save(new MonitoringMetric("network.out", 340.0, "MB/s", project, production));
            metricRepository.save(new MonitoringMetric("requests", 1240.0, "req/s", project, production));
            metricRepository.save(new MonitoringMetric("latency.p50", 12.0, "ms", project, production));
            metricRepository.save(new MonitoringMetric("latency.p95", 45.0, "ms", project, production));
            metricRepository.save(new MonitoringMetric("latency.p99", 120.0, "ms", project, production));
            metricRepository.save(new MonitoringMetric("errors", 0.02, "%", project, production));
        };
    }
}
