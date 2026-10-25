package com.gloyoo.backend.excel.controller;

import com.gloyoo.backend.excel.dto.ExportExcelRequest;
import com.gloyoo.backend.excel.dto.WorkbookDTO;
import com.gloyoo.backend.excel.service.ExcelService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/excel")
public class ExcelController {
    private final ExcelService excelService;

    ExcelController(ExcelService excelService) {
        this.excelService = excelService;
    }

    @PostMapping("/import")
    public ResponseEntity<WorkbookDTO> importExcel(
            @RequestParam("file") MultipartFile file
    ) throws IOException {
        excelService.readFile(file);

        return ResponseEntity.ok(excelService.readFile(file));
    }

    @PostMapping("/export")
    public ResponseEntity<byte[]> writeExcel(
            @RequestBody ExportExcelRequest request
    ) throws IOException {
        return excelService.exportExcel(request);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleInvalidInput(IllegalArgumentException exception) {
        return ResponseEntity.badRequest()
                .body(Map.of("message", exception.getMessage() == null
                        ? "Invalid input" : exception.getMessage()));
    }



}
