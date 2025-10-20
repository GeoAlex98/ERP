package com.project.erp.user;

import com.project.erp.user.entity.User;
import com.project.erp.user.entity.UserPasswordHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Transactional
@Repository
public interface UserPasswordHistoryRepository extends JpaRepository<UserPasswordHistory, Long> {
    List<UserPasswordHistory> findTop3ByUserOrderByCreatedAtDesc(User user);

    List<UserPasswordHistory> findByUserIdOrderByCreatedAtDesc(Long userId);
}
