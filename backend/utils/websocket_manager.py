from fastapi import WebSocket
from typing import Dict, List
import json
import logging

logger = logging.getLogger(__name__)

class WebSocketManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.admin_connections: Dict[str, WebSocket] = {}
        
    async def connect(self, websocket: WebSocket, session_id: str):
        """เชื่อมต่อ WebSocket สำหรับ session"""
        await websocket.accept()
        
        # Check if this is an admin connection
        if session_id.startswith("admin_candidate_"):
            self.admin_connections[session_id] = websocket
            logger.info(f"Admin WebSocket connected: {session_id}")
        else:
            self.active_connections[session_id] = websocket
            logger.info(f"Exam WebSocket connected: {session_id}")
        
    def disconnect(self, session_id: str):
        """ตัดการเชื่อมต่อ WebSocket"""
        if session_id in self.active_connections:
            del self.active_connections[session_id]
            logger.info(f"Exam WebSocket disconnected: {session_id}")
        elif session_id in self.admin_connections:
            del self.admin_connections[session_id]
            logger.info(f"Admin WebSocket disconnected: {session_id}")
            
    async def send_personal_message(self, session_id: str, message: dict):
        """ส่งข้อความไปยัง session เฉพาะ"""
        connection = None
        
        # Check admin connections first
        if session_id in self.admin_connections:
            connection = self.admin_connections[session_id]
        elif session_id in self.active_connections:
            connection = self.active_connections[session_id]
            
        if connection:
            try:
                await connection.send_text(json.dumps(message, ensure_ascii=False))
                logger.debug(f"Message sent to {session_id}: {message.get('type', 'unknown')}")
            except Exception as e:
                logger.error(f"Error sending message to {session_id}: {str(e)}")
                self.disconnect(session_id)
        else:
            logger.warning(f"No active connection found for {session_id}")
                
    async def broadcast_to_admins(self, message: dict):
        """ส่งข้อความไปยังทุก admin connection"""
        disconnected_sessions = []
        for session_id, connection in self.admin_connections.items():
            try:
                await connection.send_text(json.dumps(message, ensure_ascii=False))
            except Exception as e:
                logger.error(f"Error broadcasting to admin {session_id}: {str(e)}")
                disconnected_sessions.append(session_id)
                
        # ลบ connections ที่มีปัญหา
        for session_id in disconnected_sessions:
            self.disconnect(session_id)
                
    async def broadcast(self, message: dict):
        """ส่งข้อความไปยังทุก session ที่เชื่อมต่ออยู่"""
        disconnected_sessions = []
        for session_id, connection in self.active_connections.items():
            try:
                await connection.send_text(json.dumps(message, ensure_ascii=False))
            except Exception as e:
                logger.error(f"Error broadcasting to {session_id}: {str(e)}")
                disconnected_sessions.append(session_id)
                
        # ลบ connections ที่มีปัญหา
        for session_id in disconnected_sessions:
            self.disconnect(session_id)
    
    def get_connection_count(self) -> Dict[str, int]:
        """Get connection statistics"""
        return {
            "exam_connections": len(self.active_connections),
            "admin_connections": len(self.admin_connections),
            "total_connections": len(self.active_connections) + len(self.admin_connections)
        }

# Global instance
websocket_manager = WebSocketManager() 