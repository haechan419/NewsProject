package com.fullStc.news.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Set;

@RestController
@RequestMapping("/api/images")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class ImageProxyController {

    private static final Logger log = LoggerFactory.getLogger(ImageProxyController.class);

    private static final int RETRIES = 2;
    private static final int MAX_BYTES = 10 * 1024 * 1024; // 10MB

    private static final String REAL_UA =
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

    private static final Set<String> ALLOWED_HOSTS = Set.of(
            "pollinations.ai",
            "www.pollinations.ai",
            "image.pollinations.ai"
    );

    /**
     * /api/images/pollinations?u=https%3A%2F%2Fimage.pollinations.ai%2Fprompt%2F....
     */
    @GetMapping("/pollinations")
    public ResponseEntity<Void> pollinations(
            @RequestParam(value = "u", required = false) String rawUrl,
            @RequestParam(value = "b64", required = false) String b64
    ) {
        String finalUrl;

        if (b64 != null && !b64.isBlank()) {
            finalUrl = new String(
                    java.util.Base64.getUrlDecoder().decode(b64),
                    java.nio.charset.StandardCharsets.UTF_8
            );
        } else if (rawUrl != null && !rawUrl.isBlank()) {
            finalUrl = rawUrl;
        } else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "missing url");
        }

        URI uri = URI.create(finalUrl);

        // ★ 핵심: 서버가 안 긁고, 브라우저에게 넘김
        return ResponseEntity.status(HttpStatus.FOUND) // 302
                .location(uri)
                .header(HttpHeaders.CACHE_CONTROL, "public, max-age=86400")
                .build();
    }

    // ✅ SSRF 방지: https + 허용 host만
    private URI validatePollinationsUrl(String rawUrl) {
        try {
            URI uri = URI.create(rawUrl);

            if (uri.getScheme() == null || !"https".equalsIgnoreCase(uri.getScheme())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "https only");
            }

            String host = uri.getHost();
            if (host == null || !ALLOWED_HOSTS.contains(host.toLowerCase())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "only pollinations hosts allowed");
            }

            return uri;
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "invalid url");
        }
    }

    private byte[] readAllWithLimit(InputStream in, int maxBytes) throws Exception {
        byte[] data = in.readNBytes(maxBytes + 1);
        if (data.length > maxBytes) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "image too large");
        }
        return data;
    }

    private boolean looksLikeHtml(byte[] body) {
        int n = Math.min(body.length, 300);
        String s = new String(body, 0, n, StandardCharsets.UTF_8).toLowerCase();
        return s.contains("<html") || s.contains("<!doctype html") || s.contains("<head") || s.contains("<body");
    }

    private MediaType sniffImageMediaType(byte[] b) {
        if (b == null || b.length < 12) return null;

        // PNG
        if ((b[0] & 0xFF) == 0x89 && b[1] == 0x50 && b[2] == 0x4E && b[3] == 0x47) {
            return MediaType.IMAGE_PNG;
        }
        // JPEG
        if ((b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8 && (b[2] & 0xFF) == 0xFF) {
            return MediaType.IMAGE_JPEG;
        }
        // WEBP: RIFF....WEBP
        if (b[0] == 'R' && b[1] == 'I' && b[2] == 'F' && b[3] == 'F'
                && b[8] == 'W' && b[9] == 'E' && b[10] == 'B' && b[11] == 'P') {
            return MediaType.valueOf("image/webp");
        }
        // GIF
        if (b[0] == 'G' && b[1] == 'I' && b[2] == 'F' && b[3] == '8') {
            return MediaType.IMAGE_GIF;
        }

        return null;
    }

    private ResponseEntity<byte[]> fallbackImage() {
        try (InputStream in = getClass().getResourceAsStream("/static/fallback.png")) {
            if (in == null) throw new RuntimeException("fallback not found");
            byte[] bytes = in.readAllBytes();
            return ResponseEntity.ok()
                    .contentType(MediaType.IMAGE_PNG)
                    .header(HttpHeaders.CACHE_CONTROL, "public, max-age=86400")
                    .body(bytes);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).build();
        }
    }
}
