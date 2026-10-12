package com.aegisflow.config;

import com.aegisflow.domain.Role;
import com.aegisflow.domain.User;
import com.aegisflow.repository.RoleRepository;
import com.aegisflow.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Locale;

@Configuration
public class AdminBootstrapConfiguration {

    @Bean
    @ConditionalOnProperty(name = "aegisflow.bootstrap-admin.enabled", havingValue = "true")
    ApplicationRunner bootstrapAdmin(RoleRepository roleRepository, UserRepository userRepository,
                                     PasswordEncoder passwordEncoder,
                                     @Value("${aegisflow.bootstrap-admin.name:AegisFlow Admin}") String name,
                                     @Value("${aegisflow.bootstrap-admin.email:}") String email,
                                     @Value("${aegisflow.bootstrap-admin.password:}") String password) {
        return arguments -> {
            if (email.isBlank() || !email.trim().matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")
                    || password.length() < 8 || password.getBytes(java.nio.charset.StandardCharsets.UTF_8).length > 72) {
                throw new IllegalStateException(
                        "Set a valid BOOTSTRAP_ADMIN_EMAIL and an 8-to-72-byte BOOTSTRAP_ADMIN_PASSWORD");
            }
            String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);
            Role adminRole = roleRepository.findByNameIgnoreCase("ADMIN")
                    .orElseGet(() -> roleRepository.save(new Role("ADMIN", "Platform administrator")));
            User admin = userRepository.findByEmailIgnoreCase(normalizedEmail)
                    .orElseGet(() -> new User(name.trim(), normalizedEmail, passwordEncoder.encode(password), adminRole));
            admin.setRole(adminRole);
            userRepository.save(admin);
        };
    }
}
