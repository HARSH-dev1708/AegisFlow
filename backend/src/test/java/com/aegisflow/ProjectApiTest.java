package com.aegisflow;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.aegisflow.domain.Environment;
import com.aegisflow.domain.Role;
import com.aegisflow.domain.User;
import com.aegisflow.repository.EnvironmentRepository;
import com.aegisflow.repository.RoleRepository;
import com.aegisflow.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(properties = "aegisflow.demo-data.enabled=false")
@AutoConfigureMockMvc
class ProjectApiTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EnvironmentRepository environmentRepository;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
        environmentRepository.deleteAll();
        roleRepository.deleteAll();
        Role role = roleRepository.save(new Role("ADMIN", "Administrator"));
        userRepository.save(new User("Demo User", "demo@example.com", "hashed-password", role));
        environmentRepository.save(new Environment("development", "Development", "Development environment"));
    }

    @Test
    void createsAndListsProjectsUsingFrontendFields() throws Exception {
        mockMvc.perform(post("/api/projects")
                        .contentType("application/json")
                        .content("""
                                {"name":"Sample API","description":"Demo project","environment":"Development","repository":"https://github.com/example/sample-api"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Sample API"))
                .andExpect(jsonPath("$.environment").value("Development"))
                .andExpect(jsonPath("$.repository").value("https://github.com/example/sample-api"));

        mockMvc.perform(get("/api/projects"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Sample API"));
    }
}
