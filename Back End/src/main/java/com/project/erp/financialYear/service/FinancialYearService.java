package com.project.erp.financialYear.service;

import com.project.erp.financialYear.entity.FinancialYear;

import java.util.List;
import java.util.Optional;

public interface FinancialYearService {

    List<FinancialYear> getAllFinancialYears();

    FinancialYear saveFinancialYear(FinancialYear financialYear) throws RuntimeException;

    FinancialYear updateFinancialYear(FinancialYear financialYear) throws RuntimeException;

    void deleteFinancialYear(Long id);

    FinancialYear getCurrentActiveFinYear();

    FinancialYear autoCreateFinYr();
}
