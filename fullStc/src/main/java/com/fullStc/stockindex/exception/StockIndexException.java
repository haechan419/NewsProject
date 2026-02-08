package com.fullStc.stockindex.exception;

/**
 * 주가지수 관련 예외
 */
public class StockIndexException extends RuntimeException {
    public StockIndexException(String message) {
        super(message);
    }

    public StockIndexException(String message, Throwable cause) {
        super(message, cause);
    }
}
