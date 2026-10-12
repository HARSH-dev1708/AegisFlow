package com.aegisflow.config;

import com.aegisflow.domain.*;
import com.aegisflow.repository.*;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDateTime;
import java.util.List;

@Configuration
@ConditionalOnProperty(name = "aegisflow.demo-data.enabled", havingValue = "true")
public class DemoDataInitializer {

    @Bean
    ApplicationRunner loadDemoData(RoleRepository roleRepository, EnvironmentRepository environmentRepository,
                                   UserRepository userRepository, ProjectRepository projectRepository,
                                   PipelineRepository pipelineRepository, PipelineStageRepository stageRepository,
                                   DeploymentRepository deploymentRepository, ContainerRepository containerRepository,
                                   ClusterRepository clusterRepository, KubernetesPodRepository podRepository,
                                   KubernetesServiceRepository serviceRepository,
                                   VulnerabilityRepository vulnerabilityRepository, SecurityScanRepository scanRepository,
                                   MonitoringMetricRepository metricRepository, LogEventRepository logRepository,
                                   PasswordEncoder passwordEncoder, PlatformTransactionManager transactionManager) {
        TransactionTemplate transaction = new TransactionTemplate(transactionManager);
        return arguments -> transaction.executeWithoutResult(status -> {
            if (projectRepository.count() > 0) return;

            Role adminRole = roleRepository.findByNameIgnoreCase("ADMIN")
                    .orElseGet(() -> roleRepository.save(new Role("ADMIN", "Local demo administrator")));
            roleRepository.findByNameIgnoreCase("DEVELOPER")
                    .orElseGet(() -> roleRepository.save(new Role("DEVELOPER", "Project developer")));

            Environment production = environmentRepository.save(
                    new Environment("production", "Production", "Production environment"));
            Environment staging = environmentRepository.save(
                    new Environment("staging", "Staging", "Pre-production validation environment"));
            Environment development = environmentRepository.save(
                    new Environment("development", "Development", "Development environment"));

            User admin = userRepository.findByEmailIgnoreCase("devops@aegisflow.io")
                    .orElseGet(() -> userRepository.save(new User("DevOps Lead", "devops@aegisflow.io",
                            passwordEncoder.encode("password123"), adminRole)));
            admin.setRole(adminRole);
            admin = userRepository.save(admin);

            Project apiProject = projectRepository.save(new Project("Aegis API", "Core platform REST service",
                    "https://github.com/aegisflow/aegis-api", "Healthy", production, admin));
            Project consoleProject = projectRepository.save(new Project("Frontend Console", "AegisFlow web application",
                    "https://github.com/aegisflow/console", "Healthy", staging, admin));
            Project workerProject = projectRepository.save(new Project("Payment Worker", "Asynchronous payment processor",
                    "https://github.com/aegisflow/payment-worker", "Degraded", development, admin));

            Pipeline successfulPipeline = pipelineRepository.save(
                    new Pipeline("CI/CD", "main", "7f8b92c", "SUCCESS", apiProject));
            Pipeline runningPipeline = pipelineRepository.save(
                    new Pipeline("Frontend Checks", "feature/auth", "3a91e4f", "RUNNING", consoleProject));
            Pipeline failedPipeline = pipelineRepository.save(
                    new Pipeline("Worker Release", "main", "9c12b77", "FAILED", workerProject));
            seedStages(stageRepository, successfulPipeline, "PASSED");
            seedStages(stageRepository, runningPipeline, "PENDING");
            runningPipeline.getStages().getFirst().setStatus("RUNNING");
            stageRepository.saveAll(runningPipeline.getStages());
            List<PipelineStage> failedStages = seedStages(stageRepository, failedPipeline, "SKIPPED");
            failedStages.getFirst().setStatus("PASSED");
            failedStages.get(1).setStatus("FAILED");
            stageRepository.saveAll(failedStages);

            Cluster cluster = clusterRepository.save(new Cluster(
                    "local-demo-cluster", "Kubernetes", "https://127.0.0.1:6443", "Ready"));
            clusterRepository.save(new Cluster(
                    "staging-cluster", "Kubernetes", "https://127.0.0.1:6444", "Ready"));

            seedContainer(containerRepository, "aegis-api-prod-1", "aegisflow/aegis-api:v1.8.2",
                    "Running", "12%", "256MB", "8080:8080", apiProject, cluster);
            seedContainer(containerRepository, "console-web-staging-1", "aegisflow/console:v2.1.0",
                    "Running", "8%", "180MB", "80:80", consoleProject, cluster);
            seedContainer(containerRepository, "payment-worker-dev-1", "aegisflow/payment-worker:v0.9.0",
                    "Stopped", "--", "--", "--", workerProject, cluster);

            seedPod(podRepository, "aegis-api-7b89f-k4l9m", "production", "Running", "0",
                    "local-demo-cluster", apiProject, cluster);
            seedPod(podRepository, "console-web-54cd9-99zx1", "staging", "Running", "0",
                    "local-demo-cluster", consoleProject, cluster);
            seedPod(podRepository, "payment-worker-98a12-plq77", "development", "CrashLoopBackOff", "5",
                    "staging-cluster", workerProject, clusterRepository.findAll().getLast());

            serviceRepository.save(new KubernetesService("aegis-api-svc", "production", "ClusterIP",
                    "10.96.12.44", "8080/TCP", cluster));
            serviceRepository.save(new KubernetesService("console-web-svc", "staging", "LoadBalancer",
                    "10.96.88.102", "80:30080/TCP", cluster));
            serviceRepository.save(new KubernetesService("payment-worker-svc", "development", "ClusterIP",
                    "10.96.41.10", "9090/TCP", clusterRepository.findAll().getLast()));

            seedDeployment(deploymentRepository, "v1.8.2", "Success", apiProject, production, admin,
                    "aegisflow/aegis-api:v1.8.2", 3, 1);
            seedDeployment(deploymentRepository, "v2.1.0", "Success", consoleProject, staging, admin,
                    "aegisflow/console:v2.1.0", 2, 5);
            seedDeployment(deploymentRepository, "v0.9.0", "Failed", workerProject, development, admin,
                    "aegisflow/payment-worker:v0.9.0", 1, 20);

            seedVulnerability(vulnerabilityRepository, "CVE-2024-21626", "runc 1.1.11",
                    "CRITICAL", "OPEN", "Container runtime escape risk", "1.1.12", apiProject);
            seedVulnerability(vulnerabilityRepository, "CVE-2023-44487", "netty-handler 4.1.97",
                    "HIGH", "IN_REVIEW", "HTTP/2 rapid reset denial of service", "4.1.100", apiProject);
            seedVulnerability(vulnerabilityRepository, "CVE-2024-1086", "linux-kernel 6.1",
                    "HIGH", "OPEN", "Kernel privilege escalation", "6.1.75", workerProject);
            seedVulnerability(vulnerabilityRepository, "CVE-2023-30533", "axios 1.4.0",
                    "MEDIUM", "RESOLVED", "Dependency issue resolved by package update", "1.7.2", consoleProject);
            seedVulnerability(vulnerabilityRepository, "CVE-2023-26159", "follow-redirects 1.15.2",
                    "LOW", "OPEN", "Redirect handling dependency finding", "1.15.6", apiProject);

            scanRepository.save(new SecurityScan("SAST", "SAST", "PASSED", 96, apiProject));
            scanRepository.save(new SecurityScan("Dependency Scan", "DEPENDENCY", "WARNING", 82, apiProject));
            scanRepository.save(new SecurityScan("Container Scan", "CONTAINER", "PASSED", 95, apiProject));
            scanRepository.save(new SecurityScan("Secrets Scan", "SECRETS", "PASSED", 100, consoleProject));
            scanRepository.save(new SecurityScan("IaC Scan", "IAC", "WARNING", 88, workerProject));

            seedLogs(logRepository, apiProject, consoleProject, workerProject);
            seedMetrics(metricRepository, apiProject, production);
            seedMetrics(metricRepository, consoleProject, staging);
        });
    }

