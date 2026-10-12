package com.aegisflow.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;

@RestController
@RequestMapping("/api/settings")
public class SettingsController {

    private final AtomicReference<String> apiBaseUrl;
    private final AtomicBoolean webhooksEnabled = new AtomicBoolean(true);

    public SettingsController(@Value("${aegisflow.api-base-url:http://localhost:8080/api}") String apiBaseUrl) {
        this.apiBaseUrl = new AtomicReference<>(apiBaseUrl);
    }

    @GetMapping
    public Map<String, Object> getSettings() {
        return ApiResponses.map("apiBaseUrl", apiBaseUrl.get(), "webhooksEnabled", webhooksEnabled.get());
    }

    @PatchMapping
    public Map<String, Object> updateSettings(@RequestBody Map<String, Object> body) {
        Object enabled = body.get("webhooksEnabled");
        if (enabled instanceof Boolean value) webhooksEnabled.set(value);
        Object baseUrl = body.get("apiBaseUrl");
        if (baseUrl instanceof String value && !value.isBlank()) apiBaseUrl.set(value.trim());
        return getSettings();
    }
}
