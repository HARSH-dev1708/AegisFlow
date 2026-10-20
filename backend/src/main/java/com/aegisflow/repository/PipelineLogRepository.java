package com.aegisflow.repository;

import com.aegisflow.domain.PipelineLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PipelineLogRepository extends JpaRepository<PipelineLog, Long> {
    List<PipelineLog> findAllByPipeline_IdOrderByCreatedAtAscIdAsc(Long pipelineId);
}
