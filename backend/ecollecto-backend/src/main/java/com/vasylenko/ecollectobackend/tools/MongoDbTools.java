package com.vasylenko.ecollectobackend.tools;

import com.mongodb.client.MongoCollection;
import com.vasylenko.ecollectobackend.utils.ToolUtils;
import org.bson.Document;
import org.springaicommunity.mcp.annotation.McpTool;
import org.springaicommunity.mcp.annotation.McpToolParam;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Component
public class MongoDbTools {

    private final MongoTemplate mongoTemplate;
    private static final int MAX_DOCS = 100;

    public MongoDbTools(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @McpTool(name = "mongoDescribeCollection", description = "Executes a sample query in Mongo to show the AI the real structure of the documents (since NoSQL can have dynamic fields).")
    public Document mongoDescribeCollection(
            @McpToolParam(description = "The name of the collection to describe.") String collectionName) throws IOException {
        return ToolUtils.executeWithTimeout(() -> {
            MongoCollection<Document> collection = mongoTemplate.getCollection(collectionName);
            return collection.find().limit(1).first();
        });
    }

    @McpTool(name = "mongoExecuteFind", description = "Read only! Allows the AI to check the data it has just saved through your application.")
    public List<Document> mongoExecuteFind(
            @McpToolParam(description = "The name of the collection to query.") String collectionName,
            @McpToolParam(description = "The query to execute. Must be a valid JSON string.") String query) throws IOException {
        return ToolUtils.executeWithTimeout(() -> {
            MongoCollection<Document> collection = mongoTemplate.getCollection(collectionName);
            Document queryObject = Document.parse(query);
            List<Document> results = new ArrayList<>();
            collection.find(queryObject).limit(MAX_DOCS).into(results);
            return results;
        });
    }
}