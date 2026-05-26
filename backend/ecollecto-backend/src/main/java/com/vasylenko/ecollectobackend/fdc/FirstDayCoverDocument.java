package com.vasylenko.ecollectobackend.fdc;

import com.vasylenko.ecollectobackend.common.model.BaseDocument;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.mongodb.core.mapping.Document;

@Getter
@Setter
@ToString
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

    @Getter
    @Setter
    @ToString
    @EqualsAndHashCode
    public static class Postmark {
        private String id;
        private Integer sku;
        private String image;
    }

    @Getter
    @Setter
    @ToString
    @EqualsAndHashCode
    public static class Envelope {
        private String id;
        private Integer sku;
        private String image;
    }

    @Getter
    @Setter
    @ToString
    @EqualsAndHashCode
    public static class Release {
        private Integer year;
        private String date;
        private Integer printQuantity;
    }
}
