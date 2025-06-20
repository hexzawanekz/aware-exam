from fastapi import WebSocket
from typing import Dict, List
import json
import logging

logger = logging.getLogger(__name__)

class WebSocketManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        
    async def connect(self, websocket: WebSocket, session_id: str):
        """เชื่อมต่อ WebSocket สำหรับ session"""
        await websocket.accept()
        self.active_connections[session_id] = websocket
        logger.info(f"WebSocket connected for session: {session_id}")
        
    def disconnect(self, session_id: str):
        """ตัดการเชื่อมต่อ WebSocket"""
        if session_id in self.active_connections:
            del self.active_connections[session_id]
            logger.info(f"WebSocket disconnected for session: {session_id}")
            
    async def send_personal_message(self, session_id: str, message: dict):
        """ส่งข้อความไปยัง session เฉพาะ"""
        if session_id in self.active_connections:
            try:
                await self.active_connections[session_id].send_text(json.dumps(message))
            except Exception as e:
                logger.error(f"Error sending message to {session_id}: {str(e)}")
                self.disconnect(session_id)
                
    async def broadcast(self, message: dict):
        """ส่งข้อความไปยังทุก session ที่เชื่อมต่ออยู่"""
        disconnected_sessions = []
        for session_id, connection in self.active_connections.items():
            try:
                await connection.send_text(json.dumps(message))
            except Exception as e:
                logger.error(f"Error broadcasting to {session_id}: {str(e)}")
                disconnected_sessions.append(session_id)
                
        # ลบ connections ที่มีปัญหา
        for session_id in disconnected_sessions:
            self.disconnect(session_id) 