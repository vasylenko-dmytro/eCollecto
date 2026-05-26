package com.vasylenko.ecollectobackend.common.security;

import com.vasylenko.ecollectobackend.designer.DesignerRepository;
import com.vasylenko.ecollectobackend.fdc.FirstDayCoverRepository;
import com.vasylenko.ecollectobackend.stamp.StampRepository;
import com.vasylenko.ecollectobackend.stamp.StampService;
import com.vasylenko.ecollectobackend.tariff.TariffsRepository;
import com.vasylenko.ecollectobackend.user.UserDto;
import com.vasylenko.ecollectobackend.user.UserRepository;
import com.vasylenko.ecollectobackend.user.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Bean;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class SecurityConfigTest {

    @Autowired
    private MockMvc mockMvc;

    // Mock all MongoDB repositories so the context starts without a live database
    @MockitoBean StampRepository stampRepository;
    @MockitoBean DesignerRepository designerRepository;
    @MockitoBean FirstDayCoverRepository firstDayCoverRepository;
    @MockitoBean TariffsRepository tariffsRepository;
    @MockitoBean UserRepository userRepository;

    // Mock services to avoid business logic side effects
    @MockitoBean StampService stampService;
    @MockitoBean UserService userService;

    // Mock CurrentUserService so it does not cast principal to Jwt in tests
    @MockitoBean CurrentUserService currentUserService;

    /**
     * Provides a mock JwtDecoder so the context starts without a live Keycloak.
     */
    @TestConfiguration
    static class MockJwtDecoderConfig {
        @Bean
        JwtDecoder jwtDecoder() {
            return mock(JwtDecoder.class);
        }
    }

    @Test
    void publicEndpoints_shouldBeAccessibleWithoutAuth() throws Exception {
        when(stampService.findAll()).thenReturn(List.of());

        mockMvc.perform(get("/api/stamps"))
               .andExpect(status().isOk());
    }

    @Test
    void protectedEndpoint_withoutToken_shouldReturn401() throws Exception {
        mockMvc.perform(get("/api/me"))
               .andExpect(status().isUnauthorized());
    }

    @Test
    void protectedEndpoint_withUserRole_shouldReturn200() throws Exception {
        when(currentUserService.getCurrentUserId()).thenReturn("mock-user-id");
        when(userService.getOrCreateProfile(anyString()))
            .thenReturn(UserDto.builder().id("mock-user-id").email("test@test.com").name("Test").build());

        mockMvc.perform(get("/api/me")
                .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_USER"))))
               .andExpect(status().isOk());
    }

    @Test
    void adminEndpoint_withUserRole_shouldReturn403() throws Exception {
        mockMvc.perform(get("/api/admin/test")
                .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_USER"))))
               .andExpect(status().isForbidden());
    }
}
