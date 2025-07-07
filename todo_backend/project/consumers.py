import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import ChatRoom, ChatMessage, ChatAttachment, ChatNotification, ChatReaction
from django.contrib.auth import get_user_model
import re
from .models import Project

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        try:
            self.room_id = self.scope['url_route']['kwargs']['room_id']
            self.room_group_name = f'chat_{self.room_id}'
            
            # Verify token
            query_string = self.scope.get('query_string', b'').decode('utf-8')
            token = dict(pair.split('=') for pair in query_string.split('&') if pair).get('token')

            if not token:
                await self.close()
                return

            # Ensure chat room exists
            chat_room = await self.getchatroom()
            if not chat_room:
                await self.close()
                return
            
            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )

            await self.accept()
        except Exception as e:
            print(f"Connection error: {e}")
            await self.close()

    @database_sync_to_async
    def getchatroom(self):
        try:
            if str(self.room_id) == '0':
                room, create = ChatRoom.objects.get_or_create(id=0, defaults={"name": "Global Chat"})
            return ChatRoom.objects.get(id=self.room_id)
        except ChatRoom.DoesNotExist:
            try:
                project = Project.objects.get(id=self.room_id)
                return ChatRoom.objects.create(
                    project=project,
                    name=f"Chat - {project.name}"
                )
            except Project.DoesNotExist:
                return None

    async def disconnect(self, close_code):
        try:
        # Leave room group
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )
        except Exception as e:
            print(f"Disconnection error: {e}")
            

    # Receive message from WebSocket
    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
        except Exception as e:
            print(f"JSON decode error: {e}, data: {text_data}")
            await self.send(text_data=json.dumps({"error": "Invalid message format"}))
            return
        if not all(key in data for key in ['type', 'message', 'username']):
                await self.send(text_data=json.dumps({
                    "error": "Missing required fields. Message must contain 'type', 'message', and 'username'"
                }))
                return
        message = data['message']
        username = data['username']
        message_type = data.get('type', 'message')
        file_data = data.get('file')
        
        if message_type == 'message':
            msg = await self.save_msg(username, message)
            if not msg:
                await self.send(text_data=json.dumps({
                    "error": f"Invalid sender username: {username}"
                }))
                return

        
        # Send message to room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message,
                'username': username,
                'message_type': message_type,
                'file': file_data
            }
        )

    # Receive message from room group
    async def chat_message(self, event):
        await self.send(text_data= json.dumps(event))
        
    
    @database_sync_to_async
    def save_msg(self, username, message):
        try:
            user = get_user_model().objects.get(username=username)
        except get_user_model().DoesNotExist:
            print(f"[ERROR] Sender user '{username}' not found")
            return None

        chat_room = ChatRoom.objects.get(id=self.room_id)
        msg = ChatMessage.objects.create(author=user, room=chat_room, content=message)
        self.process_mentions(msg)
        return msg

    
    def process_mentions(self, message):
        mention_pattern = r'@(\w+)'  # or use stricter regex
        mentions = re.findall(mention_pattern, message.content)
        for username in mentions:
            try:
                user = get_user_model().objects.get(username=username)
                ChatNotification.objects.create(user=user, message=message)
                ChatNotification.objects.create(
                    recipient=message.author,
                    sender=message.author,
                    message=message,
                    notification_type='mention'
                )
            except get_user_model().DoesNotExist:
                print(f"[WARN] Mentioned user '{username}' not found.")
                continue
            except Exception as e:
                print(f"[ERROR] While processing mention: {e}")
                continue
