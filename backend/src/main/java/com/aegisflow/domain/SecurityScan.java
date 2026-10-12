package com.aegisflow.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "security_scans")
@Getter
@Setter
@NoArgsConstructor
public class SecurityScan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "scan_type", nullable = false, length = 50)
    private String scanType;

    @Column(nullable = false, length = 30)
    private String status;

    @Column(length = 10)
    private Integer score;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(name = "scanned_at", nullable = false)
    private LocalDateTime scannedAt;

    public SecurityScan(String name, String scanType, String status, Integer score, Project project) {
        this.name = name;
        this.scanType = scanType;
        this.status = status;
        this.score = score;
        this.project = project;
        this.scannedAt = LocalDateTime.now();
    }
}
