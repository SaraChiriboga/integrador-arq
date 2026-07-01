package com.integradorarq.portal.repository;

import com.integradorarq.portal.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByCedula(String cedula);
}
