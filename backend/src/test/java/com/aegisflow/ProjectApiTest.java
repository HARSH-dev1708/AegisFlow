package com.aegisflow;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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
    }

    @Test
    void createsAndListsProjectsUsingFrontendFields() throws Exception {
        String token = loginToken();
        mockMvc.perform(post("/api/projects")
                        .header("Authorization", "Bearer " + token)
                        .contentType("application/json")
                        .content("""
                                {"name":"Sample API","description":"Demo project","environment":"Development","repository":"https://github.com/example/sample-api"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Sample API"))
                .andExpect(jsonPath("$.environment").value("Development"))
                .andExpect(jsonPath("$.repository").value("https://github.com/example/sample-api"));

        mockMvc.perform(get("/api/projects").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Sample API"));
    }

    private String loginToken() throws Exception {
        MvcResult login = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"demo@example.com","password":"demo-password"}
                                """))
                .andExpect(status().isOk())
                .andReturn();
        return JsonPath.read(login.getResponse().getContentAsString(), "$.token");
    }
}
