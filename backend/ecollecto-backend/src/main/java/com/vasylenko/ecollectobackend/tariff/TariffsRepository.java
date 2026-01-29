package com.vasylenko.ecollectobackend.tariff;

import org.springframework.data.mongodb.repository.MongoRepository;

public interface TariffsRepository extends MongoRepository<TariffsDocument, String> {
}
