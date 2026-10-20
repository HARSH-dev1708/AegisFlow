package com.aegisflow.controller;

import com.aegisflow.repository.EnvironmentRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/environments")
public class EnvironmentController {

    private final EnvironmentRepository environmentRepository;

    public EnvironmentController(EnvironmentRepository environmentRepository) {
        this.environmentRepository = environmentRepository;
    }

    @GetMapping
    public List<Map<String, Object>> getEnvironments() {
        return environmentRepository.findAllByOrderByNameAsc().stream()
                .map(environment -> ApiResponses.map(
                        "id", environment.getId(),
                        "name", environment.getName(),
                        "slug", environment.getSlug()))
                .toList();
    }
}
