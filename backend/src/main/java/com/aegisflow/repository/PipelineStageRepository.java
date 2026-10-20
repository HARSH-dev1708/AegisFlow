package com.aegisflow.repository;

import com.aegisflow.domain.PipelineStage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PipelineStageRepository extends JpaRepository<PipelineStage, Long> {
	List<PipelineStage> findAllByPipeline_IdOrderByIdAsc(Long pipelineId);
}
