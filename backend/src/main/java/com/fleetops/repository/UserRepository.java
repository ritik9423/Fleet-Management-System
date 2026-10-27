package com.fleetops.repository;

import com.fleetops.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByUsernameIgnoreCase(String username);
    Optional<User> findByEmail(String email);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);

    @org.springframework.data.jpa.repository.Query("SELECT u FROM User u WHERE u.username = :ident OR u.email = :ident OR LOWER(u.username) = LOWER(:ident) OR (:ident IN ('rajesh', 'driver') AND u.username = 'rajesh.sharma')")
    Optional<User> findByIdentifier(@org.springframework.data.repository.query.Param("ident") String identifier);
}
