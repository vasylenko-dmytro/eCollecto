package com.vasylenko.ecollectobackend.fdc;

import com.vasylenko.ecollectobackend.common.model.BaseDocument;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@EqualsAndHashCode(callSuper = true)
@Document(collection = "first_day_covers")
public class FirstDayCoverDocument extends BaseDocument {
    private String name;
    private String description;
    private String stampId;
    private String designerId;

    private Postmark postmark;
    private Envelope envelope;
    private Release release;

    @Data
    public static class Postmark {
        private String id;
        private Integer sku;
        private String image;
    }

    @Data
    public static class Envelope {
        private String id;
        private Integer sku;
        private String image;
    }

    @Data
    public static class Release {
        private Integer year;
        private String date;
        private Integer printQuantity;
    }
}
