from pydantic import BaseModel
from typing import List, Optional


class ConversationMessage(BaseModel):
    """대화 메시지"""
    role: str  # "user" 또는 "assistant"
    content: str


class ChatRequest(BaseModel):
    """채팅 요청"""
    message: str
    conversation_history: Optional[List[ConversationMessage]] = None


class ChatResponse(BaseModel):
    """채팅 응답"""
    reply: str
