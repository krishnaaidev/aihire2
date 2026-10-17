import json
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, Set

logger = logging.getLogger(__name__)

router = APIRouter(tags=["WebSocket"])

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, Set[WebSocket]] = {}

    async def connect(self, interview_id: int, websocket: WebSocket):
        await websocket.accept()
        if interview_id not in self.active_connections:
            self.active_connections[interview_id] = set()
        self.active_connections[interview_id].add(websocket)

    def disconnect(self, interview_id: int, websocket: WebSocket):
        if interview_id in self.active_connections:
            self.active_connections[interview_id].discard(websocket)
            if not self.active_connections[interview_id]:
                del self.active_connections[interview_id]

    async def broadcast_to_interview(self, interview_id: int, message: dict):
        if interview_id in self.active_connections:
            for connection in list(self.active_connections[interview_id]):
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.warning(f"Error broadcasting to socket: {e}")

manager = ConnectionManager()

@router.websocket("/ws/interview/{interview_id}")
async def websocket_interview_endpoint(websocket: WebSocket, interview_id: int):
    await manager.connect(interview_id, websocket)
    try:
        # Send initial connection confirmation
        await websocket.send_json({
            "type": "connected",
            "interview_id": interview_id,
            "message": "Connected to real-time AI interview session"
        })
        
        while True:
            data = await websocket.receive_text()
            try:
                payload = json.loads(data)
                msg_type = payload.get("type", "message")

                if msg_type == "ping":
                    await websocket.send_json({"type": "pong"})
                elif msg_type == "candidate_speaking":
                    # Broadcast audio level or speech recognition progress
                    await manager.broadcast_to_interview(interview_id, {
                        "type": "candidate_speaking_status",
                        "status": payload.get("status", "speaking")
                    })
                elif msg_type == "candidate_transcript_delta":
                    await manager.broadcast_to_interview(interview_id, {
                        "type": "transcript_delta",
                        "text": payload.get("text", "")
                    })
                else:
                    await manager.broadcast_to_interview(interview_id, {
                        "type": "session_event",
                        "data": payload
                    })
            except json.JSONDecodeError:
                pass

    except WebSocketDisconnect:
        manager.disconnect(interview_id, websocket)
    except Exception as e:
        logger.error(f"WebSocket error in interview {interview_id}: {e}")
        manager.disconnect(interview_id, websocket)
