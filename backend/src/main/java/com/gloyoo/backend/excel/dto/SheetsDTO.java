package com.gloyoo.backend.excel.dto;

import java.util.Map;

public record SheetsDTO(
    String name,
    Map<String, CellDTO> cells,
    int rows,
    int cols
) {
}
