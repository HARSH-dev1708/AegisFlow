package com.aegisflow.repository;

import com.aegisflow.domain.PipelineStage;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PipelineStageRepository extends JpaRepository<PipelineStage, Long> {
}
