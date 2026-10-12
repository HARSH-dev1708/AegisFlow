package com.aegisflow.controller;

import com.aegisflow.domain.Role;
import com.aegisflow.domain.User;
import com.aegisflow.repository.RoleRepository;
import com.aegisflow.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private final Map<String, Long> sessions = new ConcurrentHashMap<>();

    public AuthController(UserRepository userRepository, RoleRepository roleRepository) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
    }

    @PostMapping("/register")
    public Map<String, Object> register(@RequestBody Map<String, Object> body) {
        String name = required(body, "name");
        String email = required(body, "email").toLowerCase();
        String password = required(body, "password");
        if (password.length() < 8) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password must contain at least 8 characters");
        if (userRepository.findAll().stream().anyMatch(user -> user.getEmail().equalsIgnoreCase(email))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with this email already exists");
        }
        Role role = roleRepository.findAll().stream().filter(existing -> "DEVELOPER".equalsIgnoreCase(existing.getName()))
                .findFirst().orElseGet(() -> roleRepository.save(new Role("DEVELOPER", "Project developer")));
        User user = userRepository.save(new User(name, email, passwordEncoder.encode(password), role));
        return createSession(user);
    }

    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody Map<String, Object> body) {
        String email = required(body, "email");
        String password = required(body, "password");
        User user = userRepository.findAll().stream().filter(candidate -> candidate.getEmail().equalsIgnoreCase(email))
                .findFirst().orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }
        return createSession(user);
    }

    @GetMapping("/me")
    public Map<String, Object> me(@RequestHeader(name = "Authorization", required = false) String authorization) {
        String token = authorization == null ? "" : authorization.replaceFirst("(?i)^Bearer\\s+", "");
        Long userId = sessions.get(token);
        if (userId == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Session expired");
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Session user not found"));
        return userResponse(user);
    }

    private Map<String, Object> createSession(User user) {
        String token = UUID.randomUUID().toString();
        sessions.put(token, user.getId());
        return ApiResponses.map("token", token, "user", userResponse(user));
    }

    private Map<String, Object> userResponse(User user) {
        return ApiResponses.map("id", user.getId(), "name", user.getUsername(),
                "email", user.getEmail(), "role", user.getRole().getName());
    }

    private static String required(Map<String, Object> body, String field) {
        String value = ApiResponses.text(body, field, null);
        if (value == null || value.isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, field + " is required");
        return value;
    }
}
