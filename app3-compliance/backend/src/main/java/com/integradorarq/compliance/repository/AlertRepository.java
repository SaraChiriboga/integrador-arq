package com.integradorarq.compliance.repository;

import com.integradorarq.compliance.model.Alert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AlertRepository extends JpaRepository<Alert, String> {
    List<Alert> findAllByOrderByTimestampDesc();
}
