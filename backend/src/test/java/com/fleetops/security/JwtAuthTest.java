package com.fleetops.security;

import com.fleetops.model.User;
import com.fleetops.model.enums.Role;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

public class JwtAuthTest {

    @Test
    void testTokenGenerationAndValidation() {
        JwtUtil jwtUtil = new JwtUtil();
        ReflectionTestUtils.setField(jwtUtil, "secret", "ZmxlZXRvcHNhcGlzZWNyZXRrZXlmb3Jqd3RhdXRoMjAyNg==");
        ReflectionTestUtils.setField(jwtUtil, "expiration", 86400000L);

        User user = User.builder()
                .username("admin")
                .role(Role.ADMIN)
                .email("admin@fleetops.com")
                .password("pass")
                .build();

        String token = jwtUtil.generateToken(user);
        System.out.println("Generated token: " + token);

        String username = jwtUtil.extractUsername(token);
        System.out.println("Extracted username: " + username);
        assertEquals("admin", username);

        boolean valid = jwtUtil.isTokenValid(token, user);
        System.out.println("Is valid: " + valid);
        assertTrue(valid);

        // Test with another user token
        User anotherUser = User.builder()
                .username("dispatcher")
                .role(Role.DISPATCHER)
                .email("dispatcher@fleetops.com")
                .password("pass")
                .build();
        String anotherToken = jwtUtil.generateToken(anotherUser);
        assertEquals("dispatcher", jwtUtil.extractUsername(anotherToken));
        assertTrue(jwtUtil.isTokenValid(anotherToken, anotherUser));
        assertFalse(jwtUtil.isTokenValid(token, anotherUser));
    }
}
