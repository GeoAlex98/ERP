package com.project.erp.health;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.util.HashMap;
import java.util.Map;

@RestController
public class HealthController {

    @Autowired
    private DataSource dataSource;

    @Autowired
    private Environment environment;

    @Value("${app.version}")
    private String appVersion;

    @GetMapping("/api/health")
    public Map<String, Object> healthCheck() {
        Map<String, Object> response = new HashMap<>();

        // ✅ DB check
        try (Connection conn = dataSource.getConnection()) {
            response.put("database", "UP");
        } catch (Exception e) {
            response.put("database", "DOWN");
        }

        // ✅ App metadata
        response.put("status", "UP");
        response.put("version", appVersion);
        response.put("profiles", environment.getActiveProfiles());
        response.put("timestamp", System.currentTimeMillis());

        return response;
    }
}
