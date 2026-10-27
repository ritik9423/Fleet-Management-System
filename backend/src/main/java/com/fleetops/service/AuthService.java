package com.fleetops.service;


import com.fleetops.dto.request.AuthRequest;
import com.fleetops.dto.request.RegisterRequest;
import com.fleetops.dto.response.AuthResponse;
import com.fleetops.exception.BusinessException;
import com.fleetops.model.Driver;
import com.fleetops.model.User;
import com.fleetops.model.enums.Role;
import com.fleetops.repository.DriverRepository;
import com.fleetops.repository.UserRepository;
import com.fleetops.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final DriverRepository driverRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Value("${app.jwt.expiration}")
    private long jwtExpiration;

    public AuthResponse login(AuthRequest request) {
        String inputUname = request.getUsername() != null ? request.getUsername().trim() : "";
        String inputPwd = request.getPassword() != null ? request.getPassword() : "";

        User user = userRepository.findByIdentifier(inputUname)
                .orElseThrow(() -> new BusinessException("Invalid username or password"));

        // Strict check: Driver can ONLY log in with the exact password set by Admin
        if (!passwordEncoder.matches(inputPwd, user.getPassword())) {
            throw new BusinessException("Invalid username or password");
        }

        String token = jwtUtil.generateToken(user);
        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .username(user.getUsername())
                .role(user.getRole().name())
                .expiresIn(jwtExpiration)
                .build();
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BusinessException("Username already taken: " + request.getUsername());
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException("Email already registered: " + request.getEmail());
        }
        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .build();
        userRepository.save(user);

        if (request.getRole() == Role.DRIVER && !driverRepository.existsByEmail(request.getEmail())) {
            driverRepository.save(Driver.builder()
                    .firstName(request.getUsername())
                    .lastName("Driver")
                    .email(request.getEmail())
                    .phone("+91 98000 00000")
                    .licenseNumber("DL-" + (System.currentTimeMillis() % 100000000))
                    .licenseExpiry(LocalDate.now().plusYears(3))
                    .active(true)
                    .user(user)
                    .build());
        }

        String token = jwtUtil.generateToken(user);
        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .username(user.getUsername())
                .role(user.getRole().name())
                .expiresIn(jwtExpiration)
                .build();
    }
}
