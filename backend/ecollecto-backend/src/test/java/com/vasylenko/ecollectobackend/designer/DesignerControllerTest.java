package com.vasylenko.ecollectobackend.designer;

import com.vasylenko.ecollectobackend.dto.DesignerDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.Optional;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class DesignerControllerTest {
    private static final String DESIGNER_ID = "d1";
    private static final String DESIGNER_NAME = "Boris Groh";

    private MockMvc mockMvc;

    @Mock
    private DesignerService designerService;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new DesignerController(designerService)).build();
    }

    @Test
    void shouldReturnAllDesigners() throws Exception {
        DesignerDto dto = DesignerDto.builder()
                .designerId(DESIGNER_ID)
                .name(DESIGNER_NAME)
                .build();

        when(designerService.findAll()).thenReturn(List.of(dto));

        mockMvc.perform(get("/api/designers"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].designer_id").value(DESIGNER_ID))
                .andExpect(jsonPath("$[0].name").value(DESIGNER_NAME));
    }

    @Test
    void shouldReturnDesignerByIdWhenFound() throws Exception {
        DesignerDto dto = DesignerDto.builder()
                .designerId(DESIGNER_ID)
                .name(DESIGNER_NAME)
                .build();

        when(designerService.findById(DESIGNER_ID)).thenReturn(Optional.of(dto));

        mockMvc.perform(get("/api/designer/" + DESIGNER_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.designer_id").value(DESIGNER_ID))
                .andExpect(jsonPath("$.name").value(DESIGNER_NAME));
    }

    @Test
    void shouldReturnNotFoundWhenDesignerMissing() throws Exception {
        when(designerService.findById("missing")).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/designer/missing"))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldReturnErrorResponseWhenServiceThrows() throws Exception {
        when(designerService.findAll()).thenThrow(new RuntimeException("boom"));

        mockMvc.perform(get("/api/designers"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.message").value("boom"))
                .andExpect(jsonPath("$.code").value("DESIGNER_ERROR"))
                .andExpect(jsonPath("$.status").value(500));
    }
}
