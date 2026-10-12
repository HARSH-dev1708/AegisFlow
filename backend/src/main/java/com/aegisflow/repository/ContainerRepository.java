package com.aegisflow.repository;

import com.aegisflow.domain.Container;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ContainerRepository extends JpaRepository<Container, Long> {
	long countByProject_Id(Long projectId);
	long countByStatusIgnoreCase(String status);
}
