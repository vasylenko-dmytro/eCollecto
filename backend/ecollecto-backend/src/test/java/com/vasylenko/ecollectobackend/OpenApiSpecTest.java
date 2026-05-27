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
import java.util.AbstractMap;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

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
     *
     * <p>The raw YAML from Springdoc is post-processed by {@link #sortResponseCodes(String)}
     * to guarantee that HTTP status-code blocks within each {@code responses:} section are
     * always written in ascending numeric order.  Springdoc's {@code ApiResponses} class
     * extends {@link java.util.LinkedHashMap} and has a custom Jackson serializer that
     * bypasses {@code ORDER_MAP_ENTRIES_BY_KEYS}, so the insertion order (and therefore
     * the file content) would otherwise vary between JVM runs.
     */
    @Test
    void generateOpenApiSpec() throws Exception {
        String yaml = new RestTemplate()
                .getForObject("http://localhost:" + port + "/v3/api-docs.yaml", String.class);

        String normalized = sortResponseCodes(yaml != null ? yaml : "");

        Path outputPath = Path.of("openapi.yaml");
        Files.writeString(outputPath, normalized, StandardCharsets.UTF_8);
    }

    // ── Response-code normalizer ──────────────────────────────────────────────────────────

    /**
     * Matches a {@code responses:} key at ANY indentation level, e.g.
     * {@code "      responses:"}.
     */
    private static final Pattern RESPONSES_LINE =
            Pattern.compile("^(\\s+)responses:\\s*$");

    /**
     * Sorts all HTTP status-code blocks inside every {@code responses:} section of a
     * Springdoc-generated YAML string in ascending numeric order.
     *
     * <p>Only lines whose indentation is exactly {@code responsesIndent + 2} and whose
     * content starts with a quoted numeric key ({@code "NNN":}) are considered block
     * headers; everything else passes through unchanged.
     */
    static String sortResponseCodes(String yaml) {
        String[] inputLines = yaml.split("\n", -1);
        List<String> output = new ArrayList<>(inputLines.length + 16);
        int i = 0;

        while (i < inputLines.length) {
            String line = inputLines[i];
            Matcher m = RESPONSES_LINE.matcher(line);

            if (!m.matches()) {
                output.add(line);
                i++;
                continue;
            }

            // ── We are inside a `responses:` block ───────────────────────────
            int responsesIndent = m.group(1).length();
            int entryIndent     = responsesIndent + 2;
            output.add(line);
            i++;

            List<Map.Entry<Integer, List<String>>> blocks = new ArrayList<>();

            while (i < inputLines.length) {
                String l = inputLines[i];

                // A non-blank line at indent <= responsesIndent closes the section.
                if (!l.isBlank()) {
                    int lineIndent = l.length() - l.stripLeading().length();
                    if (lineIndent <= responsesIndent) break;
                }

                // Is this line the header of a new response-code block?
                if (!l.isBlank()) {
                    int lineIndent = l.length() - l.stripLeading().length();
                    if (lineIndent == entryIndent) {
                        Matcher km = Pattern.compile(
                                "^\\s{" + entryIndent + "}\"(\\d+)\":.*").matcher(l);
                        if (km.matches()) {
                            int code = Integer.parseInt(km.group(1));
                            List<String> blockLines = new ArrayList<>();
                            blockLines.add(l);
                            i++;

                            // Collect all lines belonging to this entry.
                            while (i < inputLines.length) {
                                String nl = inputLines[i];
                                if (!nl.isBlank()) {
                                    int ni = nl.length() - nl.stripLeading().length();
                                    if (ni <= entryIndent) break;
                                }
                                blockLines.add(nl);
                                i++;
                            }
                            blocks.add(new AbstractMap.SimpleEntry<>(code, blockLines));
                            continue; // re-evaluate current i
                        }
                    }
                }

                // Line inside the responses section but not a code block header
                // (e.g. non-numeric key) — pass through unchanged.
                output.add(l);
                i++;
            }

            // Emit blocks sorted by HTTP status code (ascending).
            blocks.sort(Comparator.comparingInt(Map.Entry::getKey));
            for (Map.Entry<Integer, List<String>> block : blocks) {
                output.addAll(block.getValue());
            }
        }

        return String.join("\n", output);
    }
}
