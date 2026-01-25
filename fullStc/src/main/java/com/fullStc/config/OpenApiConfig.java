package com.fullStc.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

// Swagger(OpenAPI) 설정
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI openAPI() {
        String jwt = "JWT";
        
        // SecurityScheme 정의 (JWT Bearer 토큰)
        // Swagger UI의 Authorize 버튼에 토큰 입력 필드를 생성합니다
        SecurityScheme securityScheme = new SecurityScheme()
                .type(SecurityScheme.Type.HTTP)
                .scheme("bearer")
                .bearerFormat("JWT")
                .name("JWT")
                .description("로그인 API에서 받은 accessToken을 입력하세요. 'Bearer '는 자동으로 추가됩니다.");
        
        // Components에 SecurityScheme 추가
        Components components = new Components()
                .addSecuritySchemes(jwt, securityScheme);

        return new OpenAPI()
                .info(new Info()
                        .title("FullStc API")
                        .description("실시간 요약 및 영상 뉴스 웹사이트 API 문서")
                        .version("v1.0"))
                .components(components);
    }
}
