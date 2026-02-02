"""
드라이브 모드 설정 및 의존성 주입
"""

import os
from openai import OpenAI
from functools import lru_cache
from typing import Optional


class OpenAIConfig:
    """OpenAI 클라이언트 설정 클래스"""
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("OPENAI_API_KEY", "")
        self._client: Optional[OpenAI] = None
    
    @property
    def client(self) -> OpenAI:
        """OpenAI 클라이언트 싱글톤"""
        if self._client is None:
            if not self.api_key:
                raise ValueError("OPENAI_API_KEY가 설정되지 않았습니다.")
            self._client = OpenAI(api_key=self.api_key)
        return self._client
    
    def is_configured(self) -> bool:
        """API 키가 설정되어 있는지 확인"""
        return bool(self.api_key)


@lru_cache()
def get_openai_config() -> OpenAIConfig:
    """OpenAI 설정 싱글톤 (의존성 주입용)"""
    return OpenAIConfig()
