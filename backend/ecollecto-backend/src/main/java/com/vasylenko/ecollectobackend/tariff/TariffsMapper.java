package com.vasylenko.ecollectobackend.tariff;

import com.vasylenko.ecollectobackend.dto.TariffsDto;
import org.mapstruct.Mapper;

/**
 * MapStruct mapper for converting {@link TariffsDocument} to {@link TariffsDto}.
 */
@Mapper(componentModel = "spring")
public interface TariffsMapper {

    TariffsDto toDto(TariffsDocument document);
}

