package com.vasylenko.ecollectobackend.utils;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vasylenko.ecollectobackend.designer.DesignerDocument;
import com.vasylenko.ecollectobackend.fdc.FirstDayCoverDocument;
import com.vasylenko.ecollectobackend.stamp.StampDocument;
import com.vasylenko.ecollectobackend.tariff.TariffsDocument;

import java.io.IOException;
import java.io.InputStream;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public final class CollectionTestDataLoader {
    private CollectionTestDataLoader() {
    }

    public static DesignerDocument loadDesignerDocument() throws IOException {
        try (InputStream input = CollectionTestDataLoader.class.getResourceAsStream("/test-data/designer.json")) {
            if (input == null) {
                throw new IllegalStateException("Test data file /test-data/designer.json not found");
            }
            ObjectMapper mapper = new ObjectMapper();
            JsonNode node = mapper.readTree(input);
            DesignerDocument document = new DesignerDocument();
            JsonNode idNode = node.get("_id");
            if (idNode != null && !idNode.isNull()) {
                document.setId(idNode.asText());
            }
            JsonNode nameNode = node.get("name");
            if (nameNode != null && !nameNode.isNull()) {
                document.setName(nameNode.asText());
            }
            return document;
        }
    }

    public static FirstDayCoverDocument loadFirstDayCoverDocument() throws IOException {
        try (InputStream input = CollectionTestDataLoader.class.getResourceAsStream("/test-data/fdc.json")) {
            if (input == null) {
                throw new IllegalStateException("Test data file /test-data/fdc.json not found");
            }
            ObjectMapper mapper = new ObjectMapper();
            JsonNode node = mapper.readTree(input);
            FirstDayCoverDocument document = new FirstDayCoverDocument();
            JsonNode idNode = node.get("_id");
            if (idNode != null && !idNode.isNull()) {
                document.setId(idNode.asText());
            }
            JsonNode nameNode = node.get("name");
            if (nameNode != null && !nameNode.isNull()) {
                document.setName(nameNode.asText());
            }
            JsonNode descriptionNode = node.get("description");
            if (descriptionNode != null && !descriptionNode.isNull()) {
                document.setDescription(descriptionNode.asText());
            }
            JsonNode stampIdNode = node.get("stampId");
            if (stampIdNode != null && !stampIdNode.isNull()) {
                document.setStampId(stampIdNode.asText());
            }
            JsonNode designerIdNode = node.get("designerId");
            if (designerIdNode != null && !designerIdNode.isNull()) {
                document.setDesignerId(designerIdNode.asText());
            }
            JsonNode postmarkNode = node.get("postmark");
            if (postmarkNode != null && !postmarkNode.isNull()) {
                FirstDayCoverDocument.Postmark postmark = new FirstDayCoverDocument.Postmark();
                JsonNode postmarkIdNode = postmarkNode.get("id");
                if (postmarkIdNode != null && !postmarkIdNode.isNull()) {
                    postmark.setId(postmarkIdNode.asText());
                }
                JsonNode postmarkSkuNode = postmarkNode.get("sku");
                if (postmarkSkuNode != null && !postmarkSkuNode.isNull()) {
                    postmark.setSku(postmarkSkuNode.asInt());
                }
                JsonNode postmarkImageNode = postmarkNode.get("image");
                if (postmarkImageNode != null && !postmarkImageNode.isNull()) {
                    postmark.setImage(postmarkImageNode.asText());
                }
                document.setPostmark(postmark);
            }
            JsonNode envelopeNode = node.get("envelope");
            if (envelopeNode != null && !envelopeNode.isNull()) {
                FirstDayCoverDocument.Envelope envelope = new FirstDayCoverDocument.Envelope();
                JsonNode envelopeIdNode = envelopeNode.get("id");
                if (envelopeIdNode != null && !envelopeIdNode.isNull()) {
                    envelope.setId(envelopeIdNode.asText());
                }
                JsonNode envelopeSkuNode = envelopeNode.get("sku");
                if (envelopeSkuNode != null && !envelopeSkuNode.isNull()) {
                    envelope.setSku(envelopeSkuNode.asInt());
                }
                JsonNode envelopeImageNode = envelopeNode.get("image");
                if (envelopeImageNode != null && !envelopeImageNode.isNull()) {
                    envelope.setImage(envelopeImageNode.asText());
                }
                document.setEnvelope(envelope);
            }
            JsonNode releaseNode = node.get("release");
            if (releaseNode != null && !releaseNode.isNull()) {
                FirstDayCoverDocument.Release release = new FirstDayCoverDocument.Release();
                JsonNode releaseYearNode = releaseNode.get("year");
                if (releaseYearNode != null && !releaseYearNode.isNull()) {
                    release.setYear(releaseYearNode.asInt());
                }
                JsonNode releaseDateNode = releaseNode.get("date");
                if (releaseDateNode != null && !releaseDateNode.isNull()) {
                    release.setDate(releaseDateNode.asText());
                }
                JsonNode releasePrintNode = releaseNode.get("printQuantity");
                if (releasePrintNode != null && !releasePrintNode.isNull()) {
                    release.setPrintQuantity(releasePrintNode.asInt());
                }
                document.setRelease(release);
            }
            return document;
        }
    }

    public static StampDocument loadStampDocument() throws IOException {
        try (InputStream input = CollectionTestDataLoader.class.getResourceAsStream("/test-data/stamp.json")) {
            if (input == null) {
                throw new IllegalStateException("Test data file /test-data/stamp.json not found");
            }
            ObjectMapper mapper = new ObjectMapper();
            JsonNode node = mapper.readTree(input);
            StampDocument document = new StampDocument();
            JsonNode idNode = node.get("_id");
            if (idNode != null && !idNode.isNull()) {
                document.setId(idNode.asText());
            }
            JsonNode nameNode = node.get("name");
            if (nameNode != null && !nameNode.isNull()) {
                document.setName(nameNode.asText());
            }
            JsonNode descriptionNode = node.get("description");
            if (descriptionNode != null && !descriptionNode.isNull()) {
                document.setDescription(descriptionNode.asText());
            }
            JsonNode stampSkuNode = node.get("stampSKU");
            if (stampSkuNode != null && !stampSkuNode.isNull()) {
                document.setStampSKU(stampSkuNode.asInt());
            }
            JsonNode metaNode = node.get("meta");
            if (metaNode != null && !metaNode.isNull()) {
                StampDocument.Meta meta = new StampDocument.Meta();
                JsonNode denominationNode = metaNode.get("denomination");
                if (denominationNode != null && !denominationNode.isNull()) {
                    StampDocument.Denomination denomination = new StampDocument.Denomination();
                    JsonNode currencyNode = denominationNode.get("currency");
                    if (currencyNode != null && !currencyNode.isNull()) {
                        denomination.setCurrency(currencyNode.asText());
                    }
                    JsonNode codeNode = denominationNode.get("code");
                    if (codeNode != null && !codeNode.isNull()) {
                        denomination.setCode(codeNode.asText());
                    }
                    meta.setDenomination(denomination);
                }
                JsonNode seriesNode = metaNode.get("series");
                if (seriesNode != null && !seriesNode.isNull()) {
                    meta.setSeries(seriesNode.asText());
                }
                JsonNode designerIdsNode = metaNode.get("designerIds");
                if (designerIdsNode != null && designerIdsNode.isArray()) {
                    List<String> designerIds = new ArrayList<>();
                    for (JsonNode designerIdNode : designerIdsNode) {
                        if (designerIdNode != null && !designerIdNode.isNull()) {
                            designerIds.add(designerIdNode.asText());
                        }
                    }
                    meta.setDesignerIds(designerIds);
                }
                JsonNode perforationNode = metaNode.get("perforation");
                if (perforationNode != null && !perforationNode.isNull()) {
                    meta.setPerforation(perforationNode.asBoolean());
                }
                JsonNode stampsPerPaneNode = metaNode.get("stampsPerPane");
                if (stampsPerPaneNode != null && !stampsPerPaneNode.isNull()) {
                    meta.setStampsPerPane(stampsPerPaneNode.asInt());
                }
                JsonNode themesNode = metaNode.get("themes");
                if (themesNode != null && themesNode.isArray()) {
                    List<String> themes = new ArrayList<>();
                    for (JsonNode themeNode : themesNode) {
                        if (themeNode != null && !themeNode.isNull()) {
                            themes.add(themeNode.asText());
                        }
                    }
                    meta.setThemes(themes);
                }
                JsonNode europaNode = metaNode.get("europa");
                if (europaNode != null && !europaNode.isNull()) {
                    meta.setEuropa(europaNode.asBoolean());
                }
                document.setMeta(meta);
            }
            JsonNode releaseNode = node.get("release");
            if (releaseNode != null && !releaseNode.isNull()) {
                StampDocument.Release release = new StampDocument.Release();
                JsonNode releaseDateNode = releaseNode.get("date");
                if (releaseDateNode != null && !releaseDateNode.isNull()) {
                    release.setDate(releaseDateNode.asText());
                }
                JsonNode releaseYearNode = releaseNode.get("year");
                if (releaseYearNode != null && !releaseYearNode.isNull()) {
                    release.setYear(releaseYearNode.asInt());
                }
                JsonNode releasePrintNode = releaseNode.get("printQuantity");
                if (releasePrintNode != null && !releasePrintNode.isNull()) {
                    release.setPrintQuantity(releasePrintNode.asInt());
                }
                JsonNode massIssueNode = releaseNode.get("isMassIssue");
                if (massIssueNode != null && !massIssueNode.isNull()) {
                    release.setIsMassIssue(massIssueNode.asBoolean());
                }
                JsonNode availableNode = releaseNode.get("isAvailable");
                if (availableNode != null && !availableNode.isNull()) {
                    release.setIsAvailable(availableNode.asBoolean());
                }
                document.setRelease(release);
            }
            JsonNode imagesNode = node.get("images");
            if (imagesNode != null && !imagesNode.isNull()) {
                StampDocument.Images images = new StampDocument.Images();
                JsonNode originalNode = imagesNode.get("original");
                if (originalNode != null && !originalNode.isNull()) {
                    images.setOriginal(originalNode.asText());
                }
                JsonNode smallNode = imagesNode.get("small");
                if (smallNode != null && !smallNode.isNull()) {
                    images.setSmall(smallNode.asText());
                }
                JsonNode paneNode = imagesNode.get("pane");
                if (paneNode != null && !paneNode.isNull()) {
                    images.setPane(paneNode.asText());
                }
                document.setImages(images);
            }
            return document;
        }
    }

    public static TariffsDocument loadTariffsDocument() throws IOException {
        try (InputStream input = CollectionTestDataLoader.class.getResourceAsStream("/test-data/tariffs.json")) {
            if (input == null) {
                throw new IllegalStateException("Test data file /test-data/tariffs.json not found");
            }
            ObjectMapper mapper = new ObjectMapper();
            JsonNode node = mapper.readTree(input);
            TariffsDocument document = new TariffsDocument();
            JsonNode idNode = node.get("_id");
            if (idNode != null && !idNode.isNull()) {
                document.setId(idNode.asText());
            }
            JsonNode yearNode = node.get("year");
            if (yearNode != null && !yearNode.isNull()) {
                document.setYear(yearNode.asInt());
            }
            JsonNode updatedAtNode = node.get("updatedAt");
            if (updatedAtNode != null && !updatedAtNode.isNull()) {
                document.setUpdatedAt(Instant.parse(updatedAtNode.asText()));
            }
            JsonNode currenciesNode = node.get("currencies");
            if (currenciesNode != null && !currenciesNode.isNull()) {
                Map<String, Map<String, Double>> currencies = mapper.convertValue(
                        currenciesNode, new TypeReference<>() {});
                document.setCurrencies(currencies);
            }
            return document;
        }
    }
}
