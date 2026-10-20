package com.aegisflow.repository;

import com.aegisflow.domain.Pipeline;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PipelineRepository extends JpaRepository<Pipeline, Long> {
	List<Pipeline> findAllByOrderByCreatedAtDesc();

	long countByProject_IdAndStatusIgnoreCase(Long projectId, String status);
}