    private static List<PipelineStage> seedStages(PipelineStageRepository repository, Pipeline pipeline, String status) {
        List<PipelineStage> stages = List.of("Code", "Build", "Test", "SAST", "Dependency Scan",
                        "Docker Build", "Container Scan", "Kubernetes Deploy", "Production").stream()
                .map(name -> {
                    PipelineStage stage = new PipelineStage(name, status, pipeline);
                    stage.setDurationSeconds("PASSED".equals(status) ? 12L : null);
                    return stage;
                }).toList();
        repository.saveAll(stages);
        pipeline.setStages(stages);
        return stages;
    }

    private static void seedContainer(ContainerRepository repository, String name, String image, String status,
                                      String cpu, String memory, String port, Project project, Cluster cluster) {
        Container container = new Container(name, image, status, project);
        container.setCpuUsage(cpu);
        container.setMemoryUsage(memory);
        container.setPort(port);
        container.setCluster(cluster);
        repository.save(container);
    }

    private static void seedPod(KubernetesPodRepository repository, String name, String namespace, String status,
                                String restarts, String node, Project project, Cluster cluster) {
        KubernetesPod pod = new KubernetesPod(name, namespace, status, project);
        pod.setReady("CrashLoopBackOff".equals(status) ? "0/1" : "1/1");
        pod.setRestarts(restarts);
        pod.setNodeName(node);
        pod.setCluster(cluster);
        repository.save(pod);
    }

