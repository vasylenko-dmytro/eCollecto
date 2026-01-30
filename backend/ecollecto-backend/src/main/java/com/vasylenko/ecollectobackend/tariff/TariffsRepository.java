package com.vasylenko.ecollectobackend.tariff;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface TariffsRepository extends MongoRepository<TariffsDocument, String> {
    Optional<TariffsDocument> findByYear(Integer year);
}
