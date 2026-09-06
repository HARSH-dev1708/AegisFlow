// Comprehensive mock dataset for AegisFlow DevSecOps Platform

export const mockDashboardData = {
  projects: 12,
  activePipelines: 5,
  securityIssues: 8,
  runningContainers: 24,
  kubernetesPods: 42,
  deployments: 18,
  securityScore: 87,
  trends: {
    projects: "+2 this week",
    activePipelines: "3 running, 2 queued",
    securityIssues: "-4 resolved",
    runningContainers: "99.8% uptime",
    kubernetesPods: "5 nodes healthy",
    deployments: "+5 today"
  },
  deploymentActivity: [
    { time: "00:00", success: 3, failed: 0 },
    { time: "04:00", success: 5, failed: 1 },
    { time: "08:00", success: 12, failed: 0 },
    { time: "12:00", success: 18, failed: 2 },
    { time: "16:00", success: 14, failed: 1 },
    { time: "20:00", success: 8, failed: 0 }
  ],
  pipelineSuccessRate: [
    { name: "Successful", value: 45, color: "#10b981" },
    { name: "Failed", value: 6, color: "#f43f5e" },
    { name: "Running", value: 5, color: "#06b6d4" }
  ],
  securityVulnerabilities: [
    { severity: "Critical", count: 1, color: "#f43f5e" },
    { severity: "High", count: 3, color: "#f97316" },
    { severity: "Medium", count: 4, color: "#eab308" },
    { severity: "Low", count: 8, color: "#3b82f6" }
  ],
  resourceUsage: [
    { time: "10:00", cpu: 32, memory: 48, network: 120 },
    { time: "10:05", cpu: 45, memory: 52, network: 180 },
    { time: "10:10", cpu: 38, memory: 50, network: 140 },
    { time: "10:15", cpu: 62, memory: 58, network: 290 },
    { time: "10:20", cpu: 55, memory: 56, network: 240 },
    { time: "10:25", cpu: 41, memory: 53, network: 160 }
  ]
};

export const mockProjects = [
  {
    id: "proj-1",
    name: "Aegis API",
    description: "Core Spring Boot backend microservice delivering REST APIs and Auth.",
    environment: "Production",
    status: "Healthy",
    securityScore: 92,
    repository: "aegisflow/aegis-api",
    branch: "main",
    lastDeployment: "10 minutes ago",
    containersCount: 4,
    podsCount: 8,
    activePipelines: 1
  },
  {
    id: "proj-2",
    name: "Frontend SaaS",
    description: "React Vite single-page application dashboard for DevSecOps users.",
    environment: "Production",
    status: "Healthy",
    securityScore: 88,
    repository: "aegisflow/frontend-web",
    branch: "main",
    lastDeployment: "1 hour ago",
    containersCount: 2,
    podsCount: 4,
    activePipelines: 0
  },
  {
    id: "proj-3",
    name: "Payment Gateway Service",
    description: "PCI-DSS compliant payment processing worker and webhook router.",
    environment: "Staging",
    status: "Warning",
    securityScore: 74,
    repository: "aegisflow/payment-svc",
    branch: "staging",
    lastDeployment: "3 hours ago",
    containersCount: 3,
    podsCount: 6,
    activePipelines: 2
  },
  {
    id: "proj-4",
    name: "Auth & Identity Service",
    description: "OAuth2 / JWT token issuer, RBAC permission checker, and SSO.",
    environment: "Development",
    status: "Failed",
    securityScore: 61,
    repository: "aegisflow/auth-service",
    branch: "feature/oauth",
    lastDeployment: "Yesterday",
    containersCount: 1,
    podsCount: 2,
    activePipelines: 1
  }
];

