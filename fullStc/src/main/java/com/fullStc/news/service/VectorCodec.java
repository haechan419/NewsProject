package com.fullStc.news.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class VectorCodec {
    private final com.fasterxml.jackson.databind.ObjectMapper om = new com.fasterxml.jackson.databind.ObjectMapper();

    public float[] fromJson(String json) {
        try {
            List<Double> list = om.readValue(json, om.getTypeFactory().constructCollectionType(List.class, Double.class));
            float[] v = new float[list.size()];
            for (int i = 0; i < list.size(); i++) v[i] = list.get(i).floatValue();
            return v;
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid embedding json", e);
        }
    }

    public String toJson(float[] v) {
        try {
            double[] d = new double[v.length];
            for (int i = 0; i < v.length; i++) d[i] = v[i];
            return om.writeValueAsString(d);
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}

