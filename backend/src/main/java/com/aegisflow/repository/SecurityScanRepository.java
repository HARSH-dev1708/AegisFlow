package com.aegisflow.repository;

import com.aegisflow.domain.SecurityScan;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SecurityScanRepository extends JpaRepository<SecurityScan, Long> {
}
