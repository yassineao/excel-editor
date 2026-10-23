package com.gloyoo.backend.excel.dto;

import java.util.ArrayList;

public record WorkbookDTO(

        String name,
        ArrayList<SheetsDTO> sheets
) {
}
