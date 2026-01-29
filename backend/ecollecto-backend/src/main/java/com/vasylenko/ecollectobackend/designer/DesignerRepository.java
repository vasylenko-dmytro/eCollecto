package com.vasylenko.ecollectobackend.designer;

import org.springframework.data.mongodb.repository.MongoRepository;

public interface DesignerRepository extends MongoRepository<DesignerDocument, String> {
}
