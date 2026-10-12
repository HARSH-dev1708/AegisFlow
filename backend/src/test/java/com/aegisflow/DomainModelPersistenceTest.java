package com.aegisflow;

import static org.assertj.core.api.Assertions.assertThat;

import com.aegisflow.domain.Environment;
import com.aegisflow.domain.Project;
import com.aegisflow.domain.Pipeline;
import com.aegisflow.domain.Role;
import com.aegisflow.domain.User;
import com.aegisflow.repository.EnvironmentRepository;
import com.aegisflow.repository.PipelineRepository;
import com.aegisflow.repository.ProjectRepository;
import com.aegisflow.repository.RoleRepository;
import com.aegisflow.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;

@DataJpaTest
class DomainModelPersistenceTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private EnvironmentRepository environmentRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private PipelineRepository pipelineRepository;

    @Test
    void shouldPersistCoreDomainObjects() {
        Role role = roleRepository.save(new Role("ADMIN", "System administrator"));
        Environment environment = environmentRepository.save(new Environment("development", "Development", "Local development environment"));
        User user = userRepository.save(new User("alice", "alice@example.com", "secret-password", role));
        Project project = projectRepository.save(new Project("Aegis API", "Core API service", "https://github.com/example/aegis-api", "ACTIVE", environment, user));
        pipelineRepository.save(new Pipeline("build-and-test", "main", "abc123", "SUCCESS", project));

        assertThat(roleRepository.count()).isEqualTo(1);
        assertThat(environmentRepository.count()).isEqualTo(1);
        assertThat(userRepository.count()).isEqualTo(1);
        assertThat(projectRepository.count()).isEqualTo(1);
        assertThat(pipelineRepository.count()).isEqualTo(1);
    }
}
