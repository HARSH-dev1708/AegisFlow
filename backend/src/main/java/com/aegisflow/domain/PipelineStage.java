package com.aegisflow.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "pipeline_stages")
@Getter
@Setter
@NoArgsConstructor
public class PipelineStage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 30)
    private String status;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "ended_at")
    private LocalDateTime endedAt;

    @Column(name = "duration_seconds")
    private Long durationSeconds;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "pipeline_id", nullable = false)
    private Pipeline pipeline;

    public PipelineStage(String name, String status, Pipeline pipeline) {
        this.name = name;
        this.status = status;
        this.pipeline = pipeline;
        if ("RUNNING".equalsIgnoreCase(status)) {
            this.startedAt = LocalDateTime.now();
        }
    }
}
