import React, { useState } from 'react';
import { format } from 'date-fns';
import EmojiPicker from 'emoji-picker-react';


const ChatMessage = ({ message, currentUser, onReaction }) => {
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    
    const isOwnMessage = message.username === currentUser?.username;
    
    // Format timestamp if it exists
    const formattedTime = message.timestamp 
        ? format(new Date(message.timestamp), 'HH:mm')
        : '';

    
    const handleEmojiSelect = (emojiData) => {
        onReaction(message.id, emojiData.emoji);
        setShowEmojiPicker(false);
    };


    return (
        <div className={`mb-4 flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[70%] ${isOwnMessage ? 'bg-blue-500 text-white' : 'bg-gray-100'} rounded-lg p-3`}>
                {/* Username */}
                <div className={`text-sm ${isOwnMessage ? 'text-blue-100' : 'text-gray-600'} mb-1`}>
                    {message.username}
                </div>
                
                {/* Message Content */}
                <div className="break-words text-black">
                    {message.message}
                </div>
                
                {/* Attachments if any */}
                {message.attachments?.map((attachment, index) => (
                    <div key={index} className="mt-2">
                        <a 
                            href={attachment.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-blue-400 hover:text-blue-600"
                        >
                            📎 {attachment.filename}
                        </a>
                    </div>
                ))}
                
                {/* Timestamp */}
                <div className={`text-xs ${isOwnMessage ? 'text-blue-100' : 'text-gray-500'} mt-1`}>
                    {formattedTime}
                </div>
                
                {/* Reactions */}
                <div className="flex flex-wrap gap-1 mt-2">
                    {message.reactions?.map((reaction, index) => (
                        <span 
                            key={index}
                            className="bg-gray-200 rounded-full px-2 py-1 text-xs"
                        >
                            {reaction.emoji} {reaction.count}
                        </span>
                    ))}
                </div>
                
                {/* Reaction Button */}
                <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className={`text-xs mt-2 ${
                        isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                    } hover:opacity-75`}
                >
                    Add Reaction
                </button>
                
                {/* Emoji Picker */}
                {showEmojiPicker && (
                    <div className="absolute bottom-full right-0 mb-2 z-50">
                        <div className="shadow-lg rounded-lg">
                            <EmojiPicker
                                onEmojiClick={handleEmojiSelect}
                                width={300}
                                height={400}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatMessage;