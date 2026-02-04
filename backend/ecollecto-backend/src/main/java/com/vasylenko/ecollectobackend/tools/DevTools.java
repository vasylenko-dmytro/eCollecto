package com.vasylenko.ecollectobackend.tools;

import com.vasylenko.ecollectobackend.utils.ToolUtils;
import org.springaicommunity.mcp.annotation.McpTool;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static com.vasylenko.ecollectobackend.utils.ToolUtils.PROJECT_ROOT;

@Component
public class DevTools {

    private static final Path SRC_DIR = PROJECT_ROOT.resolve("backend/ecollecto-backend/src/main/java/com/vasylenko/ecollectobackend").normalize();
    private static final Path BUILD_GRADLE_PATH = PROJECT_ROOT.resolve("backend/ecollecto-backend/build.gradle").normalize();
    private static final int MAX_LINES = 500;
    private static final int MAX_FILES = 100;

    @McpTool(name = "getDomainSchema", description = "Scans for classes annotated with @Document and returns a map of class names to their fields. This will prevent AI hallucinations when writing queries.")
    public Map<String, List<String>> getDomainSchema() throws IOException {
        return ToolUtils.executeWithTimeout(() -> {
            Map<String, List<String>> schema = new HashMap<>();
            ToolUtils.validatePath(SRC_DIR);
            try (Stream<Path> paths = Files.walk(SRC_DIR)) {
                paths
                        .filter(Files::isRegularFile)
                        .filter(path -> path.toString().endsWith(".java"))
                        .limit(MAX_FILES)
                        .forEach(path -> {
                            try {
                                String content = new String(Files.readAllBytes(path));
                                if (content.contains("@Document")) {
                                    String className = path.getFileName().toString().replace(".java", "");
                                    List<String> fields = new ArrayList<>();
                                    Pattern pattern = Pattern.compile("private\\s+\\w+\\s+(\\w+);");
                                    Matcher matcher = pattern.matcher(content);
                                    while (matcher.find()) {
                                        fields.add(matcher.group(1));
                                    }
                                    schema.put(className, fields);
                                }
                            } catch (IOException e) {
                                // Ignore files that can't be read
                            }
                        });
            }
            return schema;
        });
    }

    @McpTool(name = "checkDependencies", description = "Reads the build.gradle file to know the library versions.")
    public String checkDependencies() throws IOException {
        return ToolUtils.executeWithTimeout(() -> {
            ToolUtils.validatePath(BUILD_GRADLE_PATH);
            try (Stream<String> lines = Files.lines(BUILD_GRADLE_PATH)) {
                return lines.limit(MAX_LINES).collect(Collectors.joining("\n"));
            }
        });
    }
}