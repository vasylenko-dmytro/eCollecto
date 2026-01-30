package com.vasylenko.ecollectobackend.fdc;

import com.vasylenko.ecollectobackend.designer.DesignerDocument;
import com.vasylenko.ecollectobackend.designer.DesignerRepository;
import com.vasylenko.ecollectobackend.dto.FirstDayCoverDto;
import com.vasylenko.ecollectobackend.utils.CollectionTestDataLoader;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.IOException;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FirstDayCoverServiceTest {
    private static final String DESIGNER_NAME = "Boris Groh";

    @Mock
    private FirstDayCoverRepository firstDayCoverRepository;

    @Mock
    private DesignerRepository designerRepository;

    @InjectMocks
    private FirstDayCoverService firstDayCoverService;

    @Test
    void shouldReturnMappedDtosWhenFindAllInvoked() throws IOException {
        FirstDayCoverDocument document = CollectionTestDataLoader.loadFirstDayCoverDocument();
        DesignerDocument designer = new DesignerDocument();
        designer.setId(document.getDesignerId());
        designer.setName(DESIGNER_NAME);

        when(firstDayCoverRepository.findAll()).thenReturn(List.of(document));
        when(designerRepository.findAllById(Set.of(document.getDesignerId()))).thenReturn(List.of(designer));

        List<FirstDayCoverDto> result = firstDayCoverService.findAll();

        assertThat(result).hasSize(1);
        FirstDayCoverDto dto = result.getFirst();
        assertThat(dto.getName()).isEqualTo(document.getName());
        assertThat(dto.getDescription()).isEqualTo(document.getDescription());
        assertThat(dto.getDesigner()).isEqualTo(DESIGNER_NAME);
        assertThat(dto.getPostmarkId()).isEqualTo(document.getPostmark().getId());
        assertThat(dto.getEnvelopeId()).isEqualTo(document.getEnvelope().getId());
        assertThat(dto.getPostmarkSKU()).isEqualTo(document.getPostmark().getSku());
        assertThat(dto.getEnvelopeSKU()).isEqualTo(document.getEnvelope().getSku());
        assertThat(dto.getImages().getPostmark()).isEqualTo(document.getPostmark().getImage());
        assertThat(dto.getImages().getEnvelope()).isEqualTo(document.getEnvelope().getImage());
        assertThat(dto.getRelease().getYear()).isEqualTo(document.getRelease().getYear());
        assertThat(dto.getRelease().getDate()).isEqualTo(document.getRelease().getDate());
        assertThat(dto.getRelease().getPrintQuantity()).isEqualTo(document.getRelease().getPrintQuantity());
    }

    @Test
    void shouldReturnEmptyListWhenFindAllHasNoResults() {
        when(firstDayCoverRepository.findAll()).thenReturn(List.of());

        List<FirstDayCoverDto> result = firstDayCoverService.findAll();

        assertThat(result).isEmpty();
        verify(designerRepository, never()).findAllById(anyCollection());
    }

    @Test
    void shouldReturnDtoWithNullNestedFieldsWhenDocumentHasNulls() {
        FirstDayCoverDocument document = new FirstDayCoverDocument();
        document.setName("Space");
        document.setDesignerId("d1");

        when(firstDayCoverRepository.findAll()).thenReturn(List.of(document));
        when(designerRepository.findAllById(Set.of("d1"))).thenReturn(List.of());

        List<FirstDayCoverDto> result = firstDayCoverService.findAll();

        assertThat(result).hasSize(1);
        FirstDayCoverDto dto = result.getFirst();
        assertThat(dto.getName()).isEqualTo("Space");
        assertThat(dto.getDesigner()).isNull();
        assertThat(dto.getPostmarkId()).isNull();
        assertThat(dto.getEnvelopeId()).isNull();
        assertThat(dto.getPostmarkSKU()).isNull();
        assertThat(dto.getEnvelopeSKU()).isNull();
        assertThat(dto.getImages().getEnvelope()).isNull();
        assertThat(dto.getImages().getPostmark()).isNull();
        assertThat(dto.getRelease().getYear()).isNull();
        assertThat(dto.getRelease().getDate()).isNull();
        assertThat(dto.getRelease().getPrintQuantity()).isNull();
    }

    @Test
    void shouldReturnDtoWhenFindByIdInvoked() throws IOException {
        FirstDayCoverDocument document = CollectionTestDataLoader.loadFirstDayCoverDocument();
        DesignerDocument designer = new DesignerDocument();
        designer.setId(document.getDesignerId());
        designer.setName(DESIGNER_NAME);

        when(firstDayCoverRepository.findById(document.getId())).thenReturn(Optional.of(document));
        when(designerRepository.findAllById(Set.of(document.getDesignerId()))).thenReturn(List.of(designer));

        Optional<FirstDayCoverDto> result = firstDayCoverService.findById(document.getId());

        assertThat(result).isPresent();
        assertThat(result.get().getDesigner()).isEqualTo(DESIGNER_NAME);
        assertThat(result.get().getPostmarkId()).isEqualTo(document.getPostmark().getId());
    }

    @Test
    void shouldReturnEmptyWhenFindByIdMissing() {
        when(firstDayCoverRepository.findById("missing")).thenReturn(Optional.empty());

        Optional<FirstDayCoverDto> result = firstDayCoverService.findById("missing");

        assertThat(result).isEmpty();
        verify(designerRepository, never()).findAllById(anyCollection());
    }

}
