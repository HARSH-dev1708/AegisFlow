package com.aegisflow.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "deployments")
@Getter
@Setter
@NoArgsConstructor
public class Deployment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String version;

    @Column(nullable = false, length = 30)
    private String status;

    @Column(name = "docker_image", length = 200)
    private String dockerImage;

    @Column(length = 100)
    private String namespace;

    private Integer replicas;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "environment_id", nullable = false)
    private Environment environment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deployed_by_id")
    private User deployedBy;

    @Column(name = "deployed_at", nullable = false)
    private LocalDateTime deployedAt;

    public Deployment(String version, String status, Project project, Environment environment, User deployedBy) {
        this.version = version;
        this.status = status;
        this.project = project;
        this.environment = environment;
        this.deployedBy = deployedBy;
        this.deployedAt = LocalDateTime.now();
    }

    public Deployment(String version, String status, Project project, Environment environment, User deployedBy,
                      String dockerImage, String namespace, Integer replicas) {
        this(version, status, project, environment, deployedBy);
        this.dockerImage = dockerImage;
        this.namespace = namespace;
        this.replicas = replicas;
    }
}
