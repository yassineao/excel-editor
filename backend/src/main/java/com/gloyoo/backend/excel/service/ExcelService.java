package com.gloyoo.backend.excel.service;

import com.gloyoo.backend.excel.dto.CellDTO;
import com.gloyoo.backend.excel.dto.ExportExcelRequest;
import com.gloyoo.backend.excel.dto.SheetsDTO;
import com.gloyoo.backend.excel.dto.WorkbookDTO;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.jspecify.annotations.NonNull;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;

@Service
public class ExcelService {

    public ResponseEntity<byte[]> exportExcel(ExportExcelRequest request) throws IOException {
        WorkbookDTO workbookDTO = new WorkbookDTO(request.name(), request.sheets());
        byte[] content = writeExcel(workbookDTO);
        String filename = getExportFilename(request.name());

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
                        .filename(filename, StandardCharsets.UTF_8).build().toString())
                .contentLength(content.length)
                .body(content);
    }

    private String getExportFilename(String name) {
        String filename = name == null || name.isBlank() ? "workbook" : name;
        filename = filename.replaceAll("[\\\\/\\r\\n]", "_");
        if (!filename.toLowerCase(Locale.ROOT).endsWith(".xlsx")) {
            filename += ".xlsx";
        }
        return filename;
    }

    public WorkbookDTO readFile(MultipartFile file) throws IOException{
        validateExcelFile(file);
        ArrayList<SheetsDTO> sheetsDTOs = new ArrayList<>();
        try (InputStream fileInputStream = file.getInputStream();
             Workbook workbook = WorkbookFactory.create(fileInputStream)) {


            for (Sheet sheet : workbook) {
                System.out.println(sheet.getSheetName());
                int rows = 0;
                int columns = 0;
                Map<String, CellDTO> cellDTO = new LinkedHashMap<>();
                DataFormatter formatter = new DataFormatter();
                for (Row row : sheet) {
                    rows = Math.max(rows, row.getRowNum() + 1);
                    columns = Math.max(columns, row.getLastCellNum());
                    for (Cell cell : row) {
                        String key = cell.getRowIndex() + "," + cell.getColumnIndex();
                        cellDTO.put(key,this.getCellValue(cell));
                        System.out.println(formatter.formatCellValue(cell));
                    }
                }
                SheetsDTO sheetsDTO = new SheetsDTO(sheet.getSheetName(),cellDTO,rows,columns);
                sheetsDTOs.add(sheetsDTO);
            }
            return new WorkbookDTO(file.getOriginalFilename(), sheetsDTOs);
        }
    }



    private byte[] writeExcel(WorkbookDTO workbookDTO) throws IOException {
        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream output = new ByteArrayOutputStream()) {

            for (SheetsDTO sheetDto : workbookDTO.sheets()) {

                Sheet sheet = workbook.createSheet(sheetDto.name());

                for (var entry : sheetDto.cells().entrySet()) {

                    String[] position = entry.getKey().split(",");

                    int rowIndex = Integer.parseInt(position[0]);
                    int colIndex = Integer.parseInt(position[1]);

                    Row row = sheet.getRow(rowIndex);

                    if (row == null) {
                        row = sheet.createRow(rowIndex);
                    }

                    Cell cell = row.createCell(colIndex);

                    setCellValue(cell, entry.getValue());
                }

            }
            workbook.write(output);

            // Convert to byte[]
            return output.toByteArray();
        }

    }

    private void setCellValue(Cell cell, CellDTO cellDTO) {
        Object value = cellDTO.value();
        CellType type = CellType.valueOf(cellDTO.type());

        switch (type) {
            case STRING -> cell.setCellValue((String) value);
            case NUMERIC -> cell.setCellValue(((Number) value).doubleValue());
            case BOOLEAN -> cell.setCellValue((Boolean) value);
            case FORMULA -> {
                String formula = (String) value;
                cell.setCellFormula(formula.startsWith("=") ? formula.substring(1) : formula);
            }
            case BLANK -> cell.setBlank();
            case ERROR -> cell.setCellErrorValue(((Number) value).byteValue());
            default -> throw new IllegalArgumentException("Unsupported cell type: " + type);
        }
    }

    private CellDTO getCellValue(Cell cell) {
        if (cell == null) {
            return null;
        }
        Object value = switch (cell.getCellType()) {
            case STRING ->  cell.getStringCellValue();
            case NUMERIC -> cell.getNumericCellValue();
            case BOOLEAN -> cell.getBooleanCellValue();
            case FORMULA -> "=" + cell.getCellFormula();
            case BLANK -> null;
            case ERROR -> cell.getErrorCellValue();
            default -> null;
        };
        return new CellDTO(value, String.valueOf(cell.getCellType()));

    }
    private void validateExcelFile(@NonNull MultipartFile file) throws IOException{

        if (file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }

        String filename = file.getOriginalFilename();

        if (filename == null ||
                !filename.toLowerCase(Locale.ROOT).endsWith(".xlsx")) {

            throw new IllegalArgumentException(
                    "Only .xlsx files are supported"
            );
        }

        if (file.getSize() > 10 * 1024 * 1024) {
            throw new IllegalArgumentException(
                    "File exceeds 10 MB"
            );
        }

        try (InputStream inputStream = file.getInputStream();
             Workbook workbook = WorkbookFactory.create(inputStream)) {

            if (workbook.getNumberOfSheets() == 0) {
                throw new IllegalArgumentException(
                        "Workbook contains no sheets"
                );
            }

        } catch (IOException | RuntimeException e) {
            throw new IllegalArgumentException(
                    "Invalid or unsupported Excel file", e
            );
        }
    }
}
