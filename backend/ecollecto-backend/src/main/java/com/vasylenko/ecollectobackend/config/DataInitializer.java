package com.vasylenko.ecollectobackend.config;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mongodb.client.model.ReplaceOptions;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.Document;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Component;

import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.index.Index;

import java.io.InputStream;
import java.util.List;
import java.util.Map;

/**
 * Seeds MongoDB collections from classpath JSON on startup.
 * Activated only when app.data.init.enabled=true (application-seed.properties or env var).
 * All operations are idempotent: replaceOne with upsert=true by _id.
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.data.init.enabled", havingValue = "true")
public class DataInitializer implements ApplicationRunner {

    private final MongoTemplate mongoTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void run(ApplicationArguments args) throws Exception {
        log.info("DataInitializer: starting seed...");
        seedCollection("migration-data/ua/designers.json", "designers");
        seedCollection("migration-data/ua/first_day_covers.json", "first_day_covers");
        seedCollection("migration-data/ua/stamp.json", "stamp");
        seedCollection("migration-data/ua/tariffs.json", "tariffs");
        log.info("DataInitializer: seed complete.");

        log.info("DataInitializer: creating compound indexes (V002)...");
        createUserStampIndex("user_collections");
        createUserStampIndex("user_wishlists");
        createUserStampIndex("user_favorites");
        log.info("DataInitializer: indexes ready.");
    }

    /**
     * Idempotent: MongoDB createIndex is a no-op if an index with the same
     * key pattern and options already exists.
     */
    private void createUserStampIndex(String collectionName) {
        mongoTemplate.indexOps(collectionName)
                .createIndex(new Index()
                        .on("userId", Sort.Direction.ASC)
                        .on("stampId", Sort.Direction.ASC)
                        .unique()
                        .named("userId_stampId_unique"));
        log.info("DataInitializer: index ready on '{}'", collectionName);
    }

    private void seedCollection(String classpathResource, String collectionName) throws Exception {
        InputStream is = getClass().getClassLoader().getResourceAsStream(classpathResource);
        if (is == null) {
            log.warn("DataInitializer: resource not found: {}", classpathResource);
            return;
        }
        List<Map<String, Object>> records = objectMapper.readValue(is, new TypeReference<>() {});
        var collection = mongoTemplate.getCollection(collectionName);
        var options = new ReplaceOptions().upsert(true);
        int count = 0;
        for (Map<String, Object> record : records) {
            Document doc = new Document(record);
            collection.replaceOne(new Document("_id", doc.get("_id")), doc, options);
            count++;
        }
        log.info("DataInitializer: upserted {} records into '{}'", count, collectionName);
    }
}


