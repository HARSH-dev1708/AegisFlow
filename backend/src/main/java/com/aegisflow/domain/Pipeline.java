package com.aegisflow.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "pipelines")
@Getter
@Setter
@NoArgsConstructor
public class Pipeline {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(nullable = false, length = 100)
    private String branch;

    @Column(name = "commit_hash", length = 50)
    private String commitHash;

    @Column(nullable = false, length = 30)
    private String status;

    @Column(name = "trigger_source", nullable = false, length = 20)
    private String triggerSource = "MANUAL";

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "finished_at")
    private LocalDateTime finishedAt;

    @Column(name = "duration_seconds")
    private Long durationSeconds;

    @OrderBy("id ASC")
    @OneToMany(mappedBy = "pipeline", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PipelineStage> stages = new ArrayList<>();

    public Pipeline(String name, String branch, String commitHash, String status, Project project) {
        this(name, branch, commitHash, status, project, "MANUAL");
    }

    public Pipeline(String name, String branch, String commitHash, String status, Project project,
                    String triggerSource) {
        this.name = name;
        this.branch = branch;
        this.commitHash = commitHash;
        this.status = status;
        this.project = project;
        this.triggerSource = triggerSource;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
}
