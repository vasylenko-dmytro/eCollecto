package com.vasylenko.ecollectobackend.designer;

import com.vasylenko.ecollectobackend.common.model.BaseDocument;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@EqualsAndHashCode(callSuper = true)
@Document(collection = "designers")
public class DesignerDocument extends BaseDocument {
    private String name;
}
