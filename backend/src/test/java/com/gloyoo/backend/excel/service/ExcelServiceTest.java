package com.gloyoo.backend.excel.service;

import com.gloyoo.backend.excel.dto.ExportExcelRequest;
import com.gloyoo.backend.excel.dto.SheetsDTO;
import com.gloyoo.backend.excel.dto.WorkbookDTO;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.Test;
import com.gloyoo.backend.excel.dto.CellDTO;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.InstanceOfAssertFactories.PATH;
import static org.junit.jupiter.api.Assertions.*;

class ExcelServiceTest {
    private final ExcelService service = new ExcelService();


    @Test
    void readsTextNumbersAndBooleans() throws IOException {
        var result = service.readFile(workbookFile(true));

        assertThat(result.name()).isEqualTo("data.xlsx");
        assertThat(result.sheets()).hasSize(1);
        var sheet = result.sheets().getFirst();
        assertThat(sheet.name()).isEqualTo("Daten");
        assertThat(sheet.rows()).isEqualTo(1);
        assertThat(sheet.cols()).isEqualTo(3);
        assertThat(sheet.cells()).hasSize(3)
                .containsEntry("0,0", new CellDTO("Artikel", "STRING"))
                .containsEntry("0,1", new CellDTO(42.0, "NUMERIC"))
                .containsEntry("0,2", new CellDTO(true, "BOOLEAN"));
    }

    @Test
    void writesAnExcelFromWorkBookDTO() throws IOException {
        ArrayList<SheetsDTO> sheets = new ArrayList<>();

        sheets.add(new SheetsDTO(
                "Sheet1",
                new HashMap<>(),
                10,
                5
        ));

        sheets.add(new SheetsDTO(
                "Sheet2",
                new HashMap<>(),
                20,
                8
        ));

        ExportExcelRequest exportExcelRequest = new ExportExcelRequest(
                "test.xlsx",
                "test",
                sheets
        );

        ResponseEntity<byte[]> response = service.exportExcel(exportExcelRequest);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());

        assertEquals(
                MediaType.parseMediaType(
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                ),
                response.getHeaders().getContentType()
        );

        assertNotNull(response.getBody());
        assertTrue(response.getBody().length > 0);

        assertEquals(
                response.getBody().length,
                response.getHeaders().getContentLength()
        );

        assertEquals(
                "test.xlsx",
                response.getHeaders().getContentDisposition().getFilename()
        );


    }

    @Test
    void rejectsFalseTypeValue() throws IOException {
        ArrayList<SheetsDTO> sheets = new ArrayList<>();
        HashMap<String, CellDTO> cells = new HashMap<>();

        cells.put("0,0", new CellDTO("Hello", "BOOLEAN"));

        sheets.add(new SheetsDTO(
                "Sheet2",
                 cells,
                20,
                8
        ));

        ExportExcelRequest exportExcelRequest = new ExportExcelRequest(
                "test.xlsx",
                "test",
                sheets
        );
        assertThatThrownBy(() -> service.exportExcel(exportExcelRequest))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("BOOLEAN requires a Boolean value");
    }

    @Test
    void rejectsEmptyFile() {
        var file = new MockMultipartFile("file", "empty.xlsx", null, new byte[0]);

        assertThatThrownBy(() -> service.readFile(file))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("File is empty");
    }

    @Test
    void rejectsWrongExtension() {
        var file = new MockMultipartFile("file", "data.csv", null, new byte[]{1});

        assertThatThrownBy(() -> service.readFile(file))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Only .xlsx files are supported");
    }

    @Test
    void rejectsOversizedFile() {
        var file = new MockMultipartFile("file", "large.xlsx", null,
                new byte[10 * 1024 * 1024 + 1]);

        assertThatThrownBy(() -> service.readFile(file))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("File exceeds 10 MB");
    }

    @Test
    void rejectsInvalidWorkbook() {
        var file = new MockMultipartFile("file", "invalid.xlsx", null, new byte[]{1, 2, 3});

        assertThatThrownBy(() -> service.readFile(file))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Invalid or unsupported Excel file");
    }

    @Test
    void rejectsWorkbookWithoutSheets() throws IOException {
        var file = workbookFile(false);

        assertThatThrownBy(() -> service.readFile(file))
                .isInstanceOf(IllegalArgumentException.class)
                .hasRootCauseMessage("Workbook contains no sheets");
    }

    private MockMultipartFile workbookFile(boolean withSheet) throws IOException {
        try (var workbook = new XSSFWorkbook(); var out = new ByteArrayOutputStream()) {
            if (withSheet) {
                var row = workbook.createSheet("Daten").createRow(0);
                row.createCell(0).setCellValue("Artikel");
                row.createCell(1).setCellValue(42);
                row.createCell(2).setCellValue(true);
            }
            workbook.write(out);
            return new MockMultipartFile("file", "data.xlsx",
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    out.toByteArray());
        }
    }
}