export const mockPipelines = [
  {
    id: "pipe-101",
    projectId: "proj-1",
    projectName: "Aegis API",
    branch: "main",
    commit: "7f8b92c",
    author: "Alex Morgan",
    status: "Running",
    startTime: "2 mins ago",
    duration: "1m 45s",
    stages: [
      { name: "Code", status: "PASSED", duration: "12s" },
      { name: "Build", status: "PASSED", duration: "45s" },
      { name: "Test", status: "PASSED", duration: "28s" },
      { name: "SAST", status: "PASSED", duration: "18s" },
      { name: "Dependency Scan", status: "PASSED", duration: "14s" },
      { name: "Docker Build", status: "PASSED", duration: "32s" },
      { name: "Container Scan", status: "PASSED", duration: "15s" },
      { name: "Kubernetes Deploy", status: "RUNNING", duration: "--" },
      { name: "Production", status: "PENDING", duration: "--" }
    ]
  },
  {
    id: "pipe-102",
    projectId: "proj-2",
    projectName: "Frontend SaaS",
    branch: "main",
    commit: "3a91e4f",
    author: "Sarah Chen",
    status: "Success",
    startTime: "1 hour ago",
    duration: "3m 12s",
    stages: [
      { name: "Code", status: "PASSED", duration: "8s" },
      { name: "Build", status: "PASSED", duration: "34s" },
      { name: "Test", status: "PASSED", duration: "42s" },
      { name: "SAST", status: "PASSED", duration: "12s" },
      { name: "Dependency Scan", status: "PASSED", duration: "10s" },
      { name: "Docker Build", status: "PASSED", duration: "25s" },
      { name: "Container Scan", status: "PASSED", duration: "11s" },
      { name: "Kubernetes Deploy", status: "PASSED", duration: "30s" },
      { name: "Production", status: "PASSED", duration: "20s" }
    ]
  },
  {
    id: "pipe-103",
    projectId: "proj-4",
    projectName: "Auth & Identity Service",
    branch: "feature/oauth",
    commit: "9c12b77",
    author: "David Kim",
    status: "Failed",
    startTime: "Yesterday",
    duration: "1m 18s",
    stages: [
      { name: "Code", status: "PASSED", duration: "10s" },
      { name: "Build", status: "PASSED", duration: "38s" },
      { name: "Test", status: "PASSED", duration: "20s" },
      { name: "SAST", status: "FAILED", duration: "10s" },
      { name: "Dependency Scan", status: "SKIPPED", duration: "--" },
      { name: "Docker Build", status: "SKIPPED", duration: "--" },
      { name: "Container Scan", status: "SKIPPED", duration: "--" },
      { name: "Kubernetes Deploy", status: "SKIPPED", duration: "--" },
      { name: "Production", status: "SKIPPED", duration: "--" }
    ]
  }
];

export const mockSecurityOverview = {
  score: 87,
  scanners: [
    { name: "SAST", status: "Passed", badge: "success", detail: "SonarQube & Semgrep clean" },
    { name: "Dependency Scan", status: "Warning", badge: "warning", detail: "2 vulnerable NPM packages" },
    { name: "Container Scan", status: "Passed", badge: "success", detail: "Trivy: 0 Critical, 1 Low" },
    { name: "Secrets Scan", status: "Passed", badge: "success", detail: "Gitleaks: No hardcoded credentials" },
    { name: "IaC Scan", status: "Warning", badge: "warning", detail: "Checkov: 1 Terraform open port rule" }
  ],
  vulnerabilities: [
    {
      id: "VULN-001",
      severity: "CRITICAL",
      cve: "CVE-2024-21626",
      package: "runc <= 1.1.11",
      project: "Payment Gateway Service",
      status: "OPEN",
      action: "Upgrade to runc v1.1.12",
      path: "/usr/bin/runc"
    },
    {
      id: "VULN-002",
      severity: "HIGH",
      cve: "CVE-2023-44487",
      package: "netty-handler 4.1.97",
      project: "Aegis API",
      status: "IN_REVIEW",
      action: "Patch HTTP/2 Rapid Reset",
      path: "pom.xml -> io.netty:netty-handler"
    },
    {
      id: "VULN-003",
      severity: "HIGH",
      cve: "CVE-2024-1086",
      package: "linux-kernel-6.1",
      project: "Auth & Identity Service",
      status: "OPEN",
      action: "Rebase base container image",
      path: "Dockerfile -> FROM debian:bookworm-slim"
    },
    {
      id: "VULN-004",
      severity: "MEDIUM",
      cve: "CVE-2023-30533",
      package: "axios 1.4.0",
      project: "Frontend SaaS",
      status: "RESOLVED",
      action: "Updated to axios 1.7.2",
      path: "package.json -> axios"
    },
    {
      id: "VULN-005",
      severity: "LOW",
      cve: "CVE-2023-26159",
      package: "follow-redirects 1.15.2",
      project: "Payment Gateway Service",
      status: "OPEN",
      action: "Update dependency version",
      path: "package-lock.json"
    }
  ]
};

