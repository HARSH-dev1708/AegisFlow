package com.aegisflow.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "containers")
@Getter
@Setter
@NoArgsConstructor
public class Container {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(nullable = false, length = 200)
    private String image;

    @Column(nullable = false, length = 30)
    private String status;

    @Column(name = "cpu_usage", length = 20)
    private String cpuUsage;

    @Column(name = "memory_usage", length = 20)
    private String memoryUsage;

    @Column(length = 30)
    private String port;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cluster_id")
    private Cluster cluster;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public Container(String name, String image, String status, Project project) {
        this.name = name;
        this.image = image;
        this.status = status;
        this.project = project;
        this.createdAt = LocalDateTime.now();
    }
}
