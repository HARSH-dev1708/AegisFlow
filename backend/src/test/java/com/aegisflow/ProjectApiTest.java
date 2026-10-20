package com.aegisflow;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import com.aegisflow.domain.Environment;
import com.aegisflow.domain.Role;
import com.aegisflow.domain.User;
import com.aegisflow.repository.EnvironmentRepository;
import com.aegisflow.repository.RoleRepository;
import com.aegisflow.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.http.MediaType;

@SpringBootTest(properties = {
        "aegisflow.demo-data.enabled=false",
        "spring.datasource.url=jdbc:h2:mem:project-api-test;DB_CLOSE_DELAY=-1;MODE=PostgreSQL"
})
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

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
        environmentRepository.deleteAll();
        roleRepository.deleteAll();
        Role role = roleRepository.save(new Role("ADMIN", "Administrator"));
        userRepository.save(new User("Demo User", "demo@example.com",
                passwordEncoder.encode("demo-password"), role));
        environmentRepository.save(new Environment("development", "Development", "Development environment"));
        environmentRepository.save(new Environment("staging", "Staging", "Staging environment"));
    }

    @Test
    void createsAndListsProjectsUsingFrontendFields() throws Exception {
        String token = loginToken();
        MvcResult created = mockMvc.perform(post("/api/projects")
                        .header("Authorization", "Bearer " + token)
                        .contentType("application/json")
                        .content("""
                                {"name":"Sample API","description":"Demo project","environment":"Development","repository":"https://github.com/example/sample-api"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Sample API"))
                .andExpect(jsonPath("$.environment").value("Development"))
                .andExpect(jsonPath("$.repository").value("https://github.com/example/sample-api"))
                .andExpect(jsonPath("$.deploymentStatus").value("Not deployed"))
                .andExpect(jsonPath("$.archived").value(false))
                .andReturn();

        Number projectIdValue = JsonPath.read(created.getResponse().getContentAsString(), "$.id");
        Long projectId = projectIdValue.longValue();
        Role developerRole = roleRepository.save(new Role("DEVELOPER", "Project developer"));
        User developer = userRepository.save(new User("Other User", "other@example.com",
                passwordEncoder.encode("other-password"), developerRole));
        String developerToken = loginToken("other@example.com", "other-password");
        mockMvc.perform(put("/api/projects/{id}", projectId)
                        .header("Authorization", "Bearer " + developerToken)
                        .contentType("application/json")
                        .content("""
                                {"name":"Unauthorized update"}
                                """))
                .andExpect(status().isForbidden());

        mockMvc.perform(put("/api/projects/{id}", projectId)
                        .header("Authorization", "Bearer " + token)
                        .contentType("application/json")
                        .content("""
                                {"name":"Updated API","description":"Updated description","environment":"Staging","repository":"https://github.com/example/updated-api"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Updated API"))
                .andExpect(jsonPath("$.environment").value("Staging"))
                .andExpect(jsonPath("$.repository").value("https://github.com/example/updated-api"));

        mockMvc.perform(post("/api/deployments")
                        .header("Authorization", "Bearer " + token)
                        .contentType("application/json")
                        .content("""
                                {"project":"Updated API","version":"v2.0.0"}
                                """))
                .andExpect(status().isCreated());
        mockMvc.perform(get("/api/projects/{id}", projectId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.deploymentStatus").value("SUCCESS"))
                .andExpect(jsonPath("$.status").value("Healthy"));

        mockMvc.perform(patch("/api/projects/{id}/archive", projectId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.archived").value(true));
        mockMvc.perform(get("/api/projects").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
        mockMvc.perform(get("/api/projects").param("archived", "true")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Updated API"));

        mockMvc.perform(patch("/api/projects/{id}/restore", projectId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.archived").value(false));
        mockMvc.perform(get("/api/projects").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Updated API"));

        mockMvc.perform(post("/api/projects")
                        .header("Authorization", "Bearer " + developerToken)
                        .contentType("application/json")
                        .content("""
                                {"name":"Developer-owned API","environment":"Development"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.ownerId").value(developer.getId()));
    }

    private String loginToken() throws Exception {
        return loginToken("demo@example.com", "demo-password");
    }

    private String loginToken(String email, String password) throws Exception {
        MvcResult login = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s","password":"%s"}
                                """.formatted(email, password)))
                .andExpect(status().isOk())
                .andReturn();
        return JsonPath.read(login.getResponse().getContentAsString(), "$.token");
    }
}
