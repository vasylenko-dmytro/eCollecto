package com.vasylenko.ecollectobackend.stamp;

import org.springframework.data.mongodb.repository.MongoRepository;

public interface StampRepository extends MongoRepository<StampDocument, String> {
}
