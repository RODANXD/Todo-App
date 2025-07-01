import React, { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import { Send, X, Users, Smile, Paperclip, MoreVertical, FileText, Download  } from "lucide-react";
import { useWebSocket } from "../hooks/ChatWebhook";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";

const ChatInterface = ({ projectId, currentUser, onClose }) => {
  const [chatRoomId, setChatRoomId] = useState(null);
  const [messages, setMessages] = useState([]);

  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [projectUsers, setProjectUsers] = useState([]);
  const [mentionSearch, setMentionSearch] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [messageback,setMessagesback] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  // Only create WebSocket connection when we have a chatRoomId
  const { socket, isConnected } = useWebSocket(
    chatRoomId ? `/ws/chat/1/` : null
  );


  
  // Fetch chat room ID when component mounts
  useEffect(() => {
    let isMounted = true;

    const fetchChatRoom = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`http://116.202.210.102:6969/api/project/${projectId}/chat-room/`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (isMounted) {
          setChatRoomId(data.room_id);
          setError(null);
        }
      } catch (error) {
        console.error('Error fetching chat room:', error);
        if (isMounted) {
          setError('Failed to connect to chat room');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    if (projectId) {
      fetchChatRoom();
    }

    return () => {
      isMounted = false;
    };
  }, [projectId]);

  useEffect(() => {
  const fetchMessages = async () => {
    if (!projectId) return;
    try {
      const response = await fetch(`http://116.202.210.102:6969/api/project/${projectId}/chat/messages/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      const data = await response.json();
      setMessagesback(data); 
      console.log("message data q", data)// Set initial messages from backend
    } catch (error) {
      console.error('Error fetching chat messages:', error);
    }
  };
  fetchMessages();
}, [projectId]);
  // Scroll to bottom function
  const scrollToBottom = useCallback(() => {
  const el = messagesEndRef.current;
  if (el && el.scrollIntoView) {
    el.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}, []);


  // Fetch project users for mentions
  useEffect(() => {
    const fetchProjectUsers = async () => {
      try {
        const response = await fetch(`http://116.202.210.102:6969/api/project/${projectId}/members/`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        });
        const data = await response.json();
        setProjectUsers(data);
      } catch (error) {
        console.error('Error fetching project users:', error);
      }
    };

    fetchProjectUsers();
  }, [projectId]);

  // Message handler
  useEffect(() => {
    if (!socket) return;
const handleMessage = (e) => {
  try {
    const data = JSON.parse(e.data);
    console.log("WebSocket message data:", data);
    console.log("Available fields:", Object.keys(data));
    
    // Check for file in different possible field names
    const fileData = data.file || data.attachment || data.attachments || data.file_data || data.media;
    console.log("File data found:", fileData);
    
    const normalized = {
      ...data,
      file: fileData && fileData.name && fileData.data ? fileData : null
    };
    
    setMessages(prevMessages => [...prevMessages, normalized]);
    console.log("Normalized message:", normalized);
    scrollToBottom();
  } catch (error) {
    console.error('Error handling message:', error);
    setError("Error receiving message. Please try again.");
  }
};

    socket.addEventListener('message', handleMessage);
    return () => socket.removeEventListener('message', handleMessage);
  }, [socket, scrollToBottom]);

  // Send message function
  const sendMessage = useCallback(async () => {
  if (!isConnected || !socket) {
    setError('Not connected. Please wait...');
    return;
  }

  let messageToSend = newMessage.trim();
  if (!messageToSend && selectedFile) {
    messageToSend = " "; 
  }

  if (!messageToSend && !selectedFile) return;

  try {
    let filedata = null;
    if (selectedFile) {
      filedata = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () =>
          resolve({
            name: selectedFile.name,
            type: selectedFile.type,
            data: reader.result.split(',')[1],
          });
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });
    }
    const messageData = {
      type: "message",
      message: messageToSend,
      username: currentUser,
      file: filedata,
    };

    socket.send(JSON.stringify(messageData));
    setSelectedFile(null);
    setNewMessage('');
    setError(null);
  } catch (error) {
    console.error('Error sending message:', error);
    setError('Failed to send message. Please try again.');
  }
}, [isConnected, socket, newMessage, currentUser, selectedFile]);

  // Handle message input with mentions
  const handleMessageInput = (e) => {
    const value = e.target.value;
    setNewMessage(value);

    const lastWord = value.split(' ').pop();
    if (lastWord?.startsWith('@')) {
      setMentionSearch(lastWord.slice(1));
      setShowMentions(true);
    } else {
      setShowMentions(false);
    }
  };

  console.log("messages :============ ", messages)

  const handleFileUpload = async (messageId) => {
  if (!selectedFile) return;
  const formData = new FormData();
  formData.append('file', selectedFile);
  try {
    await uploadChatAttachment(projectId, messageId, formData);
    setSelectedFile(null);
    // Optionally fetch messages again to show the attachment
  } catch (error) {
    console.error('File upload failed:', error);
  }
};
const handleFileChange = (e) => {
  setSelectedFile(e.target.files[0]);
};

  // Handle mention selection
  const handleMentionSelect = (username) => {
    const messageWords = newMessage.split(' ');
    messageWords[messageWords.length - 1] = `@${username}`;
    setNewMessage(messageWords.join(' ') + ' ');
    setShowMentions(false);
  };


  const fileInputRef = useRef();
  // Get user initials for avatar
  const getUserInitials = (username) => {
    return username.slice(0, 2).toUpperCase();
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    console.log("timestamp",timestamp)
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };
  

  if (isLoading) {
    return (
      <Card className="flex flex-col h-[600px] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="mt-4 text-muted-foreground">Connecting to chat...</p>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-[450px] max-xs:h-[550px] bg-background border-0 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Project Chat</h3>
          </div>
          <Badge variant={isConnected ? "default" : "destructive"} className="text-xs">
            {isConnected ? "Connected" : "Disconnected"}
          </Badge>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-destructive/10 border-b">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Messages Container */}
      <ScrollArea className="flex-1 p-4 overflow-y-auto h-[300px]">
        <div className="space-y-4">
          {/* Render messages */}
          {Array.isArray(messageback) && messageback.map((message, index) => (
            
            <div 
              key={index}
              className={`flex items-start space-x-3 ${
                                  message.username === currentUser ? 'flex-row-reverse space-x-reverse' : ''
              }`}
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {getUserInitials(message.username)}
                </AvatarFallback>
              </Avatar>
              
              <div className={`flex flex-col space-y-1 max-w-[70%] ${
                                  message.username === currentUser ? 'items-end' : 'items-start'
              }`}>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <span className="font-medium">{message.username}</span>
                  <span>{formatTime(message.timestamp)}</span>
                </div>

                <div className={`rounded-lg px-3 py-2 ${
                                  message.username === currentUser 
                                    ? 'bg-primary text-primary-foreground' 
                                    : 'bg-muted'
                }`}>
                  {message.content}
                  {/* {message.attachments && message.attachments.length > 0 && (
                    <div className="mt-2">
                      {message.attachments.map((attachment, idx) => (
                        <a 
                          key={idx}
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary"
                        >
                          {attachment.name}
                        </a>
                      ))}
                    </div>
                  )} */}
                </div>
              </div>
            </div>
          ))}
          

          {messages.map((message, index) => (
            <div 
              key={index}
              className={`flex items-start space-x-3 ${
                message.username === currentUser ? 'flex-row-reverse space-x-reverse' : ''
              }`}
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {getUserInitials(message.username)}
                </AvatarFallback>
              </Avatar>
              
              <div className={`flex flex-col space-y-1 max-w-[70%] ${
                message.username === currentUser ? 'items-end' : 'items-start'
              }`}>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <span className="font-medium">{message.username}</span>
                  <span>{formatTime(message.created_at)}</span>
                </div>
                
                <div className={`rounded-lg px-3 py-2 ${
  message.username === currentUser 
    ? 'bg-primary text-primary-foreground' 
    : 'bg-muted'
}`}>
  {message.message && (
    
    <div>
      <p className="text-sm break-words">{message.message}</p>
    </div>
  )}
  {message.file && message.file.name && message.file.data && (
    <div className="mt-2 p-2 bg-background/50 rounded border">
  <div className="flex items-center space-x-2">
    <FileText className="h-4 w-4" />
    <a
      href={`data:${message.file.type};base64,${message.file.data}`}
      download={message.file.name}
      className="text-sm text-primary underline text-black"
      target="_blank"
      rel="noopener noreferrer"
    >
      <span>{message.file.name}</span>
      <Download className="h-3 w-3" />
    </a>
  </div>
  </div>
)}
</div>
                
              </div>
              
            </div>
          ))}
          
          {isTyping && (
            <div className="flex items-center space-x-2 text-muted-foreground">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
              <span className="text-xs">Someone is typing...</span>
            </div>
          )}
        </div>
        <div ref={messagesEndRef} />
      </ScrollArea>

      {/* Mentions Dropdown */}
      {showMentions && (
        <div className="absolute bottom-20 left-4 right-4 bg-card border rounded-lg shadow-lg max-h-40 overflow-y-auto z-10">
          {projectUsers
  .filter(user => user.username && user.username.toLowerCase().includes(mentionSearch.toLowerCase()))
  .map(user => (
    <div
      key={user.id}
      className="flex items-center space-x-2 p-3 hover:bg-accent cursor-pointer"
      onClick={() => handleMentionSelect(user.username)}
    >
      <Avatar className="h-6 w-6">
        <AvatarFallback className="text-xs">
          {getUserInitials(user.username)}
        </AvatarFallback>
      </Avatar>
      <span className="text-sm">@{user.username}</span>
    </div>
  ))
}
        </div>
      )}

      <Separator />

      {/* Message Input */}
      <div className="p-4 bg-card">
        <div className="flex items-center space-x-2">
          <input
  type="file"
  onChange={handleFileChange}
  style={{ display: 'none' }}
  ref={fileInputRef}
/>
<Button
  type="button"
  variant="ghost"
  size="sm"
  className="shrink-0"
  onClick={() => fileInputRef.current.click()}
>
  <Paperclip className="h-4 w-4" />
  {selectedFile && (
    <div className="ml-2 flex items-center space-x-1">
    <span className="text-xs text-muted-foreground">{selectedFile.name}</span>
    </div>
    
  )}
  
</Button>
          
          <div className="flex-1 relative">
            <Input
              value={newMessage}
              onChange={handleMessageInput}
              onKeyDown={(e) => {
                if (e.key === 'Enter')
                  {
                    e.preventDefault();
                    sendMessage()}
                  }}
              placeholder="Type message..."
              className="pr-12 bg-background"
              disabled={!isConnected}
            />
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="absolute right-1 top-1 h-6 w-6 p-0"
              onClick={() => setShowEmojiPicker((prev) => !prev)}

            >
              <Smile className="h-4 w-4" />
            </Button>
            {showEmojiPicker && (
        <div className="absolute bottom-16 right-2 z-10">
          <Picker
            data={data}
            onEmojiSelect={(emoji) =>
              setNewMessage((prev) => prev + emoji.native)
            }
            theme="light"
          />
        </div>
      )}
          </div>
          
          <Button
  onClick={sendMessage}
  size="sm"
  disabled={!isConnected || (!newMessage.trim() && !selectedFile)}
  className="shrink-0"
>
  <Send className="h-4 w-4" />
</Button>
        </div>
        
        {!isConnected && (
          <p className="text-xs text-muted-foreground mt-2">
            Reconnecting to chat...
          </p>
        )}
      </div>
    </Card>
  );
};

export default ChatInterface;