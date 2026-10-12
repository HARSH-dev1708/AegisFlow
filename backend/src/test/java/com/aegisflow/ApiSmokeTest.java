package com.aegisflow;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
class ApiSmokeTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void frontendApiGroupsReturnJsonAndDemoLoginWorks() throws Exception {
        for (String path : new String[]{
                "/api/projects", "/api/pipelines", "/api/dashboard", "/api/security/overview",
                "/api/security/findings", "/api/containers", "/api/deployments", "/api/monitoring/overview",
                "/api/monitoring/cpu", "/api/monitoring/memory", "/api/monitoring/network",
                "/api/monitoring/requests", "/api/monitoring/latency", "/api/monitoring/errors",
                "/api/kubernetes/overview", "/api/kubernetes/nodes", "/api/kubernetes/pods",
                "/api/kubernetes/deployments", "/api/kubernetes/services", "/api/kubernetes/namespaces",
                "/api/logs", "/api/settings"}) {
            mockMvc.perform(get(path)).andExpect(status().isOk());
        }

        MvcResult login = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"devops@aegisflow.io","password":"password123"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.email").value("devops@aegisflow.io"))
                .andReturn();
        String token = JsonPath.read(login.getResponse().getContentAsString(), "$.token");
        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("ADMIN"));

        mockMvc.perform(patch("/api/settings")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"apiBaseUrl":"http://localhost:8080/api","webhooksEnabled":false}
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.apiBaseUrl").value("http://localhost:8080/api"))
            .andExpect(jsonPath("$.webhooksEnabled").value(false));
    }
}
