package com.aegisflow.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "log_events")
@Getter
@Setter
@NoArgsConstructor
public class LogEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String source;

    @Column(nullable = false, length = 30)
    private String level;

    @Column(nullable = false, length = 1000)
    private String message;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public LogEvent(String source, String level, String message, Project project) {
        this.source = source;
        this.level = level;
        this.message = message;
        this.project = project;
        this.createdAt = LocalDateTime.now();
    }
}