export const mockContainers = [
  {
    id: "cnt-1",
    name: "aegis-api-prod-1",
    image: "aegisflow/aegis-api:v1.4.2",
    status: "Running",
    cpu: "12%",
    memory: "256MB",
    created: "2 days ago",
    ports: "8080:8080"
  },
  {
    id: "cnt-2",
    name: "frontend-web-prod-1",
    image: "aegisflow/aegis-web:v2.1.0",
    status: "Running",
    cpu: "8%",
    memory: "180MB",
    created: "1 day ago",
    ports: "80:80"
  },
  {
    id: "cnt-3",
    name: "payment-worker-1",
    image: "aegisflow/payment-worker:v1.8",
    status: "Stopped",
    cpu: "--",
    memory: "--",
    created: "3 days ago",
    ports: "--"
  },
  {
    id: "cnt-4",
    name: "auth-service-dev-1",
    image: "aegisflow/auth-service:v0.9-beta",
    status: "Running",
    cpu: "19%",
    memory: "320MB",
    created: "4 hours ago",
    ports: "9090:9090"
  }
];

export const mockKubernetesData = {
  overview: {
    status: "Healthy",
    nodes: 5,
    pods: 42,
    deployments: 15,
    services: 18,
    namespaces: 8
  },
  nodes: [
    { name: "node-k8s-master-01", role: "Control Plane", status: "Ready", cpuUsage: "28%", memUsage: "45%", kubeletVersion: "v1.29.2" },
    { name: "node-k8s-worker-01", role: "Worker", status: "Ready", cpuUsage: "64%", memUsage: "72%", kubeletVersion: "v1.29.2" },
    { name: "node-k8s-worker-02", role: "Worker", status: "Ready", cpuUsage: "52%", memUsage: "68%", kubeletVersion: "v1.29.2" },
    { name: "node-k8s-worker-03", role: "Worker", status: "Ready", cpuUsage: "41%", memUsage: "59%", kubeletVersion: "v1.29.2" }
  ],
  pods: [
    { name: "aegis-api-7b89f-k4l9m", namespace: "production", status: "Running", restarts: 0, age: "2d", node: "node-k8s-worker-01" },
    { name: "frontend-web-54cd9-99zx1", namespace: "production", status: "Running", restarts: 0, age: "1d", node: "node-k8s-worker-02" },
    { name: "payment-svc-98a12-plq77", namespace: "staging", status: "Running", restarts: 2, age: "12h", node: "node-k8s-worker-03" },
    { name: "auth-service-12d45-ff110", namespace: "development", status: "CrashLoopBackOff", restarts: 5, age: "3h", node: "node-k8s-worker-01" }
  ],
  deployments: [
    { name: "aegis-api-deployment", namespace: "production", replicas: "3/3", updated: "3d", available: "3" },
    { name: "frontend-web-deployment", namespace: "production", replicas: "2/2", updated: "1d", available: "2" },
    { name: "payment-svc-deployment", namespace: "staging", replicas: "2/2", updated: "4d", available: "2" }
  ],
  services: [
    { name: "aegis-api-svc", namespace: "production", type: "ClusterIP", clusterIp: "10.96.12.44", port: "8080/TCP" },
    { name: "frontend-ingress-svc", namespace: "production", type: "LoadBalancer", clusterIp: "10.96.88.102", port: "80:30080/TCP" }
  ],
  namespaces: [
    { name: "default", status: "Active", age: "120d" },
    { name: "production", status: "Active", age: "90d" },
    { name: "staging", status: "Active", age: "60d" },
    { name: "development", status: "Active", age: "30d" },
    { name: "kube-system", status: "Active", age: "120d" }
  ]
};

