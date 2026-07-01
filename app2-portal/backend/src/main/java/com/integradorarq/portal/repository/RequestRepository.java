package com.integradorarq.portal.repository;

import com.integradorarq.portal.model.Request;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface RequestRepository extends JpaRepository<Request, UUID> {
    List<Request> findByUserCedulaOrderByCreatedAtDesc(String cedula);
}
