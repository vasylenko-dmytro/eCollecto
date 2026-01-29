package com.vasylenko.ecollectobackend.common.model;

import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.Id;

@Getter
@Setter
public abstract class BaseDocument {
    @Id
    protected String id;
}
