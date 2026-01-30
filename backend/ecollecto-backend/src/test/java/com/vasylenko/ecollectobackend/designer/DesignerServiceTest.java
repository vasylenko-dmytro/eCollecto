package com.vasylenko.ecollectobackend.designer;

import com.vasylenko.ecollectobackend.dto.DesignerDto;
import com.vasylenko.ecollectobackend.utils.CollectionTestDataLoader;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DesignerServiceTest {
    private static final String DESIGNER_NAME = "Boris Groh";
    private static final String DESIGNER_ID = "d1";

    @Mock
    private DesignerRepository designerRepository;

    @InjectMocks
    private DesignerService designerService;

    @Test
    void shouldReturnMappedDtosWhenFindAllInvoked() throws IOException {
        DesignerDocument document = CollectionTestDataLoader.loadDesignerDocument();

        when(designerRepository.findAll()).thenReturn(List.of(document));

        List<DesignerDto> result = designerService.findAll();

        assertThat(result).hasSize(1);
        assertThat(result.getFirst().getDesignerId()).isEqualTo(document.getId());
        assertThat(result.getFirst().getName()).isEqualTo(document.getName());
    }

    @Test
    void shouldReturnEmptyListWhenFindAllHasNoResults() {
        when(designerRepository.findAll()).thenReturn(List.of());

        List<DesignerDto> result = designerService.findAll();

        assertThat(result).isEmpty();
    }

    @Test
    void shouldReturnDtoWhenDesignerFoundById() throws IOException {
        DesignerDocument document = CollectionTestDataLoader.loadDesignerDocument();

        when(designerRepository.findById(DESIGNER_ID)).thenReturn(Optional.of(document));

        Optional<DesignerDto> result = designerService.findById(DESIGNER_ID);

        assertThat(result).isPresent();
        assertThat(result.get().getDesignerId()).isEqualTo(DESIGNER_ID);
        assertThat(result.get().getName()).isEqualTo(DESIGNER_NAME);
    }

    @Test
    void shouldReturnEmptyWhenDesignerMissingById() {
        when(designerRepository.findById("missing")).thenReturn(Optional.empty());

        Optional<DesignerDto> result = designerService.findById("missing");

        assertThat(result).isEmpty();
    }

    @Test
    void shouldMapNullFieldsWhenDocumentHasNulls() {
        DesignerDocument document = new DesignerDocument();

        when(designerRepository.findAll()).thenReturn(List.of(document));

        List<DesignerDto> result = designerService.findAll();

        assertThat(result).hasSize(1);
        assertThat(result.getFirst().getDesignerId()).isNull();
        assertThat(result.getFirst().getName()).isNull();
    }

}
