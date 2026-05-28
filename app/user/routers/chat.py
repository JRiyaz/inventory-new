from typing import Dict, List, Optional

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect, status

from ..utils.security import decode_access_token

router = APIRouter(prefix="/chat", tags=["Support Chat"])


class ConnectionManager:
    """
    Manages active WebSocket connections for support chat.
    Routes messages dynamically between customers and staff.
    """

    def __init__(self) -> None:
        self.active_connections: List[WebSocket] = []
        self.user_to_sockets: Dict[str, List[WebSocket]] = {}
        self.role_to_sockets: Dict[str, List[WebSocket]] = {"Admin": [], "Agent": [], "Customer": []}

    async def connect(self, websocket: WebSocket, username: str, role: str) -> None:
        await websocket.accept()
        self.active_connections.append(websocket)

        if username not in self.user_to_sockets:
            self.user_to_sockets[username] = []
        self.user_to_sockets[username].append(websocket)

        normalized_role = "Admin" if role == "Admin" else ("Agent" if role == "Agent" else "Customer")
        self.role_to_sockets[normalized_role].append(websocket)

    def disconnect(self, websocket: WebSocket, username: str, role: str) -> None:
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

        if username in self.user_to_sockets and websocket in self.user_to_sockets[username]:
            self.user_to_sockets[username].remove(websocket)
            if not self.user_to_sockets[username]:
                del self.user_to_sockets[username]

        normalized_role = "Admin" if role == "Admin" else ("Agent" if role == "Agent" else "Customer")
        if websocket in self.role_to_sockets[normalized_role]:
            self.role_to_sockets[normalized_role].remove(websocket)

    async def send_personal_message(self, message: dict, websocket: WebSocket) -> None:
        await websocket.send_json(message)

    async def broadcast_to_role(self, message: dict, role: str) -> None:
        for socket in self.role_to_sockets.get(role, []):
            try:
                await socket.send_json(message)
            except Exception:
                pass

    async def broadcast_to_user(self, message: dict, username: str) -> None:
        for socket in self.user_to_sockets.get(username, []):
            try:
                await socket.send_json(message)
            except Exception:
                pass


manager = ConnectionManager()


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: Optional[str] = Query(None)):
    """
    WebSocket endpoint for support chat.
    Validates the user's active session token before allowing connections.
    """
    session_token = websocket.cookies.get("session_token")
    active_token = session_token or token

    if not active_token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Authentication token missing")
        return

    payload = decode_access_token(active_token)
    if not payload:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Invalid authentication token")
        return

    username: str = payload.get("sub", "")
    role: str = payload.get("role", "Customer")

    if not username:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Invalid user payload")
        return

    await manager.connect(websocket, username, role)

    # Broadcast join alert to admin/agents
    if role == "Customer":
        await manager.broadcast_to_role(
            {
                "type": "system",
                "text": f"Customer '{username}' has joined the support chat.",
                "senderName": "System",
                "timestamp": None,
            },
            "Admin",
        )
        await manager.broadcast_to_role(
            {
                "type": "system",
                "text": f"Customer '{username}' has joined the support chat.",
                "senderName": "System",
                "timestamp": None,
            },
            "Agent",
        )

    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type", "message")

            if msg_type == "message":
                text = data.get("text", "")
                sender_name = data.get("senderName", username)
                msg_role = "customer" if role == "Customer" else "employee"

                outbound_message = {
                    "type": "message",
                    "senderId": username,
                    "senderName": sender_name,
                    "text": text,
                    "role": msg_role,
                    "timestamp": data.get("timestamp"),
                }

                if role == "Customer":
                    await manager.broadcast_to_role(outbound_message, "Admin")
                    await manager.broadcast_to_role(outbound_message, "Agent")
                    await manager.broadcast_to_user(outbound_message, username)
                else:
                    target = data.get("targetUser")
                    if target:
                        await manager.broadcast_to_user(outbound_message, target)
                        await manager.broadcast_to_user(outbound_message, username)
                    else:
                        for r in ["Customer", "Admin", "Agent"]:
                            await manager.broadcast_to_role(outbound_message, r)

            elif msg_type == "typing":
                is_typing = data.get("isTyping", False)
                typing_notification = {
                    "type": "typing",
                    "username": username,
                    "role": "customer" if role == "Customer" else "employee",
                    "isTyping": is_typing,
                }
                if role == "Customer":
                    await manager.broadcast_to_role(typing_notification, "Admin")
                    await manager.broadcast_to_role(typing_notification, "Agent")
                else:
                    target = data.get("targetUser")
                    if target:
                        await manager.broadcast_to_user(typing_notification, target)
                    else:
                        await manager.broadcast_to_role(typing_notification, "Customer")

    except WebSocketDisconnect:
        manager.disconnect(websocket, username, role)
        if role == "Customer":
            leave_alert = {
                "type": "system",
                "text": f"Customer '{username}' has left the support session.",
                "senderName": "System",
                "timestamp": None,
            }
            await manager.broadcast_to_role(leave_alert, "Admin")
            await manager.broadcast_to_role(leave_alert, "Agent")