    private static void seedDeployment(DeploymentRepository repository, String version, String status, Project project,
                                       Environment environment, User actor, String image, int replicas, int hoursAgo) {
        Deployment deployment = new Deployment(version, status, project, environment, actor,
                image, environment.getSlug(), replicas);
        deployment.setDeployedAt(LocalDateTime.now().minusHours(hoursAgo));
        repository.save(deployment);
    }

    private static void seedVulnerability(VulnerabilityRepository repository, String cve, String packageName,
                                          String severity, String status, String description, String fixedVersion,
                                          Project project) {
        Vulnerability vulnerability = new Vulnerability(cve, packageName, severity, status, project);
        vulnerability.setDescription(description);
        vulnerability.setFixedInVersion(fixedVersion);
        repository.save(vulnerability);
    }

    private static void seedLogs(LogEventRepository repository, Project apiProject, Project consoleProject,
                                 Project workerProject) {
        repository.save(new LogEvent("PipelineEngine", "INFO",
                "Main branch build completed successfully", apiProject));
        repository.save(new LogEvent("ContainerRuntime", "INFO",
                "API container started on port 8080", apiProject));
        repository.save(new LogEvent("KubeController", "WARN",
                "Payment worker pod restarted after failed health check", workerProject));
        repository.save(new LogEvent("FrontendBuild", "INFO",
                "Frontend asset bundle published to staging", consoleProject));
        repository.save(new LogEvent("SecurityScanner", "ERROR",
                "Critical container runtime finding requires remediation", apiProject));
    }

    private static void seedMetrics(MonitoringMetricRepository repository, Project project, Environment environment) {
        double[][] samples = {
                {34, 4.2, 120, 340, 1240, 12, 45, 120, 0.02},
                {42, 4.5, 180, 490, 1580, 14, 52, 140, 0.05},
                {65, 5.1, 310, 820, 2450, 22, 98, 280, 0.42},
                {48, 4.8, 240, 610, 1890, 16, 60, 160, 0.12},
                {39, 4.6, 190, 450, 1420, 13, 48, 130, 0.03}
        };
        String[] names = {"cpu", "memory", "network.in", "network.out", "requests",
                "latency.p50", "latency.p95", "latency.p99", "errors"};
        String[] units = {"%", "GB", "MB/s", "MB/s", "req/s", "ms", "ms", "ms", "%"};
        LocalDateTime now = LocalDateTime.now();
        for (int sampleIndex = 0; sampleIndex < samples.length; sampleIndex++) {
            for (int metricIndex = 0; metricIndex < names.length; metricIndex++) {
                MonitoringMetric metric = new MonitoringMetric(names[metricIndex], samples[sampleIndex][metricIndex],
                        units[metricIndex], project, environment);
                metric.setCapturedAt(now.minusMinutes((samples.length - sampleIndex - 1) * 12L));
                repository.save(metric);
            }
        }
    }
}
