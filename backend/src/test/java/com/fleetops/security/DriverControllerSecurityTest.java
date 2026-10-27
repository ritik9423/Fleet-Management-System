package com.fleetops.security;

import com.fleetops.model.User;
import com.fleetops.model.enums.Role;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;

@SpringBootTest
@AutoConfigureMockMvc
public class DriverControllerSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtUtil jwtUtil;

    @Test
    void testGetDriversWithAdminToken() throws Exception {
        // Authenticate admin
        User admin = User.builder()
                .username("admin")
                .role(Role.ADMIN)
                .build();
        String token = jwtUtil.generateToken(admin);

        mockMvc.perform(get("/api/drivers")
                .header("Authorization", "Bearer " + token))
                .andDo(print());
    }

    @Test
    void testGetDriversWithDriverToken() throws Exception {
        User driver = User.builder()
                .username("rajesh.sharma")
                .role(Role.DRIVER)
                .build();
        String token = jwtUtil.generateToken(driver);

        mockMvc.perform(get("/api/drivers")
                .header("Authorization", "Bearer " + token))
                .andDo(print());
    }
}
