package com.vasylenko.ecollectobackend.fdc;
import com.vasylenko.ecollectobackend.dto.FirstDayCoverDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import java.util.Map;
/**
 * MapStruct mapper for converting {@link FirstDayCoverDocument} to {@link FirstDayCoverDto}.
 * Uses an abstract class to provide a custom designer-name resolution helper.
 */
@Mapper(componentModel = "spring")
public abstract class FirstDayCoverMapper {
    @Mapping(target = "postmarkId",  source = "document.postmark.id")
    @Mapping(target = "envelopeId",  source = "document.envelope.id")
    @Mapping(target = "postmarkSKU", source = "document.postmark.sku")
    @Mapping(target = "envelopeSKU", source = "document.envelope.sku")
    @Mapping(target = "designer",    expression = "java(resolveDesigner(document, designerNames))")
    @Mapping(target = "release",     expression = "java(toReleaseDto(document.getRelease()))")
    @Mapping(target = "images",      expression = "java(toImagesDto(document))")
    public abstract FirstDayCoverDto toDto(FirstDayCoverDocument document, Map<String, String> designerNames);
    @Mapping(target = "year",          source = "year")
    @Mapping(target = "date",          source = "date")
    @Mapping(target = "printQuantity", source = "printQuantity")
    protected abstract FirstDayCoverDto.ReleaseDto toReleaseDto(FirstDayCoverDocument.Release release);
    protected FirstDayCoverDto.ImagesDto toImagesDto(FirstDayCoverDocument document) {
        String envelopeImg = document.getEnvelope() != null ? document.getEnvelope().getImage() : null;
        String postmarkImg = document.getPostmark() != null ? document.getPostmark().getImage() : null;
        return new FirstDayCoverDto.ImagesDto(envelopeImg, postmarkImg);
    }
    protected String resolveDesigner(FirstDayCoverDocument document, Map<String, String> designerNames) {
        return designerNames.getOrDefault(document.getDesignerId(), null);
    }
}
