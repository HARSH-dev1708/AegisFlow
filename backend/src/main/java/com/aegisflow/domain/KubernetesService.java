package com.aegisflow.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "kubernetes_services")
@Getter
@Setter
@NoArgsConstructor
public class KubernetesService {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(nullable = false, length = 100)
    private String namespace;

    @Column(nullable = false, length = 30)
    private String type;

    @Column(name = "cluster_ip", length = 45)
    private String clusterIp;

    @Column(length = 100)
    private String port;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cluster_id")
    private Cluster cluster;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public KubernetesService(String name, String namespace, String type, String clusterIp, String port, Cluster cluster) {
        this.name = name;
        this.namespace = namespace;
        this.type = type;
        this.clusterIp = clusterIp;
        this.port = port;
        this.cluster = cluster;
        this.createdAt = LocalDateTime.now();
    }
}
