package com.aegisflow.repository;

import com.aegisflow.domain.KubernetesPod;
import org.springframework.data.jpa.repository.JpaRepository;

public interface KubernetesPodRepository extends JpaRepository<KubernetesPod, Long> {
	long countByProject_Id(Long projectId);
	long countByStatusIgnoreCase(String status);
}
