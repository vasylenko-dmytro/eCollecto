package com.vasylenko.ecollectobackend.designer;

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
@Document(collection = "designers")
public class DesignerDocument extends BaseDocument {
    private String name;
}
