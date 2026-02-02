package com.fullStc.drive.exception;

/**
 * 드라이브 모드 커스텀 예외
 */
public class DriveModeException extends RuntimeException {
    
    private final String errorCode;
    
    public DriveModeException(String message) {
        super(message);
        this.errorCode = "DRIVE_MODE_ERROR";
    }
    
    public DriveModeException(String message, String errorCode) {
        super(message);
        this.errorCode = errorCode;
    }
    
    public DriveModeException(String message, Throwable cause) {
        super(message, cause);
        this.errorCode = "DRIVE_MODE_ERROR";
    }
    
    public DriveModeException(String message, String errorCode, Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
    }
    
    public String getErrorCode() {
        return errorCode;
    }
}
