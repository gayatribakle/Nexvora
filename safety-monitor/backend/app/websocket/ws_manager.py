import json
import asyncio
from typing import Dict, Set, Any
from fastapi import WebSocket


class WebSocketManager:
    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {
            "monitoring": set(),
            "alerts": set(),
            "admin": set(),
        }

    async def connect(self, websocket: WebSocket, channel: str = "monitoring"):
        await websocket.accept()
        if channel not in self.active_connections:
            self.active_connections[channel] = set()
        self.active_connections[channel].add(websocket)

    def disconnect(self, websocket: WebSocket, channel: str = "monitoring"):
        if channel in self.active_connections:
            self.active_connections[channel].discard(websocket)

    async def broadcast(self, channel: str, message: Any):
        if channel not in self.active_connections:
            return
        dead_connections = set()
        for websocket in self.active_connections[channel]:
            try:
                data = json.dumps(message, default=str)
                await websocket.send_text(data)
            except Exception:
                dead_connections.add(websocket)

        for websocket in dead_connections:
            self.active_connections[channel].discard(websocket)

    async def broadcast_all(self, message: Any):
        for channel in self.active_connections:
            await self.broadcast(channel, message)

    async def send_personal(self, websocket: WebSocket, message: Any):
        try:
            data = json.dumps(message, default=str)
            await websocket.send_text(data)
        except Exception:
            pass


ws_manager = WebSocketManager()
