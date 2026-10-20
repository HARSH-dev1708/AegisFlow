package com.aegisflow.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "pipeline_logs")
@Getter
@Setter
@NoArgsConstructor
public class PipelineLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "pipeline_id", nullable = false)
    private Pipeline pipeline;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false, length = 20)
    private String level;

    @Column(nullable = false, length = 4000)
    private String message;

    public PipelineLog(Pipeline pipeline, String level, String message) {
        this.pipeline = pipeline;
        this.createdAt = LocalDateTime.now();
        this.level = level;
        this.message = message;
    }
}
