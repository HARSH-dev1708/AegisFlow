package com.aegisflow.repository;

import com.aegisflow.domain.Project;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProjectRepository extends JpaRepository<Project, Long> {
    List<Project> findAllByArchivedFalseOrderByUpdatedAtDesc();

    List<Project> findAllByArchivedTrueOrderByUpdatedAtDesc();
}
