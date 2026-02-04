package com.vasylenko.ecollectobackend.tools;

import com.vasylenko.ecollectobackend.utils.ToolUtils;
import org.springaicommunity.mcp.annotation.McpTool;
import org.springaicommunity.mcp.annotation.McpToolParam;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static com.vasylenko.ecollectobackend.utils.ToolUtils.PROJECT_ROOT;

@Component
public class ReactTools {

    private static final Path COMPONENTS_DIR = PROJECT_ROOT.resolve("frontend/ecollecto-ui/src/features/product/components").normalize();
    private static final int MAX_LINES = 500;
    private static final int MAX_FILES = 100;

    @McpTool(name = "scanComponents", description = "Returns a list of filenames from src/components. Helps the AI to understand what has already been created.")
    public List<String> scanComponents() throws IOException {
        return ToolUtils.executeWithTimeout(() -> {
            ToolUtils.validatePath(COMPONENTS_DIR);
            try (Stream<Path> stream = Files.list(COMPONENTS_DIR)) {
                return stream
                        .filter(Files::isRegularFile)
                        .map(path -> path.getFileName().toString())
                        .limit(MAX_FILES)
                        .collect(Collectors.toList());
            }
        });
    }

    @McpTool(name = "getComponentPreview", description = "Reads the code of a specific .tsx file. The AI will be able to analyze props and styles.")
    public String getComponentPreview(
            @McpToolParam(description = "The name of the .tsx file to read.") String fileName) throws IOException {
        return ToolUtils.executeWithTimeout(() -> {
            Path path = COMPONENTS_DIR.resolve(fileName).normalize();
            ToolUtils.validatePath(path);
            try (Stream<String> lines = Files.lines(path)) {
                return lines.limit(MAX_LINES).collect(Collectors.joining("\n"));
            }
        });
    }

    @McpTool(name = "generateComponent", description = "A template generator that creates the structure of a component (React 19 uses cleaner hooks, for example, use instead of some patterns, specify this in the tool's prompt).")
    public String generateComponent(
            @McpToolParam(description = "The name of the new React component.") String componentName) throws IOException {
        return ToolUtils.executeWithTimeout(() -> {
            String componentFileName = componentName + ".tsx";
            Path path = COMPONENTS_DIR.resolve(componentFileName).normalize();
            ToolUtils.validatePath(path);

            if (Files.exists(path)) {
                return "Component " + componentName + " already exists.";
            }

            String content = """
                    import React, { use } from 'react';

                    interface %sProps {
                      // Define your component props here
                    }

                    const %s: React.FC<%sProps> = (props) => {
                      // React 19 might use the 'use' hook for context or async operations
                      // const data = use(fetchData());

                      return (
                        <div>
                          <h1>%s Component</h1>
                          {/* Your component JSX here */}
                        </div>
                      );
                    };

                    export default %s;
                    """.formatted(componentName, componentName, componentName, componentName, componentName);

            Files.write(path, content.getBytes());

            return "Component " + componentName + " created successfully at " + path.toString();
        });
    }
}