package com.aegisflow.repository;

import com.aegisflow.domain.Environment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EnvironmentRepository extends JpaRepository<Environment, Long> {
    List<Environment> findAllByOrderByNameAsc();

    Optional<Environment> findByNameIgnoreCase(String name);
}
