package com.vasylenko.ecollectobackend.collection;

import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document("user_collections")
@CompoundIndex(name = "userId_stampId_unique", def = "{'userId': 1, 'stampId': 1}", unique = true)
@Getter
@Setter
@ToString
@EqualsAndHashCode(of = "id")
public class CollectionItemDocument {

    @Id
    private String id;

    /** Keycloak sub — identifies the owner. */
    private String userId;

    /** Reference to stamps._id. */
    private String stampId;

    private Instant addedAt;
}

