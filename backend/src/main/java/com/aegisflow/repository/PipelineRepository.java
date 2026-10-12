package com.aegisflow.repository;

import com.aegisflow.domain.Pipeline;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PipelineRepository extends JpaRepository<Pipeline, Long> {
	long countByProject_IdAndStatusIgnoreCase(Long projectId, String status);
}
