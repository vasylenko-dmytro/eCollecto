package com.vasylenko.ecollectobackend.stamp;

import com.vasylenko.ecollectobackend.dto.StampDto;
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
class StampControllerTest {
    private static final String STAMP_ID = "s1974";
    private static final String STAMP_NAME = "Trident";

    private MockMvc mockMvc;

    @Mock
    private StampService stampService;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new StampController(stampService)).build();
    }

    @Test
    void shouldReturnAllStamps() throws Exception {
        StampDto dto = StampDto.builder()
                .stampId(STAMP_ID)
                .name(STAMP_NAME)
                .build();

        when(stampService.findAll()).thenReturn(List.of(dto));

        mockMvc.perform(get("/api/stamps"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].stamp_id").value(STAMP_ID))
                .andExpect(jsonPath("$[0].name").value(STAMP_NAME));
    }

    @Test
    void shouldReturnStampByIdWhenFound() throws Exception {
        StampDto dto = StampDto.builder()
                .stampId(STAMP_ID)
                .name(STAMP_NAME)
                .build();

        when(stampService.findById(STAMP_ID)).thenReturn(Optional.of(dto));

        mockMvc.perform(get("/api/stamp/" + STAMP_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.stamp_id").value(STAMP_ID))
                .andExpect(jsonPath("$.name").value(STAMP_NAME));
    }

    @Test
    void shouldReturnNotFoundWhenStampMissing() throws Exception {
        when(stampService.findById(STAMP_ID)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/stamp/" + STAMP_ID))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldReturnErrorResponseWhenServiceThrows() throws Exception {
        when(stampService.findAll()).thenThrow(new RuntimeException("boom"));

        mockMvc.perform(get("/api/stamps"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.message").value("boom"))
                .andExpect(jsonPath("$.code").value("STAMP_ERROR"))
                .andExpect(jsonPath("$.status").value(500));
    }
}
