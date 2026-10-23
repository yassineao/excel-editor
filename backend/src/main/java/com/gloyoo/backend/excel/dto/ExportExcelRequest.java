package com.gloyoo.backend.excel.dto;

import java.util.ArrayList;

public record ExportExcelRequest(
        String path,
        String name,
        ArrayList<SheetsDTO> sheets
) {
}