export const mockDeployments = [
  {
    id: "dep-901",
    version: "v1.8.2",
    project: "Aegis API",
    environment: "Production",
    status: "Success",
    time: "Today at 10:42",
    dockerImage: "aegisflow/aegis-api:v1.8.2",
    namespace: "production",
    replicas: 3,
    deployedBy: "Alex Morgan"
  },
  {
    id: "dep-902",
    version: "v1.8.1",
    project: "Aegis API",
    environment: "Production",
    status: "Success",
    time: "Yesterday at 16:15",
    dockerImage: "aegisflow/aegis-api:v1.8.1",
    namespace: "production",
    replicas: 3,
    deployedBy: "Sarah Chen"
  },
  {
    id: "dep-903",
    version: "v1.8.0",
    project: "Payment Gateway Service",
    environment: "Production",
    status: "Failed",
    time: "Aug 31 at 09:30",
    dockerImage: "aegisflow/payment-svc:v1.8.0",
    namespace: "production",
    replicas: 2,
    deployedBy: "David Kim"
  }
];

export const mockMonitoringData = {
  cpu: [
    { timestamp: "14:00", value: 34 },
    { timestamp: "14:15", value: 42 },
    { timestamp: "14:30", value: 65 },
    { timestamp: "14:45", value: 48 },
    { timestamp: "15:00", value: 39 }
  ],
  memory: [
    { timestamp: "14:00", value: 4.2 },
    { timestamp: "14:15", value: 4.5 },
    { timestamp: "14:30", value: 5.1 },
    { timestamp: "14:45", value: 4.8 },
    { timestamp: "15:00", value: 4.6 }
  ],
  network: [
    { timestamp: "14:00", in: 120, out: 340 },
    { timestamp: "14:15", in: 180, out: 490 },
    { timestamp: "14:30", in: 310, out: 820 },
    { timestamp: "14:45", in: 240, out: 610 },
    { timestamp: "15:00", in: 190, out: 450 }
  ],
  requests: [
    { timestamp: "14:00", rps: 1240 },
    { timestamp: "14:15", rps: 1580 },
    { timestamp: "14:30", rps: 2450 },
    { timestamp: "14:45", rps: 1890 },
    { timestamp: "15:00", rps: 1420 }
  ],
  latency: [
    { timestamp: "14:00", p50: 12, p95: 45, p99: 120 },
    { timestamp: "14:15", p50: 14, p95: 52, p99: 140 },
    { timestamp: "14:30", p50: 22, p95: 98, p99: 280 },
    { timestamp: "14:45", p50: 16, p95: 60, p99: 160 },
    { timestamp: "15:00", p50: 13, p95: 48, p99: 130 }
  ],
  errors: [
    { timestamp: "14:00", rate: 0.02 },
    { timestamp: "14:15", rate: 0.05 },
    { timestamp: "14:30", rate: 0.42 },
    { timestamp: "14:45", rate: 0.12 },
    { timestamp: "15:00", rate: 0.03 }
  ]
};

export const mockLogsData = [
  { id: "log-1", timestamp: "10:42:31", level: "INFO", message: "Deployment pipeline triggered by webhook event: push on branch main", service: "PipelineEngine" },
  { id: "log-2", timestamp: "10:42:34", level: "INFO", message: "Pulling Docker image aegisflow/aegis-api:v1.8.2 from Registry", service: "DockerDaemon" },
  { id: "log-3", timestamp: "10:42:36", level: "WARN", message: "High latency detected in dependency resolver pool (142ms)", service: "MavenBuild" },
  { id: "log-4", timestamp: "10:42:39", level: "INFO", message: "Container aegis-api-prod-1 started on port 8080:8080", service: "ContainerRuntime" },
  { id: "log-5", timestamp: "10:42:41", level: "INFO", message: "Kubernetes pod created: aegis-api-7b89f-k4l9m in namespace 'production'", service: "KubeController" },
  { id: "log-6", timestamp: "10:42:45", level: "INFO", message: "Executing health check HTTP GET http://10.96.12.44:8080/actuator/health", service: "HealthChecker" },
  { id: "log-7", timestamp: "10:42:48", level: "INFO", message: "Health check passed with HTTP 200 OK status 'UP'", service: "HealthChecker" },
  { id: "log-8", timestamp: "10:42:50", level: "INFO", message: "Deployment successful. Traffic switched to v1.8.2", service: "TrafficRouter" },
  { id: "log-9", timestamp: "10:43:02", level: "ERROR", message: "Failed to resolve DNS query for secondary DB replica db-slave-02.internal", service: "DatabasePool" },
  { id: "log-10", timestamp: "10:43:15", level: "WARN", message: "JWT token validation cache miss for user devops@aegisflow.io", service: "AuthService" }
];
