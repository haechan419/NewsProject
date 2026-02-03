package com.fullStc.drive.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.http.converter.ByteArrayHttpMessageConverter;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.converter.support.AllEncompassingFormHttpMessageConverter;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;

@Configuration("driveRestTemplateConfig")
public class RestTemplateConfig {
    
    @Bean("driveRestTemplate")
    public RestTemplate restTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        // 연결 타임아웃: 30초 (Python 서버 연결 대기)
        factory.setConnectTimeout(30000);
        // 읽기 타임아웃: 3분 (플레이리스트 TTS 생성 시 긴 텍스트/다건 기사로 시간 소요)
        factory.setReadTimeout(600000);
        
        RestTemplate restTemplate = new RestTemplate(factory);
        
        // 기존 컨버터들을 가져와서 수정
        List<HttpMessageConverter<?>> messageConverters = new ArrayList<>(restTemplate.getMessageConverters());
        
        // ByteArrayHttpMessageConverter가 audio/mpeg를 처리할 수 있도록 설정
        ByteArrayHttpMessageConverter byteArrayConverter = new ByteArrayHttpMessageConverter();
        // audio/mpeg, audio/mp3 등 오디오 형식 지원
        byteArrayConverter.setSupportedMediaTypes(
            java.util.Arrays.asList(
                org.springframework.http.MediaType.APPLICATION_OCTET_STREAM,
                org.springframework.http.MediaType.parseMediaType("audio/mpeg"),
                org.springframework.http.MediaType.parseMediaType("audio/mp3"),
                org.springframework.http.MediaType.parseMediaType("audio/*")
            )
        );
        
        // 기존 ByteArrayHttpMessageConverter를 찾아서 교체
        messageConverters.removeIf(converter -> converter instanceof ByteArrayHttpMessageConverter);
        messageConverters.add(byteArrayConverter);
        
        // FormHttpMessageConverter가 없으면 추가 (multipart/form-data 지원)
        boolean hasFormConverter = messageConverters.stream()
            .anyMatch(converter -> converter instanceof AllEncompassingFormHttpMessageConverter 
                || converter.getClass().getName().contains("FormHttpMessageConverter"));
        
        if (!hasFormConverter) {
            messageConverters.add(new AllEncompassingFormHttpMessageConverter());
        }
        
        restTemplate.setMessageConverters(messageConverters);
        
        return restTemplate;
    }
}

