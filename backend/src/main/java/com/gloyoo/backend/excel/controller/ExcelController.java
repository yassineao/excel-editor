package com.gloyoo.backend.excel.controller;

import com.gloyoo.backend.excel.dto.ExportExcelRequest;
import com.gloyoo.backend.excel.service.ExcelService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/excel")
public class ExcelController {
    private final ExcelService excelService;

    ExcelController(ExcelService excelService) {
        this.excelService = excelService;
    }

    @PostMapping("/import")
    public ResponseEntity<String> importExcel(
            @RequestParam("file") MultipartFile file
    ) throws IOException {
        excelService.readFile(file);

        return ResponseEntity.ok("File imported successfully");
    }

    @PostMapping("/export")
    public ResponseEntity<byte[]> writeExcel(
            @RequestBody ExportExcelRequest request
    ) throws IOException {
        return excelService.exportExcel(request);
    }



}
