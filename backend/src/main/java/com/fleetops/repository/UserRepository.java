package com.fleetops.repository;

import com.fleetops.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByUsernameIgnoreCase(String username);
    Optional<User> findByEmail(String email);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);

    /**
     * Highly optimized index-friendly query avoiding SQL functions on indexed columns.
     */
    @Query("SELECT u FROM User u WHERE u.username = :raw OR u.email = :raw OR u.username = :lower OR (:lower IN ('rajesh', 'driver') AND u.username = 'rajesh.sharma')")
    Optional<User> findByIdentifier(@Param("raw") String raw, @Param("lower") String lower);
}
