package com.aegisflow.controller;

import com.aegisflow.domain.Project;
import com.aegisflow.domain.SecurityScan;
import com.aegisflow.domain.Vulnerability;
import com.aegisflow.repository.ProjectRepository;
import com.aegisflow.repository.SecurityScanRepository;
import com.aegisflow.repository.VulnerabilityRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/security")
public class SecurityController {

    private final VulnerabilityRepository vulnerabilityRepository;
    private final SecurityScanRepository scanRepository;
    private final ProjectRepository projectRepository;

    public SecurityController(VulnerabilityRepository vulnerabilityRepository, SecurityScanRepository scanRepository,
                              ProjectRepository projectRepository) {
        this.vulnerabilityRepository = vulnerabilityRepository;
        this.scanRepository = scanRepository;
        this.projectRepository = projectRepository;
    }

    @GetMapping("/overview")
    public Map<String, Object> getOverview() {
        List<Vulnerability> findings = vulnerabilityRepository.findAll();
        List<SecurityScan> scans = scanRepository.findAll();
        Long projectId = projectRepository.findAll().stream().map(Project::getId).findFirst().orElse(null);
        List<Map<String, Object>> scanners = scans.stream().map(scan -> ApiResponses.map(
                "name", scan.getName(), "status", displayStatus(scan.getStatus()),
                "badge", "FAILED".equalsIgnoreCase(scan.getStatus()) ? "danger" : "success",
                "detail", scan.getScanType() + " scan, score " + (scan.getScore() == null ? "not rated" : scan.getScore())))
                .toList();
        return ApiResponses.map("score", findings.isEmpty() ? 100 : Math.max(0, 100 - findings.size() * 5),
                "projectId", projectId, "scanners", scanners,
                "vulnerabilities", findings.stream().map(this::toFinding).toList());
    }

    @GetMapping("/findings")
    public List<Map<String, Object>> getFindings() {
        return vulnerabilityRepository.findAll().stream().map(this::toFinding).toList();
    }

    @GetMapping("/findings/{id}")
    public Map<String, Object> getFinding(@PathVariable Long id) {
        return toFinding(findFinding(id));
    }

    @PatchMapping("/findings/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> updateFinding(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Vulnerability finding = findFinding(id);
        finding.setStatus(ApiResponses.text(body, "status", finding.getStatus()));
        return toFinding(vulnerabilityRepository.save(finding));
    }

    @PostMapping("/scan/{projectId}")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> triggerScan(@PathVariable String projectId) {
        Project project = resolveProject(projectId);
        SecurityScan scan = scanRepository.save(new SecurityScan("SAST", "SAST", "RUNNING", null, project));
        return ApiResponses.map("success", true, "scanId", scan.getId(), "message", "Security scan queued for " + project.getName());
    }

    private Map<String, Object> toFinding(Vulnerability finding) {
        String fixedVersion = finding.getFixedInVersion();
        return ApiResponses.map("id", finding.getId(), "severity", finding.getSeverity().toUpperCase(),
                "cve", finding.getCve(), "package", finding.getPackageName(),
                "project", finding.getProject().getName(), "status", finding.getStatus().toUpperCase(),
                "action", fixedVersion == null ? "Review and remediate finding" : "Upgrade to " + fixedVersion,
                "path", finding.getPackageName(), "description", finding.getDescription());
    }

    private Project resolveProject(String projectId) {
        try {
            return projectRepository.findById(Long.parseLong(projectId))
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found"));
        } catch (NumberFormatException exception) {
            return projectRepository.findAll().stream().findFirst()
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found"));
        }
    }

    private Vulnerability findFinding(Long id) {
        return vulnerabilityRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Finding not found"));
    }

    private static String displayStatus(String status) {
        return status.isEmpty() ? status : status.substring(0, 1).toUpperCase() + status.substring(1).toLowerCase();
    }
}
