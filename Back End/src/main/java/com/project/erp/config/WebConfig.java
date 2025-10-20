package com.project.erp.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    // Base folder for all uploads
    private static final String UPLOADS_DIR = "D:/Project/erp-backend/uploads/";

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Serve all subdirectories dynamically
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + UPLOADS_DIR);
    }
}
