package com.aegisflow.repository;

import com.aegisflow.domain.KubernetesService;
import org.springframework.data.jpa.repository.JpaRepository;

public interface KubernetesServiceRepository extends JpaRepository<KubernetesService, Long> {
}
