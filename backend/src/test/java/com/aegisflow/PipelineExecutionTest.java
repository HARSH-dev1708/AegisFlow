package com.aegisflow;

import com.aegisflow.domain.Environment;
import com.aegisflow.domain.Project;
import com.aegisflow.domain.Role;
import com.aegisflow.domain.User;
import com.aegisflow.repository.EnvironmentRepository;
import com.aegisflow.repository.ProjectRepository;
import com.aegisflow.repository.RoleRepository;
import com.aegisflow.repository.UserRepository;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "aegisflow.demo-data.enabled=false",
        "spring.datasource.url=jdbc:h2:mem:pipeline-execution-test;DB_CLOSE_DELAY=-1;MODE=PostgreSQL"
})
@AutoConfigureMockMvc
class PipelineExecutionTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EnvironmentRepository environmentRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private Long projectId;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
        projectRepository.deleteAll();
        environmentRepository.deleteAll();
        roleRepository.deleteAll();
        Role role = roleRepository.save(new Role("ADMIN", "Pipeline test administrator"));
        User owner = userRepository.save(new User("Pipeline Owner", "pipeline@example.com",
                passwordEncoder.encode("pipeline-password"), role));
        Environment environment = environmentRepository.save(
                new Environment("development", "Development", "Test environment"));
        projectId = projectRepository.save(new Project("Pipeline Test Project", "Pipeline test",
                "https://example.com/pipeline-test", "Healthy", environment, owner)).getId();
    }

    @Test
    void tracksManualAndWebhookRunsWithStagesLogsDurationsAndDashboardCounts() throws Exception {
        String token = loginToken();
        MvcResult created = mockMvc.perform(post("/api/pipelines")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"projectId":%d,"branch":"feature/tracking","commit":"a1b2c3"}
                                """.formatted(projectId)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("Queued"))
                .andExpect(jsonPath("$.triggerSource").value("MANUAL"))
                .andExpect(jsonPath("$.duration").value("Queued"))
                .andExpect(jsonPath("$.stages").isArray())
                .andExpect(jsonPath("$.stages[0].status").value("PENDING"))
                .andReturn();
        Long runId = idFrom(created);
        Number firstStageIdValue = JsonPath.read(created.getResponse().getContentAsString(), "$.stages[0].id");
        Number secondStageIdValue = JsonPath.read(created.getResponse().getContentAsString(), "$.stages[1].id");
        Long firstStageId = firstStageIdValue.longValue();
        Long secondStageId = secondStageIdValue.longValue();

        Role developerRole = roleRepository.save(new Role("DEVELOPER", "Pipeline test developer"));
        userRepository.save(new User("Other Developer", "other-pipeline@example.com",
                passwordEncoder.encode("other-password"), developerRole));
        String otherToken = loginToken("other-pipeline@example.com", "other-password");
        mockMvc.perform(patch("/api/pipelines/{runId}/stages/{stageId}", runId, firstStageId)
                        .header("Authorization", "Bearer " + otherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"status":"RUNNING"}
                                """))
                .andExpect(status().isForbidden());

        mockMvc.perform(patch("/api/pipelines/{runId}/stages/{stageId}", runId, secondStageId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"status":"RUNNING"}
                                """))
                .andExpect(status().isConflict());

        mockMvc.perform(patch("/api/pipelines/{runId}/stages/{stageId}", runId, firstStageId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"status":"RUNNING","log":"Checkout completed"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("Running"))
                .andExpect(jsonPath("$.stages[0].startedAt").isNotEmpty());
        mockMvc.perform(patch("/api/pipelines/{runId}/stages/{stageId}", runId, firstStageId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"status":"PASSED"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.stages[0].durationSeconds").isNumber());

        mockMvc.perform(patch("/api/pipelines/{runId}/stages/{stageId}", runId, secondStageId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"status":"RUNNING"}
                                """))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/pipelines/{runId}/logs", runId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"level":"INFO","message":"Build output persisted"}
                                """))
                .andExpect(status().isCreated());
        mockMvc.perform(patch("/api/pipelines/{runId}/stages/{stageId}", runId, secondStageId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"status":"FAILED","log":"Compiler returned a non-zero exit code"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("Failed"))
                .andExpect(jsonPath("$.finishedAt").isNotEmpty())
                .andExpect(jsonPath("$.stages[1].status").value("FAILED"))
                .andExpect(jsonPath("$.stages[2].status").value("SKIPPED"));
        MvcResult buildLogs = mockMvc.perform(get("/api/pipelines/{runId}/logs", runId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();
        String storedLogs = buildLogs.getResponse().getContentAsString();
        org.junit.jupiter.api.Assertions.assertTrue(storedLogs.contains("Build output persisted"));
        org.junit.jupiter.api.Assertions.assertTrue(storedLogs.contains("Compiler returned a non-zero exit code"));

        MvcResult retry = mockMvc.perform(post("/api/pipelines/{runId}/retry", runId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("Queued"))
                .andExpect(jsonPath("$.triggerSource").value("MANUAL"))
                .andReturn();
        Long retryId = idFrom(retry);
        org.junit.jupiter.api.Assertions.assertNotEquals(runId, retryId);

        MvcResult webhook = mockMvc.perform(post("/api/pipelines/webhook")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"projectId":%d,"branch":"main","commit":"d4e5f6"}
                                """.formatted(projectId)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.triggerSource").value("WEBHOOK"))
                .andExpect(jsonPath("$.status").value("Queued"))
                .andReturn();
        Long webhookId = idFrom(webhook);
        mockMvc.perform(post("/api/pipelines/{runId}/cancel", webhookId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("Cancelled"))
                .andExpect(jsonPath("$.finishedAt").isNotEmpty());

        MvcResult successful = mockMvc.perform(post("/api/pipelines")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"projectId":%d,"branch":"main"}
                                """.formatted(projectId)))
                .andExpect(status().isCreated())
                .andReturn();
        Long successfulId = idFrom(successful);
        List<Number> successStages = JsonPath.read(successful.getResponse().getContentAsString(), "$.stages[*].id");
        for (Object stageValue : successStages) {
            Long stageId = ((Number) stageValue).longValue();
            mockMvc.perform(patch("/api/pipelines/{runId}/stages/{stageId}", successfulId, stageId)
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"status":"RUNNING"}
                                    """))
                    .andExpect(status().isOk());
            mockMvc.perform(patch("/api/pipelines/{runId}/stages/{stageId}", successfulId, stageId)
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"status":"PASSED"}
                                    """))
                    .andExpect(status().isOk());
        }
        mockMvc.perform(get("/api/pipelines/{runId}", successfulId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("Success"))
                .andExpect(jsonPath("$.finishedAt").isNotEmpty())
                .andExpect(jsonPath("$.durationSeconds").isNumber());

        mockMvc.perform(get("/api/dashboard").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pipelineSuccessRate[0].value").value(1))
                .andExpect(jsonPath("$.pipelineSuccessRate[1].value").value(1))
                .andExpect(jsonPath("$.pipelineSuccessRate[3].value").value(1))
                .andExpect(jsonPath("$.pipelineSuccessRate[4].value").value(1));
    }

    private String loginToken() throws Exception {
        return loginToken("pipeline@example.com", "pipeline-password");
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

    private static Long idFrom(MvcResult result) throws Exception {
        Number id = JsonPath.read(result.getResponse().getContentAsString(), "$.id");
        return id.longValue();
    }
}
