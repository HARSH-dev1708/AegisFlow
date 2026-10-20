package com.aegisflow.repository;

import com.aegisflow.domain.Deployment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DeploymentRepository extends JpaRepository<Deployment, Long> {
    Optional<Deployment> findFirstByProject_IdOrderByDeployedAtDesc(Long projectId);
}
