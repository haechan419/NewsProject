package com.fullStc.news.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import com.fullStc.news.provider.OpenAiEmbedder;

import java.util.Map;

@Service   // ⭐⭐⭐ 이게 있어야 Autowired 됨
@RequiredArgsConstructor
public class OpenAiEmbedderImpl implements OpenAiEmbedder {

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper om = new ObjectMapper();

    @Value("${openai.api.key}")
    private String apiKey;

    @Override
    public float[] embed(String text) {

        try {
            String url = "https://api.openai.com/v1/embeddings";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            Map<String, Object> body = Map.of(
                    "model", "text-embedding-3-small",
                    "input", text
            );

            HttpEntity<Map<String, Object>> req = new HttpEntity<>(body, headers);

            ResponseEntity<String> res = restTemplate.postForEntity(url, req, String.class);

            if (!res.getStatusCode().is2xxSuccessful()) {
                throw new RuntimeException("OpenAI embedding failed: " + res.getStatusCode());
            }

            JsonNode root = om.readTree(res.getBody());
            JsonNode arr = root.get("data").get(0).get("embedding");

            float[] v = new float[arr.size()];
            for (int i = 0; i < arr.size(); i++) {
                v[i] = (float) arr.get(i).asDouble();
            }
            return v;

        } catch (Exception e) {
            throw new RuntimeException("Embedding error: " + e.getMessage(), e);
        }
    }
}
