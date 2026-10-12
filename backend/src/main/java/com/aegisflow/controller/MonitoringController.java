package com.aegisflow.controller;

import com.aegisflow.domain.Environment;
import com.aegisflow.domain.MonitoringMetric;
import com.aegisflow.domain.Project;
import com.aegisflow.repository.EnvironmentRepository;
import com.aegisflow.repository.MonitoringMetricRepository;
import com.aegisflow.repository.ProjectRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@RestController
@RequestMapping("/api/monitoring")
public class MonitoringController {

    private final MonitoringMetricRepository metricRepository;
    private final ProjectRepository projectRepository;
    private final EnvironmentRepository environmentRepository;

    public MonitoringController(MonitoringMetricRepository metricRepository, ProjectRepository projectRepository,
                                EnvironmentRepository environmentRepository) {
        this.metricRepository = metricRepository;
        this.projectRepository = projectRepository;
        this.environmentRepository = environmentRepository;
    }

    @GetMapping("/overview")
    public Map<String, Object> getOverview(@RequestParam(defaultValue = "1H") String range) {
        List<MonitoringMetric> metrics = findMetrics(range);
        return ApiResponses.map("cpu", values(metrics, "cpu"), "memory", values(metrics, "memory"),
                "network", networkValues(metrics), "requests", requestValues(metrics),
                "latency", latencyValues(metrics), "errors", values(metrics, "errors"));
    }

    @GetMapping("/cpu")
    public List<Map<String, Object>> cpu(@RequestParam(defaultValue = "1H") String range) {
        return values(findMetrics(range), "cpu");
    }

    @GetMapping("/memory")
    public List<Map<String, Object>> memory(@RequestParam(defaultValue = "1H") String range) {
        return values(findMetrics(range), "memory");
    }

    @GetMapping("/network")
    public List<Map<String, Object>> network(@RequestParam(defaultValue = "1H") String range) {
        return networkValues(findMetrics(range));
    }

    @GetMapping("/requests")
    public List<Map<String, Object>> requests(@RequestParam(defaultValue = "1H") String range) {
        return requestValues(findMetrics(range));
    }

    @GetMapping("/latency")
    public List<Map<String, Object>> latency(@RequestParam(defaultValue = "1H") String range) {
        return latencyValues(findMetrics(range));
    }

    @GetMapping("/errors")
    public List<Map<String, Object>> errors(@RequestParam(defaultValue = "1H") String range) {
        return values(findMetrics(range), "errors");
    }

    @PostMapping
    public Map<String, Object> record(@RequestBody Map<String, Object> body) {
        Long projectId = ApiResponses.longValue(body, "projectId");
        Project project = projectId == null ? projectRepository.findAll().stream().findFirst().orElse(null)
                : projectRepository.findById(projectId).orElse(null);
        if (project == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A valid projectId is required");
        String metricName = ApiResponses.text(body, "metricName", null);
        Object rawValue = body.get("metricValue");
        if (metricName == null || rawValue == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "metricName and metricValue are required");
        Environment environment = project.getEnvironment();
        MonitoringMetric metric = metricRepository.save(new MonitoringMetric(metricName.toLowerCase(Locale.ROOT),
                Double.valueOf(rawValue.toString()), ApiResponses.text(body, "unit", null), project, environment));
        return ApiResponses.map("id", metric.getId(), "metricName", metric.getMetricName(),
                "metricValue", metric.getMetricValue(), "unit", metric.getUnit(), "timestamp", ApiResponses.time(metric.getCapturedAt()));
    }

    private List<MonitoringMetric> findMetrics(String range) {
        LocalDateTime cutoff = LocalDateTime.now().minusHours(switch (range.toUpperCase(Locale.ROOT)) {
            case "6H" -> 6;
            case "24H" -> 24;
            case "7D" -> 168;
            default -> 1;
        });
        return metricRepository.findByCapturedAtAfterOrderByCapturedAtAsc(cutoff);
    }

    private static List<Map<String, Object>> values(List<MonitoringMetric> metrics, String name) {
        return metrics.stream().filter(metric -> metric.getMetricName().equalsIgnoreCase(name))
                .map(metric -> ApiResponses.map("timestamp", ApiResponses.time(metric.getCapturedAt()),
                        "value", metric.getMetricValue())).toList();
    }

    private static List<Map<String, Object>> networkValues(List<MonitoringMetric> metrics) {
        Map<String, Map<String, Object>> byTime = new LinkedHashMap<>();
        metrics.stream().filter(metric -> metric.getMetricName().startsWith("network."))
                .forEach(metric -> byTime.computeIfAbsent(ApiResponses.time(metric.getCapturedAt()), timestamp ->
                        ApiResponses.map("timestamp", timestamp, "in", 0, "out", 0))
                        .put(metric.getMetricName().endsWith("in") ? "in" : "out", metric.getMetricValue()));
        return List.copyOf(byTime.values());
    }

    private static List<Map<String, Object>> requestValues(List<MonitoringMetric> metrics) {
        return metrics.stream().filter(metric -> metric.getMetricName().equalsIgnoreCase("requests"))
                .map(metric -> ApiResponses.map("timestamp", ApiResponses.time(metric.getCapturedAt()), "rps", metric.getMetricValue())).toList();
    }

    private static List<Map<String, Object>> latencyValues(List<MonitoringMetric> metrics) {
        Map<String, Map<String, Object>> byTime = new LinkedHashMap<>();
        metrics.stream().filter(metric -> metric.getMetricName().startsWith("latency."))
                .forEach(metric -> byTime.computeIfAbsent(ApiResponses.time(metric.getCapturedAt()), timestamp ->
                        ApiResponses.map("timestamp", timestamp, "p50", 0, "p95", 0, "p99", 0))
                        .put(metric.getMetricName().substring("latency.".length()), metric.getMetricValue()));
        return List.copyOf(byTime.values());
    }
}
