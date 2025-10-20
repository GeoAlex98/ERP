package com.project.erp.financialYear.controller;

import com.project.erp.financialYear.entity.FinancialYear;
import com.project.erp.financialYear.service.FinancialYearService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/financialYear")
public class FinancialYearController {

    @Autowired
    private FinancialYearService service;

    @GetMapping
    public List<FinancialYear> getAll() {
        return service.getAllFinancialYears();
    }

    @PostMapping
    public FinancialYear save(@RequestBody FinancialYear financialYear) {
        return service.saveFinancialYear(financialYear);
    }

    @PutMapping("/{id}")
    public FinancialYear update(@PathVariable Long id, @RequestBody FinancialYear financialYear) {
        financialYear.setId(id);
        return service.updateFinancialYear(financialYear);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.deleteFinancialYear(id);
    }
}
