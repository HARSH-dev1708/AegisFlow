package com.aegisflow.controller;

import com.aegisflow.domain.User;
import com.aegisflow.repository.UserRepository;
import com.aegisflow.service.AuthService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final String REFRESH_COOKIE = "aegisflow_refresh_token";

    private final AuthService authService;
    private final UserRepository userRepository;
    private final Duration refreshTokenTtl;
    private final boolean secureCookie;

    public AuthController(AuthService authService, UserRepository userRepository,
                          @Value("${aegisflow.auth.refresh-token-ttl:PT168H}") Duration refreshTokenTtl,
                          @Value("${aegisflow.auth.cookie-secure:true}") boolean secureCookie) {
        this.authService = authService;
        this.userRepository = userRepository;
        this.refreshTokenTtl = refreshTokenTtl;
        this.secureCookie = secureCookie;
    }

    @PostMapping("/register")
    public Map<String, Object> register(@RequestBody Map<String, Object> body, HttpServletResponse response) {
        Map<String, Object> session = authService.register(
                required(body, "name"), required(body, "email"), required(body, "password"));
        setRefreshCookie(response, session);
        return withoutRefreshToken(session);
    }

    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody Map<String, Object> body, HttpServletResponse response) {
        Map<String, Object> session = authService.login(required(body, "email"), required(body, "password"));
        setRefreshCookie(response, session);
        return withoutRefreshToken(session);
    }

    @PostMapping("/refresh")
    public Map<String, Object> refresh(HttpServletRequest request, HttpServletResponse response) {
        Map<String, Object> session = authService.refresh(cookieValue(request.getCookies()));
        setRefreshCookie(response, session);
        return withoutRefreshToken(session);
    }

    @PostMapping("/logout")
    public Map<String, Object> logout(HttpServletRequest request, HttpServletResponse response) {
        authService.logout(cookieValue(request.getCookies()));
        clearRefreshCookie(response);
        return Map.of("success", true);
    }

    @GetMapping("/me")
    public Map<String, Object> me(@AuthenticationPrincipal Jwt jwt) {
        User user = userRepository.findById(Long.parseLong(jwt.getSubject()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Session user not found"));
        return userResponse(user);
    }

    private void setRefreshCookie(HttpServletResponse response, Map<String, Object> session) {
        ResponseCookie cookie = ResponseCookie.from(REFRESH_COOKIE, (String) session.get("refreshToken"))
                .httpOnly(true)
                .secure(secureCookie)
                .sameSite("Strict")
                .path("/api/auth")
                .maxAge(refreshTokenTtl)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private void clearRefreshCookie(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from(REFRESH_COOKIE, "")
                .httpOnly(true)
                .secure(secureCookie)
                .sameSite("Strict")
                .path("/api/auth")
                .maxAge(Duration.ZERO)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private static String cookieValue(Cookie[] cookies) {
        if (cookies == null) return null;
        for (Cookie cookie : cookies) {
            if (REFRESH_COOKIE.equals(cookie.getName())) return cookie.getValue();
        }
        return null;
    }

    private static Map<String, Object> withoutRefreshToken(Map<String, Object> session) {
        return Map.of("token", session.get("token"), "user", session.get("user"));
    }

    private static Map<String, Object> userResponse(User user) {
        return ApiResponses.map("id", user.getId(), "name", user.getUsername(),
                "email", user.getEmail(), "role", user.getRole().getName());
    }

    private static String required(Map<String, Object> body, String field) {
        String value = ApiResponses.text(body, field, null);
        if (value == null || value.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, field + " is required");
        }
        return value;
    }
}
