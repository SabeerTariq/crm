import { useState, useEffect, useRef } from 'react';
import PageLayout from '../components/PageLayout';
import api from '../services/api';
import './Chat.css';

const Chat = () => {
  const [channels, setChannels] = useState([]);
  const [directMessages, setDirectMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [selectedDM, setSelectedDM] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messageInput, setMessageInput] = useState('');
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDescription, setNewChannelDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [viewMode, setViewMode] = useState('channels'); // 'channels' or 'direct'
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const [presence, setPresence] = useState('online');
  const [editingMessage, setEditingMessage] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(null);
  const [messageMenuOpen, setMessageMenuOpen] = useState(null);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  console.log('Current user from localStorage:', currentUser);

  // Common emojis for reactions
  const commonEmojis = ['👍', '❤️', '😂', '😮', '😢', '🙏', '👏', '🔥', '🎉', '✅', '❌', '⭐'];

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (messageMenuOpen && !event.target.closest('.message-actions-menu') && !event.target.closest('.message-menu-btn')) {
        setMessageMenuOpen(null);
      }
      if (showEmojiPicker && !event.target.closest('.emoji-picker') && !event.target.closest('.action-menu-item')) {
        setShowEmojiPicker(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [messageMenuOpen, showEmojiPicker]);

  useEffect(() => {
    loadChannels();
    loadDirectMessages();
    loadUsers();
    updatePresence('online');
  }, []);

  useEffect(() => {
    // Set up presence update interval
    const presenceInterval = setInterval(() => {
      updatePresence(presence);
    }, 30000); // Update every 30 seconds

    // Refresh users list to get updated statuses
    const usersInterval = setInterval(() => {
      loadUsers();
    }, 10000); // Refresh every 10 seconds

    // Cleanup
    return () => {
      clearInterval(presenceInterval);
      clearInterval(usersInterval);
    };
  }, [presence]);

  useEffect(() => {
    // Set offline when component unmounts
    return () => {
      // Use a flag to prevent calling updatePresence if component is already unmounting
      api.patch('/chat/users/presence', { status: 'offline' }).catch(() => {});
    };
  }, []);

  useEffect(() => {
    if (selectedChannel) {
      loadChannelMessages(selectedChannel.id);
      const interval = setInterval(() => {
        loadChannelMessages(selectedChannel.id);
      }, 2000); // Poll every 2 seconds
      return () => clearInterval(interval);
    } else if (selectedDM) {
      loadDMMessages(selectedDM.id);
      const interval = setInterval(() => {
        loadDMMessages(selectedDM.id);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [selectedChannel, selectedDM]);

  // Note: Messages are automatically marked as read when fetched in the backend
  // No need for separate frontend calls to avoid deadlocks

  // Track if user manually scrolled up
  const [userScrolledUp, setUserScrolledUp] = useState(false);
  const [hasScrolledOnLoad, setHasScrolledOnLoad] = useState(false);

  // Auto-scroll only when user is near bottom (within 150px) and new messages arrive
  useEffect(() => {
    const container = document.querySelector('.messages-container');
    if (!container) return;
    
    const scrollHeight = container.scrollHeight;
    const scrollTop = container.scrollTop;
    const clientHeight = container.clientHeight;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
    
    // Only auto-scroll if user is already near the bottom (hasn't manually scrolled up)
    // But don't scroll on initial load - that's handled separately
    if (isNearBottom && !userScrolledUp && hasScrolledOnLoad) {
      scrollToBottom();
    } else if (!isNearBottom) {
      // User has scrolled up
      setUserScrolledUp(true);
    }
  }, [messages, userScrolledUp, hasScrolledOnLoad]);

  // Reset flags and scroll to bottom when switching channels/DMs
  useEffect(() => {
    setUserScrolledUp(false);
    setHasScrolledOnLoad(false);
  }, [selectedChannel, selectedDM]);

  // Scroll to bottom once when messages are first loaded after selecting a channel/DM
  useEffect(() => {
    if (messages.length > 0 && !hasScrolledOnLoad && (selectedChannel || selectedDM)) {
      // Use a small delay to ensure DOM is updated
      setTimeout(() => {
        scrollToBottom();
        setHasScrolledOnLoad(true);
      }, 200);
    }
  }, [messages.length, selectedChannel, selectedDM, hasScrolledOnLoad]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChannels = async () => {
    try {
      const response = await api.get('/chat/channels');
      setChannels(response.data.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading channels:', error);
      setLoading(false);
    }
  };

  const loadDirectMessages = async () => {
    try {
      const response = await api.get('/chat/direct-messages');
      setDirectMessages(response.data.data || []);
    } catch (error) {
      console.error('Error loading direct messages:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await api.get('/chat/users');
      console.log('Users API response:', response.data);
      const usersData = response.data.data || response.data || [];
      console.log('Users loaded:', usersData.length, usersData);
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
      console.error('Error response:', error.response?.data);
      setUsers([]);
    }
  };

  const loadChannelMessages = async (channelId) => {
    try {
      const response = await api.get(`/chat/channels/${channelId}/messages?limit=100`);
      setMessages(response.data.data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const loadDMMessages = async (dmId) => {
    try {
      const response = await api.get(`/chat/direct-messages/${dmId}/messages?limit=100`);
      setMessages(response.data.data || []);
    } catch (error) {
      console.error('Error loading DM messages:', error);
    }
  };

  const updatePresence = async (status) => {
    try {
      await api.patch('/chat/users/presence', { status });
      setPresence(status);
      // Reload users to reflect status change
      loadUsers();
    } catch (error) {
      console.error('Error updating presence:', error);
    }
  };

  const handleCreateChannel = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/chat/channels', {
        name: newChannelName,
        description: newChannelDescription,
        is_private: isPrivate
      });
      await loadChannels();
      setShowCreateChannel(false);
      setNewChannelName('');
      setNewChannelDescription('');
      setIsPrivate(false);
      setSelectedChannel(response.data.data);
      setSelectedDM(null);
      setViewMode('channels');
    } catch (error) {
      console.error('Error creating channel:', error);
      alert(error.response?.data?.message || 'Failed to create channel');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() && !fileInputRef.current?.files[0]) return;

    const formData = new FormData();
    formData.append('content', messageInput);
    if (fileInputRef.current?.files[0]) {
      formData.append('file', fileInputRef.current.files[0]);
    }

    try {
      if (selectedChannel) {
        await api.post(`/chat/channels/${selectedChannel.id}/messages`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setMessageInput('');
        fileInputRef.current.value = '';
        loadChannelMessages(selectedChannel.id);
      } else if (selectedDM) {
        await api.post(`/chat/direct-messages/${selectedDM.id}/messages`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setMessageInput('');
        fileInputRef.current.value = '';
        loadDMMessages(selectedDM.id);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert(error.response?.data?.message || 'Failed to send message');
    }
  };

  const handleStartDM = async (userId) => {
    try {
      const response = await api.post('/chat/direct-messages', { user_id: userId });
      await loadDirectMessages();
      setSelectedDM(response.data.data);
      setSelectedChannel(null);
      setViewMode('direct');
    } catch (error) {
      console.error('Error starting DM:', error);
      alert(error.response?.data?.message || 'Failed to start conversation');
    }
  };

  const handleAddReaction = async (messageId, emoji) => {
    try {
      const isDm = selectedDM !== null;
      await api.post(`/chat/messages/${messageId}/reactions/toggle`, { 
        emoji,
        is_dm: isDm
      });
      if (selectedChannel) {
        loadChannelMessages(selectedChannel.id);
      } else if (selectedDM) {
        loadDMMessages(selectedDM.id);
      }
    } catch (error) {
      console.error('Error toggling reaction:', error);
    }
  };

  const handleEditMessage = async (messageId) => {
    if (!editContent.trim()) return;
    
    try {
      const isDm = selectedDM !== null;
      await api.put(`/chat/messages/${messageId}`, { 
        content: editContent,
        is_dm: isDm
      });
      setEditingMessage(null);
      setEditContent('');
      if (selectedChannel) {
        loadChannelMessages(selectedChannel.id);
      } else if (selectedDM) {
        loadDMMessages(selectedDM.id);
      }
    } catch (error) {
      console.error('Error editing message:', error);
      alert(error.response?.data?.message || 'Failed to edit message');
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    
    try {
      const isDm = selectedDM !== null;
      await api.delete(`/chat/messages/${messageId}?is_dm=${isDm}`);
      if (selectedChannel) {
        loadChannelMessages(selectedChannel.id);
      } else if (selectedDM) {
        loadDMMessages(selectedDM.id);
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      alert(error.response?.data?.message || 'Failed to delete message');
    }
  };

  const handlePinMessage = async (messageId) => {
    try {
      const channelId = selectedChannel?.id;
      const directMessageId = selectedDM?.id;
      
      if (!channelId && !directMessageId) return;
      
      await api.post(`/chat/messages/${messageId}/pin`, {
        channel_id: channelId || null,
        direct_message_id: directMessageId || null
      });
      
      if (selectedChannel) {
        loadChannelMessages(selectedChannel.id);
      } else if (selectedDM) {
        loadDMMessages(selectedDM.id);
      }
    } catch (error) {
      console.error('Error pinning message:', error);
      alert(error.response?.data?.message || 'Failed to pin message');
    }
  };

  const handleUnpinMessage = async (messageId) => {
    try {
      const channelId = selectedChannel?.id;
      const directMessageId = selectedDM?.id;
      
      if (!channelId && !directMessageId) return;
      
      await api.delete(`/chat/messages/${messageId}/pin?channel_id=${channelId || ''}&direct_message_id=${directMessageId || ''}`);
      
      if (selectedChannel) {
        loadChannelMessages(selectedChannel.id);
      } else if (selectedDM) {
        loadDMMessages(selectedDM.id);
      }
    } catch (error) {
      console.error('Error unpinning message:', error);
      alert(error.response?.data?.message || 'Failed to unpin message');
    }
  };

  const startEditing = (message) => {
    setEditingMessage(message.id);
    setEditContent(message.content);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString();
  };

  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId);
    return user?.name || 'Unknown';
  };

  const getOtherUser = (dm) => {
    if (dm.user1_id === currentUser.id) {
      const user = users.find(u => u.id === dm.user2_id);
      return { 
        id: dm.user2_id, 
        name: dm.other_user_name || user?.name || 'Unknown', 
        email: dm.other_user_email || user?.email,
        status: user?.status || 'offline'
      };
    }
    const user = users.find(u => u.id === dm.user1_id);
    return { 
      id: dm.user1_id, 
      name: dm.other_user_name || user?.name || 'Unknown', 
      email: dm.other_user_email || user?.email,
      status: user?.status || 'offline'
    };
  };

  const getUserStatus = (userId) => {
    const user = users.find(u => u.id === userId);
    return user?.status || 'offline';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online':
        return '#2eb886';
      case 'standby':
        return '#f59e0b';
      case 'offline':
      default:
        return '#9ca3af';
    }
  };

  const getMessageStatusIcon = (message) => {
    // For channel messages, check message_status
    // For DM messages, check recipient_status (for sender) or message_status (for recipient)
    const status = message.recipient_status || message.message_status || 'sent';
    
    switch (status) {
      case 'read':
        return '✓✓'; // Double check for read
      case 'delivered':
        return '✓✓'; // Double check for delivered (will be blue)
      case 'sent':
      default:
        return '✓'; // Single check for sent
    }
  };

  const getMessageStatusTooltip = (message) => {
    const status = message.recipient_status || message.message_status || 'sent';
    const deliveredAt = message.recipient_delivered_at || message.delivered_at;
    const readAt = message.recipient_read_at || message.read_at;
    
    let tooltip = `Message Status: ${status.charAt(0).toUpperCase() + status.slice(1)}`;
    tooltip += `\nSent: ${formatTime(message.created_at)}`;
    if (deliveredAt) {
      tooltip += `\nDelivered: ${formatTime(deliveredAt)}`;
    } else if (status === 'sent') {
      tooltip += `\nDelivered: Pending`;
    }
    if (readAt) {
      tooltip += `\nRead: ${formatTime(readAt)}`;
    } else if (status === 'delivered') {
      tooltip += `\nRead: Pending`;
    }
    return tooltip;
  };

  const getMessageStatusColor = (message) => {
    const status = message.recipient_status || message.message_status || 'sent';
    
    switch (status) {
      case 'read':
        return '#2eb886'; // Green for read
      case 'delivered':
        return '#3b82f6'; // Blue for delivered
      case 'sent':
      default:
        return '#9ca3af'; // Gray for sent
    }
  };

  return (
    <PageLayout>
      <div className="chat-container">
        {/* Sidebar */}
        <div className="chat-sidebar">
          <div className="chat-sidebar-header">
            <h2>Chat</h2>
            <div className="chat-tabs">
              <button
                className={viewMode === 'channels' ? 'active' : ''}
                onClick={() => {
                  setViewMode('channels');
                  setSelectedDM(null);
                }}
              >
                Channels
              </button>
              <button
                className={viewMode === 'direct' ? 'active' : ''}
                onClick={() => {
                  setViewMode('direct');
                  setSelectedChannel(null);
                }}
              >
                Direct
              </button>
            </div>
          </div>

          {viewMode === 'channels' ? (
            <div className="chat-sidebar-content">
              <button
                className="create-channel-btn"
                onClick={() => setShowCreateChannel(true)}
              >
                + Create Channel
              </button>
              <div className="channel-list">
                {channels.map(channel => (
                  <div
                    key={channel.id}
                    className={`channel-item ${selectedChannel?.id === channel.id ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedChannel(channel);
                      setSelectedDM(null);
                    }}
                  >
                    <span className="channel-icon">#</span>
                    <span className="channel-name">{channel.name}</span>
                    {channel.unread_count > 0 && (
                      <span className="unread-badge">{channel.unread_count}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="chat-sidebar-content">
              <div className="dm-list">
                {directMessages.map(dm => {
                  const otherUser = getOtherUser(dm);
                  return (
                    <div
                      key={dm.id}
                      className={`dm-item ${selectedDM?.id === dm.id ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedDM(dm);
                        setSelectedChannel(null);
                      }}
                    >
                    <div className={`dm-avatar ${otherUser.status === 'online' ? 'online' : otherUser.status === 'standby' ? 'standby' : ''}`}>
                      {otherUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="dm-info">
                      <div className="dm-name">{otherUser.name}</div>
                      <div 
                        className="dm-status" 
                        style={{ color: getStatusColor(otherUser.status || 'offline'), fontSize: '11px' }}
                      >
                        {otherUser.status || 'offline'}
                      </div>
                        {dm.last_message && (
                          <div className="dm-preview">{dm.last_message}</div>
                        )}
                      </div>
                      {dm.unread_count > 0 && (
                        <span className="unread-badge">{dm.unread_count}</span>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="user-list-section">
                <h3>Start a conversation</h3>
                {users.length === 0 ? (
                  <div className="no-users-message">
                    <p>No users found. Loading...</p>
                  </div>
                ) : (
                  <div className="user-list">
                    {users
                      .filter(u => {
                        const userId = typeof u.id === 'number' ? u.id : parseInt(u.id);
                        const currentUserId = typeof currentUser.id === 'number' ? currentUser.id : parseInt(currentUser.id);
                        return userId !== currentUserId;
                      })
                      .map(user => (
                        <div
                          key={user.id}
                          className="user-item"
                          onClick={() => handleStartDM(user.id)}
                        >
                          <div className={`user-avatar ${user.status === 'online' ? 'online' : user.status === 'standby' ? 'standby' : ''}`}>
                            {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                          </div>
                          <span className="user-name">{user.name || 'Unknown'}</span>
                          <span 
                            className="user-status" 
                            style={{ color: getStatusColor(user.status || 'offline') }}
                          >
                            {user.status || 'offline'}
                          </span>
                        </div>
                      ))}
                    {users.filter(u => {
                      const userId = typeof u.id === 'number' ? u.id : parseInt(u.id);
                      const currentUserId = typeof currentUser.id === 'number' ? currentUser.id : parseInt(currentUser.id);
                      return userId !== currentUserId;
                    }).length === 0 && (
                      <div className="no-users-message">
                        <p>No other users available</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Main Chat Area */}
        <div className="chat-main">
          {selectedChannel || selectedDM ? (
            <>
              <div className="chat-header">
                <div className="chat-header-info">
                  {selectedChannel ? (
                    <>
                      <span className="channel-icon">#</span>
                      <h3>{selectedChannel.name}</h3>
                      {selectedChannel.description && (
                        <span className="channel-description">{selectedChannel.description}</span>
                      )}
                    </>
                  ) : (
                    <>
                      <div className={`dm-avatar ${getOtherUser(selectedDM).status === 'online' ? 'online' : getOtherUser(selectedDM).status === 'standby' ? 'standby' : ''}`}>
                        {getOtherUser(selectedDM).name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3>{getOtherUser(selectedDM).name}</h3>
                        <span 
                          className="user-status-header" 
                          style={{ color: getStatusColor(getOtherUser(selectedDM).status) }}
                        >
                          {getOtherUser(selectedDM).status || 'offline'}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div 
                className="messages-container"
                onScroll={(e) => {
                  const container = e.target;
                  const scrollHeight = container.scrollHeight;
                  const scrollTop = container.scrollTop;
                  const clientHeight = container.clientHeight;
                  const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
                  
                  // If user scrolls back to bottom, reset the flag
                  if (isNearBottom) {
                    setUserScrolledUp(false);
                  }
                }}
              >
                {messages.map(message => (
                  <div 
                    key={message.id} 
                    className={`message-item ${(message.is_pinned == 1 || message.is_pinned === true) ? 'pinned' : ''} ${message.user_id === currentUser.id ? 'own-message' : ''}`}
                  >
                    {(message.is_pinned == 1 || message.is_pinned === true) ? (
                      <div className="pinned-indicator">
                        📌 Pinned
                      </div>
                    ) : null}
                    <div className={`message-avatar ${getUserStatus(message.user_id) === 'online' ? 'online' : getUserStatus(message.user_id) === 'standby' ? 'standby' : ''}`}>
                      {getUserName(message.user_id).charAt(0).toUpperCase()}
                    </div>
                    <div className="message-content">
                      <div className="message-header">
                        <span className="message-author">{getUserName(message.user_id)}</span>
                        <span 
                          className="message-status" 
                          style={{ color: getStatusColor(getUserStatus(message.user_id)) }}
                        >
                          {getUserStatus(message.user_id)}
                        </span>
                        <span className="message-time">{formatTime(message.created_at)}</span>
                        {message.is_edited ? (
                          <span className="message-edited">(edited)</span>
                        ) : null}
                        {/* Message Status Indicator */}
                        {message.user_id === currentUser.id && (
                          <span 
                            className="message-delivery-status" 
                            title={getMessageStatusTooltip(message)}
                            style={{ 
                              marginLeft: '8px',
                              color: getMessageStatusColor(message)
                            }}
                          >
                            {getMessageStatusIcon(message)}
                          </span>
                        )}
                        <button
                          className="message-menu-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMessageMenuOpen(messageMenuOpen === message.id ? null : message.id);
                            setShowEmojiPicker(null);
                          }}
                          title="More options"
                        >
                          <span className="menu-dots">⋯</span>
                        </button>
                      </div>
                      <div className="message-body">
                        {editingMessage === message.id ? (
                          <div className="edit-message-form">
                            <input
                              type="text"
                              className="edit-input"
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleEditMessage(message.id);
                                }
                                if (e.key === 'Escape') {
                                  setEditingMessage(null);
                                  setEditContent('');
                                }
                              }}
                              autoFocus
                            />
                            <div className="edit-actions">
                              <button
                                className="save-btn"
                                onClick={() => handleEditMessage(message.id)}
                              >
                                Save
                              </button>
                              <button
                                className="cancel-btn"
                                onClick={() => {
                                  setEditingMessage(null);
                                  setEditContent('');
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {message.is_deleted ? (
                              <p className="deleted-message">[Message deleted]</p>
                            ) : (
                              <>
                                {message.content ? <p>{message.content}</p> : null}
                                {message.attachments && message.attachments.length > 0 ? (
                                  <div className="message-attachments">
                                    {message.attachments.map(att => (
                                      <a
                                        key={att.id}
                                        href={att.file_path}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="attachment-link"
                                      >
                                        📎 {att.file_name}
                                      </a>
                                    ))}
                                  </div>
                                ) : null}
                              </>
                            )}
                          </>
                        )}
                      </div>
                      {message.reactions && Array.isArray(message.reactions) && message.reactions.length > 0 ? (
                        <div className="message-reactions">
                          {Object.entries(
                            message.reactions.reduce((acc, r) => {
                              if (r && r.emoji) {
                                if (!acc[r.emoji]) acc[r.emoji] = [];
                                acc[r.emoji].push(r);
                              }
                              return acc;
                            }, {})
                          ).map(([emoji, reactions]) => {
                            if (!emoji || reactions.length === 0) return null;
                            const hasUserReaction = reactions.some(r => r && r.user_id === currentUser.id);
                            return (
                              <button
                                key={emoji}
                                className={`reaction-btn ${hasUserReaction ? 'active' : ''}`}
                                onClick={() => handleAddReaction(message.id, emoji)}
                                title={reactions.map(r => r.user_name || 'Unknown').filter(Boolean).join(', ')}
                              >
                                {emoji} {reactions.length}
                              </button>
                            );
                          }).filter(Boolean)}
                        </div>
                      ) : null}
                      {messageMenuOpen === message.id && !editingMessage ? (
                        <div className="message-actions-menu">
                          <button
                            className="action-menu-item"
                            onClick={() => {
                              setShowEmojiPicker(message.id);
                              setMessageMenuOpen(null);
                            }}
                          >
                            <span className="action-icon">😀</span>
                            <span>Add reaction</span>
                          </button>
                          {message.user_id === currentUser.id && (
                            <>
                              <button
                                className="action-menu-item"
                                onClick={() => {
                                  startEditing(message);
                                  setMessageMenuOpen(null);
                                }}
                              >
                                <span className="action-icon">✏️</span>
                                <span>Edit message</span>
                              </button>
                              <button
                                className="action-menu-item delete-action"
                                onClick={() => {
                                  handleDeleteMessage(message.id);
                                  setMessageMenuOpen(null);
                                }}
                              >
                                <span className="action-icon">🗑️</span>
                                <span>Delete message</span>
                              </button>
                            </>
                          )}
                          {!(message.is_pinned == 1 || message.is_pinned === true) ? (
                            <button
                              className="action-menu-item"
                              onClick={() => {
                                handlePinMessage(message.id);
                                setMessageMenuOpen(null);
                              }}
                            >
                              <span className="action-icon">📌</span>
                              <span>Pin message</span>
                            </button>
                          ) : (
                            <button
                              className="action-menu-item"
                              onClick={() => {
                                handleUnpinMessage(message.id);
                                setMessageMenuOpen(null);
                              }}
                            >
                              <span className="action-icon">📌</span>
                              <span>Unpin message</span>
                            </button>
                          )}
                        </div>
                      ) : null}
                      {showEmojiPicker === message.id ? (
                        <div className="emoji-picker">
                          <div className="emoji-picker-header">
                            <span>Add reaction</span>
                            <button
                              className="emoji-picker-close"
                              onClick={() => setShowEmojiPicker(null)}
                            >
                              ×
                            </button>
                          </div>
                          <div className="emoji-grid">
                            {commonEmojis.map(emoji => (
                              <button
                                key={emoji}
                                className="emoji-option"
                                onClick={() => {
                                  handleAddReaction(message.id, emoji);
                                  setShowEmojiPicker(null);
                                }}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <form className="message-input-form" onSubmit={handleSendMessage}>
                <input
                  type="text"
                  className="message-input"
                  placeholder={`Message ${selectedChannel ? `#${selectedChannel.name}` : getOtherUser(selectedDM).name}`}
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                />
                <input
                  type="file"
                  ref={fileInputRef}
                  className="file-input"
                  style={{ display: 'none' }}
                  onChange={() => {}}
                />
                <button
                  type="button"
                  className="attach-btn"
                  onClick={() => fileInputRef.current?.click()}
                  title="Attach file"
                >
                  📎
                </button>
                <button type="submit" className="send-btn">
                  Send
                </button>
              </form>
            </>
          ) : (
            <div className="chat-empty">
              <div className="empty-state">
                <h2>Select a channel or start a conversation</h2>
                <p>Choose a channel from the sidebar or start a direct message with a team member</p>
              </div>
            </div>
          )}
        </div>

        {/* Create Channel Modal */}
        {showCreateChannel && (
          <div className="modal-overlay" onClick={() => setShowCreateChannel(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Create Channel</h3>
                <button
                  className="modal-close"
                  onClick={() => setShowCreateChannel(false)}
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleCreateChannel}>
                <div className="form-group">
                  <label>Channel Name</label>
                  <input
                    type="text"
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value)}
                    placeholder="e.g. general"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Description (optional)</label>
                  <textarea
                    value={newChannelDescription}
                    onChange={(e) => setNewChannelDescription(e.target.value)}
                    placeholder="What's this channel about?"
                    rows="3"
                  />
                </div>
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={isPrivate}
                      onChange={(e) => setIsPrivate(e.target.checked)}
                    />
                    Private channel (only invited members can access)
                  </label>
                </div>
                <div className="form-actions">
                  <button type="button" onClick={() => setShowCreateChannel(false)}>
                    Cancel
                  </button>
                  <button type="submit">Create</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default Chat;

