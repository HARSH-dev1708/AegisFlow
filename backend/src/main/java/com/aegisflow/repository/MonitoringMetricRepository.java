package com.aegisflow.repository;

import com.aegisflow.domain.MonitoringMetric;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MonitoringMetricRepository extends JpaRepository<MonitoringMetric, Long> {
}
