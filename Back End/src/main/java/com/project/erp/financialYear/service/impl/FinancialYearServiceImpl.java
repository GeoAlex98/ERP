package com.project.erp.financialYear.service.impl;

import com.project.erp.common.HeaderIdGenerator;
import com.project.erp.common.HibernateSessionProvider;
import com.project.erp.financialYear.entity.FinancialYear;
import com.project.erp.financialYear.repository.FinancialYearRepository;
import com.project.erp.financialYear.service.FinancialYearService;
import org.hibernate.engine.spi.SharedSessionContractImplementor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.Serializable;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class FinancialYearServiceImpl implements FinancialYearService {

    @Autowired
    private FinancialYearRepository finYrRepository;

    @Autowired
    private HibernateSessionProvider sessionProvider;

    @Override
    @Transactional(readOnly = true)
    public List<FinancialYear> getAllFinancialYears() {
        return finYrRepository.findAll();
    }

    @Override
    public FinancialYear saveFinancialYear(FinancialYear financialYear) {
        validateFinancialYear(financialYear);
        checkDuplicateYear(financialYear);

        if (financialYear.getFinYrCode() == null || financialYear.getFinYrCode().trim().isEmpty()) {
            SharedSessionContractImplementor session = sessionProvider.getSharedSession();
            Serializable finYrCode = new HeaderIdGenerator().generate(session, financialYear);
            financialYear.setFinYrCode(finYrCode.toString());
        }

        return finYrRepository.save(financialYear);
    }

    @Override
    public FinancialYear updateFinancialYear(FinancialYear financialYear) {
        if (!finYrRepository.existsById(financialYear.getId())) {
            throw new RuntimeException("Financial year not found");
        }
        validateFinancialYear(financialYear);
        checkDuplicateYear(financialYear);
        return finYrRepository.save(financialYear);
    }

    @Override
    public void deleteFinancialYear(Long id) {
        finYrRepository.deleteById(id);
    }

    private void validateFinancialYear(FinancialYear fy) {
        if (fy.getStartDate() == null || fy.getEndDate() == null) {
            throw new RuntimeException("Start and End date are required");
        }
        if (fy.getStartDate().isAfter(fy.getEndDate())) {
            throw new RuntimeException("Start date cannot be after end date");
        }

        long days = ChronoUnit.DAYS.between(fy.getStartDate(), fy.getEndDate()) + 1;
        if (days != 365 && days != 366) {
            throw new RuntimeException("Financial year must be exactly 1 year");
        }
    }

    private void checkDuplicateYear(FinancialYear fy) {
        Optional<FinancialYear> existing = finYrRepository.findByStartDateAndEndDate(fy.getStartDate(), fy.getEndDate());
        if (existing.isPresent() && !existing.get().getId().equals(fy.getId())) {
            throw new RuntimeException("Financial year already exists");
        }
    }

    @Override
    public FinancialYear getCurrentActiveFinYear() {
        LocalDate today = LocalDate.now();

        // Try to fetch existing financial year
        Optional<FinancialYear> existingFinYr = finYrRepository.findFinYearByDate(today);

        // If none exists, auto-create
        return existingFinYr.orElseGet(this::autoCreateFinYr);
    }

    @Override
    public FinancialYear autoCreateFinYr() {
        LocalDate today = LocalDate.now();
        LocalDate startDate = getFinYrStart(today);
        LocalDate endDate = getFinYrEnd(today);

        // Check if financial year already exists to avoid duplicates
        Optional<FinancialYear> existing = finYrRepository.findByStartDateAndEndDate(startDate, endDate);
        if (existing.isPresent()) {
            return existing.get();
        }

        int startYear = startDate.getYear();
        int endYear = endDate.getYear();
        String year = startYear + "-" + endYear;
        String code = String.format("%02d-%02d", startYear % 100, endYear % 100);

        FinancialYear financialYear = FinancialYear.builder()
                .finYrCode(code)
                .year(year)
                .startDate(startDate)
                .endDate(endDate)
                .build();

        validateFinancialYear(financialYear);

        if (financialYear.getFinYrCode() == null || financialYear.getFinYrCode().trim().isEmpty()) {
            SharedSessionContractImplementor session = sessionProvider.getSharedSession();
            Serializable finYrCode = new HeaderIdGenerator().generate(session, financialYear);
            financialYear.setFinYrCode(finYrCode.toString());
        }

        return finYrRepository.save(financialYear);
    }

    private LocalDate getFinYrStart(LocalDate date) {
        int year = (date.getMonthValue() >= 4) ? date.getYear() : date.getYear() - 1;
        return LocalDate.of(year, 4, 1);
    }

    private LocalDate getFinYrEnd(LocalDate date) {
        int year = (date.getMonthValue() >= 4) ? date.getYear() : date.getYear() - 1;
        return LocalDate.of(year + 1, 3, 31);
    }
}
