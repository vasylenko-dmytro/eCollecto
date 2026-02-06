package com.vasylenko.ecollectobackend.utils;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.vasylenko.ecollectobackend.designer.DesignerDocument;
import com.vasylenko.ecollectobackend.fdc.FirstDayCoverDocument;
import com.vasylenko.ecollectobackend.stamp.StampDocument;
import com.vasylenko.ecollectobackend.tariff.TariffsDocument;
import lombok.NoArgsConstructor;

import java.io.IOException;
import java.io.InputStream;

@NoArgsConstructor
public final class CollectionTestDataLoader {
    private static final ObjectMapper MAPPER = new ObjectMapper()
            .registerModule(new JavaTimeModule());

    private static <T> T loadTestData(String resourcePath, TypeReference<T> typeReference) throws IOException {
        try (InputStream input = CollectionTestDataLoader.class.getResourceAsStream(resourcePath)) {
            if (input == null) {
                throw new IllegalStateException("Test data file not found: " + resourcePath);
            }
            return MAPPER.readValue(input, typeReference);
        }
    }

    private static <T> T loadTestData(String resourcePath, Class<T> clazz) throws IOException {
        try (InputStream input = CollectionTestDataLoader.class.getResourceAsStream(resourcePath)) {
            if (input == null) {
                throw new IllegalStateException("Test data file not found: " + resourcePath);
            }
            return MAPPER.readValue(input, clazz);
        }
    }

    public static DesignerDocument loadDesignerDocument() throws IOException {
        return loadTestData("/test-data/designer.json", DesignerDocument.class);
    }

    public static FirstDayCoverDocument loadFirstDayCoverDocument() throws IOException {
        return loadTestData("/test-data/fdc.json", FirstDayCoverDocument.class);
    }

    public static StampDocument loadStampDocument() throws IOException {
        return loadTestData("/test-data/stamp.json", StampDocument.class);
    }

    public static TariffsDocument loadTariffsDocument() throws IOException {
        return loadTestData("/test-data/tariffs.json", TariffsDocument.class);
    }
}
