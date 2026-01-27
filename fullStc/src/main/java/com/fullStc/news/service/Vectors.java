package com.fullStc.news.service;

public final class Vectors {
    private Vectors() {}

    public static double cosine(float[] a, float[] b) {
        if (a == null || b == null || a.length != b.length) return -1;
        double dot = 0, na = 0, nb = 0;
        for (int i = 0; i < a.length; i++) {
            dot += (double)a[i] * b[i];
            na += (double)a[i] * a[i];
            nb += (double)b[i] * b[i];
        }
        if (na == 0 || nb == 0) return -1;
        return dot / (Math.sqrt(na) * Math.sqrt(nb));
    }
}
