package com.vasylenko.ecollectobackend;

import com.vasylenko.ecollectobackend.designer.DesignerRepository;
import com.vasylenko.ecollectobackend.fdc.FirstDayCoverRepository;
import com.vasylenko.ecollectobackend.stamp.StampRepository;
import com.vasylenko.ecollectobackend.tariff.TariffsRepository;
import com.vasylenko.ecollectobackend.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Bean;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.mockito.Mockito.mock;

/**
 * Generates the committed {@code openapi.yaml} by hitting the live Springdoc
 * endpoint ({@code /v3/api-docs.yaml}) during the test run.
 *
 * <h2>How contract validation works</h2>
 * <ol>
 *   <li>This test starts the full Spring context (with mocked MongoDB repos and a
 *       mock {@link JwtDecoder} so no real infrastructure is needed).</li>
 *   <li>It requests the current spec from Springdoc and overwrites
 *       {@code backend/ecollecto-backend/openapi.yaml}.</li>
 *   <li>CI runs {@code git diff --exit-code backend/ecollecto-backend/openapi.yaml}
 *       after the test task and fails the build when the committed file is stale.</li>
 * </ol>
 *
 * <h2>Updating the spec</h2>
 * When you add or change a controller/DTO, run:
 * <pre>{@code
 *   ./gradlew :backend:ecollecto-backend:test
 * }</pre>
 * then commit the regenerated {@code openapi.yaml}.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class OpenApiSpecTest {

    @LocalServerPort
    private int port;

    // ── Mock all MongoDB repositories so the context starts without a live database ──
    @MockitoBean StampRepository           stampRepository;
    @MockitoBean DesignerRepository        designerRepository;
    @MockitoBean FirstDayCoverRepository   firstDayCoverRepository;
    @MockitoBean TariffsRepository         tariffsRepository;
    @MockitoBean UserRepository            userRepository;

    /** Provides a mock JwtDecoder so the context starts without a live Keycloak. */
    @TestConfiguration
    static class MockJwtDecoderConfig {
        @Bean
        JwtDecoder jwtDecoder() {
            return mock(JwtDecoder.class);
        }
    }

    /**
     * Fetches the current OpenAPI spec from Springdoc and writes it to
     * {@code openapi.yaml} in the module root (Gradle working directory =
     * {@code backend/ecollecto-backend/}).
     */
    @Test
    void generateOpenApiSpec() throws Exception {
        String yaml = new RestTemplate()
                .getForObject("http://localhost:" + port + "/v3/api-docs.yaml", String.class);

        Path outputPath = Path.of("openapi.yaml");
        Files.writeString(outputPath, yaml != null ? yaml : "", StandardCharsets.UTF_8);
    }
}


