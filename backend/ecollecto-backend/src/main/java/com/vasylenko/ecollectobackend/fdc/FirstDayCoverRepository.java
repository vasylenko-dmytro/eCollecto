package com.vasylenko.ecollectobackend.fdc;

import org.springframework.data.mongodb.repository.MongoRepository;

public interface FirstDayCoverRepository extends MongoRepository<FirstDayCoverDocument, String> {
}
