package com.vasylenko.ecollectobackend.utils;

import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.concurrent.*;

/**
 * A utility class for MCP tools, providing common functionality such as task execution with timeouts and path validation.
 */
public class ToolUtils {

    public static final Path PROJECT_ROOT = Paths.get(".").toAbsolutePath().normalize();
    public static final int TIMEOUT_SECONDS = 10;

    /**
     * Executes a {@link Callable} task with a timeout.
     *
     * @param task The task to execute.
     * @param <T>  The return type of the task.
     * @return The result of the task.
     * @throws IOException if the task execution times out or fails.
     */
    public static <T> T executeWithTimeout(Callable<T> task) throws IOException {
        try (ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor()) {
            Future<T> future = executor.submit(task);
            return future.get(TIMEOUT_SECONDS, TimeUnit.SECONDS);
        } catch (InterruptedException | ExecutionException | TimeoutException e) {
            throw new IOException("Task execution timed out or failed", e);
        }
    }

    /**
     * Validates that the given path is within the allowed project directory.
     *
     * @param path The path to validate.
     * @throws IOException if the path is outside the project directory.
     */
    public static void validatePath(Path path) throws IOException {
        if (!path.normalize().startsWith(PROJECT_ROOT)) {
            throw new IOException("File path is outside of the allowed project directory");
        }
    }
}