package com.aegisflow.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "monitoring_metrics")
@Getter
@Setter
@NoArgsConstructor
public class MonitoringMetric {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "metric_name", nullable = false, length = 100)
    private String metricName;

    @Column(name = "metric_value", nullable = false)
    private Double metricValue;

    @Column(length = 30)
    private String unit;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "environment_id")
    private Environment environment;

    @Column(name = "captured_at", nullable = false)
    private LocalDateTime capturedAt;

    public MonitoringMetric(String metricName, Double metricValue, String unit, Project project, Environment environment) {
        this.metricName = metricName;
        this.metricValue = metricValue;
        this.unit = unit;
        this.project = project;
        this.environment = environment;
        this.capturedAt = LocalDateTime.now();
    }
}
