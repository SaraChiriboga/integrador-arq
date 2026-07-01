package com.integradorarq.portal.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI portalOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Portal Ciudadano API")
                        .description("API REST del Portal Ciudadano - Consulta de Antecedentes OSINT")
                        .version("1.0.0"));
    }
}
