package com.aegisflow.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "kubernetes_pods")
@Getter
@Setter
@NoArgsConstructor
public class KubernetesPod {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(nullable = false, length = 100)
    private String namespace;

    @Column(nullable = false, length = 30)
    private String status;

    @Column(length = 20)
    private String ready;

    @Column(length = 20)
    private String restarts;

    @Column(name = "node_name", length = 100)
    private String nodeName;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cluster_id")
    private Cluster cluster;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public KubernetesPod(String name, String namespace, String status, Project project) {
        this.name = name;
        this.namespace = namespace;
        this.status = status;
        this.project = project;
        this.createdAt = LocalDateTime.now();
    }
}
