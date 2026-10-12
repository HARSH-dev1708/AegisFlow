package com.aegisflow.repository;

import com.aegisflow.domain.MonitoringMetric;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface MonitoringMetricRepository extends JpaRepository<MonitoringMetric, Long> {
    List<MonitoringMetric> findByCapturedAtAfterOrderByCapturedAtAsc(LocalDateTime cutoff);
}
