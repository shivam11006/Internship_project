package com.example.legalaid_backend.controller;

import com.example.legalaid_backend.DTO.BulkImportResponse;
import com.example.legalaid_backend.DTO.CsvPreviewResponse;
import com.example.legalaid_backend.DTO.FieldMappingConfig;
import com.example.legalaid_backend.DTO.FlexibleImportRequest;
import com.example.legalaid_backend.service.BulkImportServiceV2;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.slf4j.MDC;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/admin/import")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class BulkImportControllerV2 {
    private final BulkImportServiceV2 bulkImportServiceV2;

    /**
     * STEP 1: Preview CSV and get suggested mappings
     * POST /api/admin/import/v2/preview
     */
    @PostMapping(value = "/preview", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> previewCsv(
            @RequestParam("file") MultipartFile file,
            @RequestParam("role") String role, // "LAWYER" or "NGO"
            Authentication auth) {

        MDC.put("username", auth.getName());
        MDC.put("endpoint", "/api/admin/import/v2/preview");

        try {
            log.info("Admin {} previewing CSV: file={}, role={}",
                    auth.getName(), file.getOriginalFilename(), role);

            // Parse CSV into flexible format
            List<Map<String, String>> csvData = parseCsvFlexible(file);

            // Get preview with suggested mappings
            CsvPreviewResponse preview = bulkImportServiceV2.previewCsv(csvData, role);

            log.info("CSV preview generated: {} rows, {} headers detected",
                    preview.getTotalRows(), preview.getDetectedHeaders().size());

            return ResponseEntity.ok(preview);

        } catch (Exception e) {
            log.error("Failed to preview CSV: {}", e.getMessage(), e);
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        } finally {
            MDC.clear();
        }
    }

    /**
     * STEP 2: Import with confirmed mappings (Lawyers)
     * POST /api/admin/import/v2/lawyers
     */
    @PostMapping("/lawyers")
    public ResponseEntity<?> importLawyersV2(
            @RequestBody FlexibleImportRequest request,
            Authentication auth) {

        MDC.put("username", auth.getName());
        MDC.put("endpoint", "/api/admin/import/v2/lawyers");

        try {
            log.info("Admin {} importing {} lawyers with default password",
                    auth.getName(), request.getRows().size());

            request.setRole("LAWYER");
            if (request.getDefaultPassword() == null) {
                request.setDefaultPassword("lawyer123");
            }

            BulkImportResponse response = bulkImportServiceV2.importLawyersV2(request);

            log.info("Lawyer import completed: {} success, {} failures",
                    response.getSuccessCount(), response.getFailureCount());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Failed to import lawyers: {}", e.getMessage(), e);
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        } finally {
            MDC.clear();
        }
    }

    /**
     * STEP 2: Import with confirmed mappings (NGOs)
     * POST /api/admin/import/v2/ngos
     */
    @PostMapping("/ngos")
    public ResponseEntity<?> importNgosV2(
            @RequestBody FlexibleImportRequest request,
            Authentication auth) {

        MDC.put("username", auth.getName());
        MDC.put("endpoint", "/api/admin/import/v2/ngos");

        try {
            log.info("Admin {} importing {} NGOs with default password",
                    auth.getName(), request.getRows().size());

            request.setRole("NGO");
            if (request.getDefaultPassword() == null) {
                request.setDefaultPassword("ngo123");
            }

            BulkImportResponse response = bulkImportServiceV2.importNgosV2(request);

            log.info("NGO import completed: {} success, {} failures",
                    response.getSuccessCount(), response.getFailureCount());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Failed to import NGOs: {}", e.getMessage(), e);
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        } finally {
            MDC.clear();
        }
    }

    /**
     * ONE-STEP: Quick import with auto-detection (Lawyers)
     * POST /api/admin/import/v2/lawyers/quick
     */
    @PostMapping(value = "/lawyers/quick", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> quickImportLawyers(
            @RequestParam("file") MultipartFile file,
            @RequestParam(defaultValue = "lawyer123") String defaultPassword,
            @RequestParam(defaultValue = "true") boolean autoApprove,
            Authentication auth) {

        MDC.put("username", auth.getName());
        MDC.put("endpoint", "/api/admin/import/v2/lawyers/quick");

        try {
            log.info("Admin {} quick importing lawyers: file={}",
                    auth.getName(), file.getOriginalFilename());

            // Parse CSV
            List<Map<String, String>> csvData = parseCsvFlexible(file);

            // Auto-detect mappings
            CsvPreviewResponse preview = bulkImportServiceV2.previewCsv(csvData, "LAWYER");

            // Build import request with auto-detected mappings
            FlexibleImportRequest request = new FlexibleImportRequest();
            request.setRows(csvData);
            request.setMapping(new FieldMappingConfig(preview.getSuggestedMapping()));
            request.setRole("LAWYER");
            request.setDefaultPassword(defaultPassword);
            request.setAutoApprove(autoApprove);
            request.setGenerateEmails(true);

            // Execute import
            BulkImportResponse response = bulkImportServiceV2.importLawyersV2(request);

            log.info("Quick import completed: {} success, {} failures",
                    response.getSuccessCount(), response.getFailureCount());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Failed to quick import lawyers: {}", e.getMessage(), e);
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        } finally {
            MDC.clear();
        }
    }

    /**
     * ONE-STEP: Quick import with auto-detection (NGOs)
     * POST /api/admin/import/v2/ngos/quick
     */
    @PostMapping(value = "/ngos/quick", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> quickImportNgos(
            @RequestParam("file") MultipartFile file,
            @RequestParam(defaultValue = "ngo123") String defaultPassword,
            @RequestParam(defaultValue = "true") boolean autoApprove,
            Authentication auth) {

        MDC.put("username", auth.getName());
        MDC.put("endpoint", "/api/admin/import/v2/ngos/quick");

        try {
            log.info("Admin {} quick importing NGOs: file={}",
                    auth.getName(), file.getOriginalFilename());

            // Parse CSV
            List<Map<String, String>> csvData = parseCsvFlexible(file);

            // Auto-detect mappings
            CsvPreviewResponse preview = bulkImportServiceV2.previewCsv(csvData, "NGO");

            // Build import request
            FlexibleImportRequest request = new FlexibleImportRequest();
            request.setRows(csvData);
            request.setMapping(new FieldMappingConfig(preview.getSuggestedMapping()));
            request.setRole("NGO");
            request.setDefaultPassword(defaultPassword);
            request.setAutoApprove(autoApprove);
            request.setGenerateEmails(true);

            // Execute import
            BulkImportResponse response = bulkImportServiceV2.importNgosV2(request);

            log.info("Quick import completed: {} success, {} failures",
                    response.getSuccessCount(), response.getFailureCount());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Failed to quick import NGOs: {}", e.getMessage(), e);
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        } finally {
            MDC.clear();
        }
    }

    // ==================== CSV PARSING ====================

    /**
     * Parse CSV into flexible format (preserves original column names)
     */
    private List<Map<String, String>> parseCsvFlexible(MultipartFile file) throws Exception {
        List<Map<String, String>> data = new ArrayList<>();

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream()))) {
            String headerLine = reader.readLine();
            if (headerLine == null) {
                throw new IllegalArgumentException("CSV is empty");
            }

            // Parse headers
            String[] headers = headerLine.split(",");
            for (int i = 0; i < headers.length; i++) {
                headers[i] = headers[i].trim();
            }

            // Parse data rows
            String line;
            while ((line = reader.readLine()) != null) {
                String[] values = line.split(",", -1); // -1 to preserve empty values

                Map<String, String> row = new HashMap<>();
                for (int i = 0; i < headers.length && i < values.length; i++) {
                    row.put(headers[i], values[i].trim());
                }

                data.add(row);
            }
        }

        return data;
    }

    /**
     * Parse Excel into flexible format
     */
    private List<Map<String, String>> parseExcelFlexible(MultipartFile file) throws Exception {
        List<Map<String, String>> data = new ArrayList<>();

        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);

            // Get headers from first row
            Row headerRow = sheet.getRow(0);
            if (headerRow == null) {
                throw new IllegalArgumentException("Excel is empty");
            }

            List<String> headers = new ArrayList<>();
            for (Cell cell : headerRow) {
                headers.add(getCellValueAsString(cell));
            }

            // Parse data rows
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row != null) {
                    Map<String, String> rowData = new HashMap<>();
                    for (int j = 0; j < headers.size(); j++) {
                        Cell cell = row.getCell(j);
                        rowData.put(headers.get(j), getCellValueAsString(cell));
                    }
                    data.add(rowData);
                }
            }
        }

        return data;
    }

    private String getCellValueAsString(Cell cell) {
        if (cell == null) return "";

        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue().trim();
            case NUMERIC:
                if (DateUtil.isCellDateFormatted(cell)) {
                    return cell.getDateCellValue().toString();
                }
                return String.valueOf((long) cell.getNumericCellValue());
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            case FORMULA:
                return cell.getCellFormula();
            default:
                return "";
        }
    }
}
