package com.aegisflow.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "clusters")
@Getter
@Setter
@NoArgsConstructor
public class Cluster {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String name;

    @Column(nullable = false, length = 50)
    private String provider;

    @Column(nullable = false, length = 255)
    private String endpoint;

    @Column(nullable = false, length = 30)
    private String status;

    public Cluster(String name, String provider, String endpoint, String status) {
        this.name = name;
        this.provider = provider;
        this.endpoint = endpoint;
        this.status = status;
    }
}
