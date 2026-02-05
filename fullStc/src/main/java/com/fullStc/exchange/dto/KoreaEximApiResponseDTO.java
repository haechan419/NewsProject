package com.fullStc.exchange.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonAlias;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 한국수출입은행 API 응답 DTO
 * 대소문자 모두 지원
 * 알 수 없는 필드는 무시 (yy_efee_r, kftc_deal_bas_r 등)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class KoreaEximApiResponseDTO {
    /**
     * 결과 코드 (1: 성공)
     */
    @JsonProperty("RESULT")
    @JsonAlias("result")
    private Integer result;

    /**
     * 통화 코드
     */
    @JsonProperty("CUR_UNIT")
    @JsonAlias("cur_unit")
    private String curUnit;

    /**
     * 국가/통화명
     */
    @JsonProperty("CUR_NM")
    @JsonAlias("cur_nm")
    private String curNm;

    /**
     * 매매 기준율
     */
    @JsonProperty("DEAL_BAS_R")
    @JsonAlias("deal_bas_r")
    private String dealBasR;

    /**
     * 송금 받으실 때
     */
    @JsonProperty("TTB")
    @JsonAlias("ttb")
    private String ttb;

    /**
     * 송금 보내실 때
     */
    @JsonProperty("TTS")
    @JsonAlias("tts")
    private String tts;

    /**
     * 장부가격
     */
    @JsonProperty("BKPR")
    @JsonAlias("bkpr")
    private String bkpr;
}
