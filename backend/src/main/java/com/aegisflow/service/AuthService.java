package com.aegisflow.service;

import com.aegisflow.domain.RefreshSession;
import com.aegisflow.domain.Role;
import com.aegisflow.domain.User;
import com.aegisflow.repository.RefreshSessionRepository;
import com.aegisflow.repository.RoleRepository;
import com.aegisflow.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class AuthService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final RefreshSessionRepository refreshSessionRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtEncoder jwtEncoder;
    private final Duration accessTokenTtl;
    private final Duration refreshTokenTtl;

    public AuthService(UserRepository userRepository, RoleRepository roleRepository,
                       RefreshSessionRepository refreshSessionRepository, PasswordEncoder passwordEncoder,
                       JwtEncoder jwtEncoder,
                       @Value("${aegisflow.auth.access-token-ttl:PT15M}") Duration accessTokenTtl,
                       @Value("${aegisflow.auth.refresh-token-ttl:PT168H}") Duration refreshTokenTtl) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.refreshSessionRepository = refreshSessionRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtEncoder = jwtEncoder;
        this.accessTokenTtl = accessTokenTtl;
        this.refreshTokenTtl = refreshTokenTtl;
    }

    @Transactional
    public Map<String, Object> register(String name, String email, String password) {
        String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);
        if (!normalizedEmail.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A valid email address is required");
        }
        if (name.trim().length() > 100 || normalizedEmail.length() > 150) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Name or email is too long");
        }
        if (password.length() < 8) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password must contain at least 8 characters");
        }
        if (password.getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password must not exceed 72 bytes");
        }
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with this email already exists");
        }
        Role role = roleRepository.findByNameIgnoreCase("DEVELOPER")
                .orElseGet(() -> roleRepository.save(new Role("DEVELOPER", "Project developer")));
        User user = userRepository.save(new User(name.trim(), normalizedEmail, passwordEncoder.encode(password), role));
        return createSession(user);
    }

    @Transactional
    public Map<String, Object> login(String email, String password) {
        User user = userRepository.findByEmailIgnoreCase(email.trim())
                .filter(candidate -> passwordEncoder.matches(password, candidate.getPassword()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));
        return createSession(user);
    }

    @Transactional
    public Map<String, Object> refresh(String rawRefreshToken) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh session is missing or expired");
        }
        RefreshSession session = refreshSessionRepository.findActiveByTokenHashForUpdate(hashToken(rawRefreshToken))
                .filter(existing -> existing.getExpiresAt().isAfter(Instant.now()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh session is missing or expired"));
        session.setRevokedAt(Instant.now());
        refreshSessionRepository.save(session);
        return createSession(session.getUser());
    }

    @Transactional
    public void logout(String rawRefreshToken) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) return;
        refreshSessionRepository.findActiveByTokenHashForUpdate(hashToken(rawRefreshToken))
                .ifPresent(session -> {
                    session.setRevokedAt(Instant.now());
                    refreshSessionRepository.save(session);
                });
    }

    private Map<String, Object> createSession(User user) {
        Instant now = Instant.now();
        String accessToken = jwtEncoder.encode(JwtEncoderParameters.from(JwtClaimsSet.builder()
                .issuer("aegisflow")
                .issuedAt(now)
                .expiresAt(now.plus(accessTokenTtl))
                .subject(user.getId().toString())
                .claim("roles", List.of("ROLE_" + user.getRole().getName().toUpperCase(Locale.ROOT)))
                .build())).getTokenValue();
        String refreshToken = newRefreshToken();
        refreshSessionRepository.save(new RefreshSession(
                hashToken(refreshToken), user, now.plus(refreshTokenTtl)));
        return Map.of(
                "token", accessToken,
                "refreshToken", refreshToken,
                "user", Map.of("id", user.getId(), "name", user.getUsername(),
                        "email", user.getEmail(), "role", user.getRole().getName()));
    }

    private static String newRefreshToken() {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static String hashToken(String token) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(token.getBytes(StandardCharsets.UTF_8)));
        } catch (java.security.NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is not available", exception);
        }
    }
}
