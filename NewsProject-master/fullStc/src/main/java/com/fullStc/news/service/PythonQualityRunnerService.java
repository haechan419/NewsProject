package com.fullStc.news.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PythonQualityRunnerService {

    private final ObjectMapper om = new ObjectMapper();

    // ✅ 기본값을 venv python으로!
    @Value("${python.bin:./.venv/Scripts/python.exe}")
    private String pythonBin;

    @Value("${python.script:./ai/quality_check.py}")
    private String scriptPath;

    /**
     * input: List<Map> (기사들)
     * output: List<Map> (quality_check.py 결과)
     */
    public List<Map<String, Object>> runQualityCheck(List<Map<String, Object>> payload) {
        try {
            String jsonInput = om.writeValueAsString(payload);

            File projectRoot = new File(System.getProperty("user.dir"));
            File py = resolve(projectRoot, pythonBin);
            File script = resolve(projectRoot, scriptPath);

            // ✅ 존재/경로 로그 (문제 99% 여기서 잡힘)
            System.out.println("[QUALITY] user.dir=" + projectRoot.getAbsolutePath());
            System.out.println("[QUALITY] python=" + py.getAbsolutePath() + " exists=" + py.exists());
            System.out.println("[QUALITY] script=" + script.getAbsolutePath() + " exists=" + script.exists());

            if (!py.exists()) throw new FileNotFoundException("python not found: " + py.getAbsolutePath());
            if (!script.exists()) throw new FileNotFoundException("script not found: " + script.getAbsolutePath());



            ProcessBuilder pb = new ProcessBuilder(py.getAbsolutePath(), script.getAbsolutePath());
            pb.directory(projectRoot);
            pb.redirectErrorStream(true);

            pb.environment().put("PYTHONUTF8", "1");
            pb.environment().put("PYTHONIOENCODING", "utf-8");

            Process p = pb.start();



            // stdin
            try (BufferedWriter w = new BufferedWriter(new OutputStreamWriter(p.getOutputStream(), StandardCharsets.UTF_8))) {
                w.write(jsonInput);
            }

            // stdout
            String out;
            try (BufferedReader r = new BufferedReader(new InputStreamReader(p.getInputStream(), StandardCharsets.UTF_8))) {
                out = r.lines().collect(Collectors.joining("\n"));
            }

            int exit = p.waitFor();
            if (exit != 0) {
                throw new RuntimeException("python exit=" + exit + " output=" + out);
            }

            // 👇 여기
            System.out.println("🔥 PYTHON RAW OUT = " + out);

            // 결과가 list든 object든 대응
            Object parsed = om.readValue(out, Object.class);
            if (parsed instanceof List<?> list) {
                //noinspection unchecked
                return (List<Map<String, Object>>) list;
            }
            //noinspection unchecked
            return List.of((Map<String, Object>) parsed);

        } catch (Exception e) {
            throw new RuntimeException("PythonQualityRunner failed: " + e.getMessage(), e);
        }
    }

    private File resolve(File root, String path) {
        // 절대경로면 그대로, 상대면 user.dir 기준으로 결합
        File f = new File(path);
        return f.isAbsolute() ? f : new File(root, path);
    }
}
