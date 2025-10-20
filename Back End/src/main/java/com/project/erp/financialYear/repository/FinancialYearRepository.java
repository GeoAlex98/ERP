package com.project.erp.financialYear.repository;

import com.project.erp.financialYear.entity.FinancialYear;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface FinancialYearRepository extends JpaRepository<FinancialYear, Long> {
    Optional<FinancialYear> findByStartDateAndEndDate(LocalDate startDate, LocalDate endDate);

    @Query("SELECT f FROM FinancialYear f " +
            "WHERE :date BETWEEN f.startDate AND f.endDate")
    Optional<FinancialYear> findFinYearByDate(@Param("date") LocalDate date);

    Optional<FinancialYear> findByYear(String finYrCode);
}

