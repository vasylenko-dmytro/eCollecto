package com.vasylenko.ecollectobackend.stamp;

import com.vasylenko.ecollectobackend.designer.DesignerDocument;
import com.vasylenko.ecollectobackend.designer.DesignerRepository;
import com.vasylenko.ecollectobackend.dto.StampDto;
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
class StampServiceTest {
    private static final String DESIGNER_NAME = "Boris Groh";

    @Mock
    private StampRepository stampRepository;

    @Mock
    private DesignerRepository designerRepository;

    @InjectMocks
    private StampService stampService;

    @Test
    void shouldReturnMappedDtosWhenFindAllInvoked() throws IOException {
        StampDocument document = CollectionTestDataLoader.loadStampDocument();
        DesignerDocument designer = new DesignerDocument();
        designer.setId(document.getMeta().getDesignerIds().getFirst());
        designer.setName(DESIGNER_NAME);

        when(stampRepository.findAll()).thenReturn(List.of(document));
        when(designerRepository.findAllById(Set.of(designer.getId()))).thenReturn(List.of(designer));

        List<StampDto> result = stampService.findAll();

        assertThat(result).hasSize(1);
        StampDto dto = result.getFirst();
        assertThat(dto.getStampId()).isEqualTo(document.getId());
        assertThat(dto.getName()).isEqualTo(document.getName());
        assertThat(dto.getDescription()).isEqualTo(document.getDescription());
        assertThat(dto.getStampSKU()).isEqualTo(document.getStampSKU());
        assertThat(dto.getMeta().getDenomination()).isEqualTo("V");
        assertThat(dto.getMeta().getSeries()).isEqualTo(document.getMeta().getSeries());
        assertThat(dto.getMeta().getDesigner()).isEqualTo(DESIGNER_NAME);
        assertThat(dto.getMeta().getPerforation()).isEqualTo(document.getMeta().getPerforation());
        assertThat(dto.getMeta().getStampsPerPane()).isEqualTo(document.getMeta().getStampsPerPane());
        assertThat(dto.getMeta().getThemes()).isNull();
        assertThat(dto.getMeta().getEuropa()).isEqualTo(document.getMeta().getEuropa());
        assertThat(dto.getRelease().getYear()).isEqualTo(document.getRelease().getYear());
        assertThat(dto.getRelease().getDate()).isEqualTo(document.getRelease().getDate());
        assertThat(dto.getRelease().getPrintQuantity()).isEqualTo(document.getRelease().getPrintQuantity());
        assertThat(dto.getRelease().getIsMassIssue()).isEqualTo(document.getRelease().getIsMassIssue());
        assertThat(dto.getRelease().getIsAvailable()).isEqualTo(document.getRelease().getIsAvailable());
        assertThat(dto.getImages().getOriginal()).isEqualTo(document.getImages().getOriginal());
        assertThat(dto.getImages().getSmall()).isEqualTo(document.getImages().getSmall());
        assertThat(dto.getImages().getPane()).isEqualTo(document.getImages().getPane());
    }

    @Test
    void shouldReturnEmptyListWhenFindAllHasNoResults() {
        when(stampRepository.findAll()).thenReturn(List.of());

        List<StampDto> result = stampService.findAll();

        assertThat(result).isEmpty();
        verify(designerRepository, never()).findAllById(anyCollection());
    }

    @Test
    void shouldReturnDtoWhenFindByIdInvoked() throws IOException {
        StampDocument document = CollectionTestDataLoader.loadStampDocument();
        DesignerDocument designer = new DesignerDocument();
        designer.setId(document.getMeta().getDesignerIds().getFirst());
        designer.setName(DESIGNER_NAME);

        when(stampRepository.findById(document.getId())).thenReturn(Optional.of(document));
        when(designerRepository.findAllById(Set.of(designer.getId()))).thenReturn(List.of(designer));

        Optional<StampDto> result = stampService.findById(document.getId());

        assertThat(result).isPresent();
        assertThat(result.get().getMeta().getDesigner()).isEqualTo(DESIGNER_NAME);
        assertThat(result.get().getMeta().getDenomination()).isEqualTo("V");
    }

    @Test
    void shouldReturnEmptyWhenFindByIdMissing() {
        when(stampRepository.findById("missing")).thenReturn(Optional.empty());

        Optional<StampDto> result = stampService.findById("missing");

        assertThat(result).isEmpty();
        verify(designerRepository, never()).findAllById(anyCollection());
    }

    @Test
    void shouldMapNullFieldsWhenDocumentHasNullMeta() {
        StampDocument document = new StampDocument();
        document.setId("s1");
        document.setName("Plain");

        when(stampRepository.findAll()).thenReturn(List.of(document));

        List<StampDto> result = stampService.findAll();

        assertThat(result).hasSize(1);
        StampDto dto = result.getFirst();
        assertThat(dto.getMeta().getDenomination()).isNull();
        assertThat(dto.getMeta().getDesigner()).isNull();
        assertThat(dto.getMeta().getThemes()).isNull();
    }
}
