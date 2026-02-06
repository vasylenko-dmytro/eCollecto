package com.vasylenko.ecollectobackend.common.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.Id;

@Getter
@Setter
public abstract class BaseDocument {
    @Id
    @JsonProperty("_id")
    protected String id;
}
