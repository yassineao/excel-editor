package com.gloyoo.backend.excel.controller;

import com.gloyoo.backend.excel.service.ExcelService;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class ExcelControllerTest {
    @Test
    void returnsValidationMessageForInvalidBoolean() throws Exception {
        var mvc = MockMvcBuilders.standaloneSetup(new ExcelController(new ExcelService())).build();

        mvc.perform(post("/excel/export")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "test.xlsx",
                                  "sheets": [{
                                    "name": "Sheet1",
                                    "rows": 1,
                                    "cols": 1,
                                    "cells": {"0,0": {"value": "Hello", "type": "BOOLEAN"}}
                                  }]
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.message").value("BOOLEAN requires a Boolean value"));
    }
}
