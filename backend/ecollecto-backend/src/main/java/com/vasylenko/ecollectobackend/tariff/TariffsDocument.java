package com.vasylenko.ecollectobackend.tariff;

import com.vasylenko.ecollectobackend.common.model.BaseDocument;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.Map;

@Data
@EqualsAndHashCode(callSuper = true)
@Document(collection = "tariffs")
public class TariffsDocument extends BaseDocument {
    private Integer year;
    private Instant updatedAt;

    private Map<String, Map<String, Double>> currencies;
}
