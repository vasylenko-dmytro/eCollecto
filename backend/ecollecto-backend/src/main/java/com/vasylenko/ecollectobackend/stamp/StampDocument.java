package com.vasylenko.ecollectobackend.stamp;

import com.vasylenko.ecollectobackend.common.model.BaseDocument;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Data
@EqualsAndHashCode(callSuper = true)
@Document(collection = "stamp")
public class StampDocument extends BaseDocument {
    private String name;
    private String description;
    private Integer stampSKU;

    private Meta meta;
    private Release release;
    private Images images;

    @Data
    public static class Meta {
        private Denomination denomination;
        private String series;
        private List<String> designerIds;
        private Boolean perforation;
        private Integer stampsPerPane;
        private List<String> themes;
        private Boolean europa;
    }

    @Data
    public static class Denomination {
        private String currency;
        private String code;
    }

    @Data
    public static class Release {
        private String date;
        private Integer year;
        private Integer printQuantity;
        private Boolean isMassIssue;
        private Boolean isAvailable;
    }

    @Data
    public static class Images {
        private String original;
        private String small;
        private String pane;
    }
}
