package com.vasylenko.ecollectobackend.designer;

import com.vasylenko.ecollectobackend.dto.DesignerDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

/**
 * MapStruct mapper for converting {@link DesignerDocument} to {@link DesignerDto}.
 */
@Mapper(componentModel = "spring")
public interface DesignerMapper {

    @Mapping(target = "designerId", source = "id")
    DesignerDto toDto(DesignerDocument document);
}

