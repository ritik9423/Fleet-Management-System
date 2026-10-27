package com.fleetops;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.util.Properties;

@SpringBootApplication
@EnableScheduling
public class FleetOpsApplication {

    public static void main(String[] args) {
        loadDotEnv();
        SpringApplication.run(FleetOpsApplication.class, args);
    }

    private static void loadDotEnv() {
        String[] potentialPaths = {".env", "backend/.env", "../.env"};
        for (String path : potentialPaths) {
            File envFile = new File(path);
            if (envFile.exists() && envFile.isFile()) {
                try (FileInputStream fis = new FileInputStream(envFile)) {
                    Properties props = new Properties();
                    props.load(fis);
                    for (String key : props.stringPropertyNames()) {
                        if (System.getProperty(key) == null && System.getenv(key) == null) {
                            System.setProperty(key, props.getProperty(key).trim());
                        }
                    }
                } catch (IOException ignored) {
                }
                break;
            }
        }
    }
}
