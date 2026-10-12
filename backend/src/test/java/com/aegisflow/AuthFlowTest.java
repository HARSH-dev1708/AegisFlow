package com.aegisflow;

import com.jayway.jsonpath.JsonPath;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AuthFlowTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void registrationRefreshRotationLogoutAndRoleAccessWork() throws Exception {
        MvcResult registration = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Aegis Test User","email":"AuthFlow@example.com","password":"long-test-password"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.email").value("authflow@example.com"))
                .andExpect(jsonPath("$.user.role").value("DEVELOPER"))
                .andExpect(header().string("Set-Cookie",
                        org.hamcrest.Matchers.allOf(
                                org.hamcrest.Matchers.containsString("HttpOnly"),
                                org.hamcrest.Matchers.containsString("SameSite=Strict"),
                                org.hamcrest.Matchers.containsString("Path=/api/auth"))))
                .andReturn();
        String accessToken = JsonPath.read(registration.getResponse().getContentAsString(), "$.token");
        Cookie initialRefreshCookie = registration.getResponse().getCookie("aegisflow_refresh_token");

        mockMvc.perform(get("/api/dashboard"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/dashboard").header("Authorization", "Bearer invalid-token"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(patch("/api/settings")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"webhooksEnabled":false}
                                """))
                .andExpect(status().isForbidden());

        MvcResult refresh = mockMvc.perform(post("/api/auth/refresh").cookie(initialRefreshCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.role").value("DEVELOPER"))
                .andReturn();
        Cookie rotatedRefreshCookie = refresh.getResponse().getCookie("aegisflow_refresh_token");
        String refreshedAccessToken = JsonPath.read(refresh.getResponse().getContentAsString(), "$.token");
        org.junit.jupiter.api.Assertions.assertNotEquals(initialRefreshCookie.getValue(), rotatedRefreshCookie.getValue());

        mockMvc.perform(post("/api/auth/refresh").cookie(initialRefreshCookie))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/auth/logout").cookie(rotatedRefreshCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
        mockMvc.perform(post("/api/auth/refresh").cookie(rotatedRefreshCookie))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + refreshedAccessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("authflow@example.com"));
    }
}
