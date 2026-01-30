package com.vasylenko.ecollectobackend.fdc;

import com.vasylenko.ecollectobackend.dto.FirstDayCoverDto;
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
class FirstDayCoverControllerTest {
    private static final String COVER_ID = "fdc1";
    private static final String DESIGNER_NAME = "Boris Groh";

    private MockMvc mockMvc;

    @Mock
    private FirstDayCoverService firstDayCoverService;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new FirstDayCoverController(firstDayCoverService)).build();
    }

    @Test
    void shouldReturnAllFirstDayCovers() throws Exception {
        FirstDayCoverDto dto = FirstDayCoverDto.builder()
                .name("Space")
                .designer(DESIGNER_NAME)
                .release(FirstDayCoverDto.ReleaseDto.builder().year(2024).build())
                .build();

        when(firstDayCoverService.findAll()).thenReturn(List.of(dto));

        mockMvc.perform(get("/api/first-day-covers"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Space"))
                .andExpect(jsonPath("$[0].designer").value(DESIGNER_NAME))
                .andExpect(jsonPath("$[0].release.year").value(2024));
    }

    @Test
    void shouldReturnFirstDayCoverByIdWhenFound() throws Exception {
        FirstDayCoverDto dto = FirstDayCoverDto.builder()
                .name("Space")
                .designer(DESIGNER_NAME)
                .build();

        when(firstDayCoverService.findById(COVER_ID)).thenReturn(Optional.of(dto));

        mockMvc.perform(get("/api/first-day-covers/" + COVER_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Space"))
                .andExpect(jsonPath("$.designer").value(DESIGNER_NAME));
    }

    @Test
    void shouldReturnNotFoundWhenFirstDayCoverMissing() throws Exception {
        when(firstDayCoverService.findById(COVER_ID)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/first-day-covers/" + COVER_ID))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldReturnErrorResponseWhenServiceThrows() throws Exception {
        when(firstDayCoverService.findAll()).thenThrow(new RuntimeException("boom"));

        mockMvc.perform(get("/api/first-day-covers"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.message").value("boom"))
                .andExpect(jsonPath("$.code").value("FIRST_DAY_COVER_ERROR"))
                .andExpect(jsonPath("$.status").value(500));
    }
}
