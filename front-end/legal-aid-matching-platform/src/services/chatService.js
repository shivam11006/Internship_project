import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { apiClient } from './authService';

const WS_BASE_URL = 'http://localhost:8080';
const API_BASE_URL = 'http://localhost:8080/api';

class ChatService {
  constructor() {
    this.stompClient = null;
    this.isConnected = false;
    this.subscriptions = new Map(); // Map of matchId -> subscription
    this.messageHandlers = new Map(); // Map of matchId -> array of handlers
    this.typingHandlers = new Map(); // Map of matchId -> array of handlers
    this.errorHandlers = [];
    this.connectionHandlers = [];
    this.currentUser = null;
  }

  /**
   * Initialize WebSocket connection
   */
  connect() {
    if (this.isConnected && this.stompClient?.connected) {
      console.log('WebSocket already connected');
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      try {
        // Get current user
        const userStr = localStorage.getItem('user');
        if (!userStr) {
          reject(new Error('User not authenticated'));
          return;
        }
        this.currentUser = JSON.parse(userStr);

        // Get JWT token
        const token = localStorage.getItem('accessToken');
        if (!token) {
          reject(new Error('No access token found'));
          return;
        }

        // Create SockJS connection with token as query parameter
        // The backend WebSocketAuthInterceptor checks both Authorization header and token query param
        const wsUrl = `${WS_BASE_URL}/ws/sockjs?token=${encodeURIComponent(token)}`;
        const socket = new SockJS(wsUrl);
        
        // Create STOMP client
        this.stompClient = new Client({
          webSocketFactory: () => socket,
          connectHeaders: {
            Authorization: `Bearer ${token}`
          },
          reconnectDelay: 5000,
          heartbeatIncoming: 4000,
          heartbeatOutgoing: 4000,
          debug: (str) => {
            // Uncomment for debugging
            // console.log('STOMP:', str);
          },
          onConnect: (frame) => {
            console.log('WebSocket connected:', frame);
            this.isConnected = true;
            this.notifyConnectionHandlers(true);
            resolve();
          },
          onStompError: (frame) => {
            console.error('STOMP error:', frame);
            this.isConnected = false;
            this.notifyConnectionHandlers(false);
            reject(new Error(frame.headers['message'] || 'WebSocket connection error'));
          },
          onWebSocketClose: () => {
            console.log('WebSocket closed');
            this.isConnected = false;
            this.notifyConnectionHandlers(false);
            this.subscriptions.clear();
          },
          onWebSocketError: (error) => {
            console.error('WebSocket error:', error);
            this.isConnected = false;
            this.notifyConnectionHandlers(false);
            reject(error);
          }
        });

        // Activate the client
        this.stompClient.activate();

        // Subscribe to error queue
        setTimeout(() => {
          if (this.stompClient?.connected) {
            const errorSub = this.stompClient.subscribe('/user/queue/errors', (message) => {
              try {
                const error = JSON.parse(message.body);
                console.error('Chat error received:', error);
                this.notifyErrorHandlers(error);
              } catch (e) {
                console.error('Error parsing error message:', e);
              }
            });
            this.subscriptions.set('errors', errorSub);
          }
        }, 1000);

      } catch (error) {
        console.error('Error connecting WebSocket:', error);
        reject(error);
      }
    });
  }

  /**
   * Disconnect WebSocket
   */
  disconnect() {
    if (this.stompClient) {
      // Unsubscribe from all channels
      this.subscriptions.forEach((sub) => {
        sub.unsubscribe();
      });
      this.subscriptions.clear();
      this.messageHandlers.clear();
      this.typingHandlers.clear();

      // Deactivate client
      this.stompClient.deactivate();
      this.stompClient = null;
      this.isConnected = false;
      this.notifyConnectionHandlers(false);
      console.log('WebSocket disconnected');
    }
  }

  /**
   * Subscribe to messages for a specific match
   */
  subscribeToMatch(matchId) {
    if (!this.stompClient || !this.stompClient.connected) {
      console.error('WebSocket not connected');
      return;
    }

    // Check if already subscribed
    if (this.subscriptions.has(`messages-${matchId}`)) {
      console.log(`Already subscribed to match ${matchId}`);
      return;
    }

    try {
      // Subscribe to messages for this match
      // The backend sends to /user/{email}/queue/messages
      const userEmail = this.currentUser?.email;
      if (!userEmail) {
        console.error('User email not found');
        return;
      }

      const messageSub = this.stompClient.subscribe(
        `/user/queue/messages`,
        (message) => {
          try {
            const messageDto = JSON.parse(message.body);
            // Only process messages for this match
            if (messageDto.matchId === matchId) {
              this.notifyMessageHandlers(matchId, messageDto);
            }
          } catch (e) {
            console.error('Error parsing message:', e);
          }
        }
      );

      // Subscribe to typing indicators
      const typingSub = this.stompClient.subscribe(
        `/user/queue/typing`,
        (message) => {
          try {
            const indicator = JSON.parse(message.body);
            if (indicator.matchId === matchId) {
              this.notifyTypingHandlers(matchId, indicator);
            }
          } catch (e) {
            console.error('Error parsing typing indicator:', e);
          }
        }
      );

      this.subscriptions.set(`messages-${matchId}`, messageSub);
      this.subscriptions.set(`typing-${matchId}`, typingSub);
      console.log(`Subscribed to match ${matchId}`);
    } catch (error) {
      console.error(`Error subscribing to match ${matchId}:`, error);
    }
  }

  /**
   * Unsubscribe from a match
   */
  unsubscribeFromMatch(matchId) {
    const messageSub = this.subscriptions.get(`messages-${matchId}`);
    const typingSub = this.subscriptions.get(`typing-${matchId}`);

    if (messageSub) {
      messageSub.unsubscribe();
      this.subscriptions.delete(`messages-${matchId}`);
    }

    if (typingSub) {
      typingSub.unsubscribe();
      this.subscriptions.delete(`typing-${matchId}`);
    }

    this.messageHandlers.delete(matchId);
    this.typingHandlers.delete(matchId);
  }

  /**
   * Send a message
   */
  sendMessage(matchId, content, messageType = 'TEXT') {
    if (!this.stompClient || !this.stompClient.connected) {
      console.error('WebSocket not connected');
      return Promise.reject(new Error('WebSocket not connected'));
    }

    return new Promise((resolve, reject) => {
      try {
        const message = {
          matchId: matchId,
          content: content,
          messageType: messageType
        };

        this.stompClient.publish({
          destination: '/app/chat.send',
          body: JSON.stringify(message)
        });

        resolve();
      } catch (error) {
        console.error('Error sending message:', error);
        reject(error);
      }
    });
  }

  /**
   * Send typing indicator
   */
  sendTypingIndicator(matchId, isTyping) {
    if (!this.stompClient || !this.stompClient.connected) {
      return;
    }

    try {
      const indicator = {
        matchId: matchId,
        isTyping: isTyping
      };

      this.stompClient.publish({
        destination: '/app/chat.typing',
        body: JSON.stringify(indicator)
      });
    } catch (error) {
      console.error('Error sending typing indicator:', error);
    }
  }

  /**
   * Register message handler for a match
   */
  onMessage(matchId, handler) {
    if (!this.messageHandlers.has(matchId)) {
      this.messageHandlers.set(matchId, []);
    }
    this.messageHandlers.get(matchId).push(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.messageHandlers.get(matchId);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  /**
   * Register typing indicator handler for a match
   */
  onTyping(matchId, handler) {
    if (!this.typingHandlers.has(matchId)) {
      this.typingHandlers.set(matchId, []);
    }
    this.typingHandlers.get(matchId).push(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.typingHandlers.get(matchId);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  /**
   * Register error handler
   */
  onError(handler) {
    this.errorHandlers.push(handler);
    return () => {
      const index = this.errorHandlers.indexOf(handler);
      if (index > -1) {
        this.errorHandlers.splice(index, 1);
      }
    };
  }

  /**
   * Register connection status handler
   */
  onConnectionChange(handler) {
    this.connectionHandlers.push(handler);
    return () => {
      const index = this.connectionHandlers.indexOf(handler);
      if (index > -1) {
        this.connectionHandlers.splice(index, 1);
      }
    };
  }

  /**
   * Notify message handlers
   */
  notifyMessageHandlers(matchId, message) {
    const handlers = this.messageHandlers.get(matchId);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(message);
        } catch (e) {
          console.error('Error in message handler:', e);
        }
      });
    }
  }

  /**
   * Notify typing handlers
   */
  notifyTypingHandlers(matchId, indicator) {
    const handlers = this.typingHandlers.get(matchId);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(indicator);
        } catch (e) {
          console.error('Error in typing handler:', e);
        }
      });
    }
  }

  /**
   * Notify error handlers
   */
  notifyErrorHandlers(error) {
    this.errorHandlers.forEach(handler => {
      try {
        handler(error);
      } catch (e) {
        console.error('Error in error handler:', e);
      }
    });
  }

  /**
   * Notify connection handlers
   */
  notifyConnectionHandlers(connected) {
    this.connectionHandlers.forEach(handler => {
      try {
        handler(connected);
      } catch (e) {
        console.error('Error in connection handler:', e);
      }
    });
  }

  // ==================== REST API Methods ====================

  /**
   * Get all conversations
   */
  async getConversations() {
    try {
      console.log('Fetching conversations from API...');
      const response = await apiClient.get('/chats');
      console.log('Conversations API response:', response.data);
      
      // Ensure we have a valid response structure
      if (response.data) {
        const data = response.data;
        // Normalize the response - ensure conversations array exists
        if (!data.conversations) {
          console.warn('Response missing conversations array, initializing empty array');
          data.conversations = [];
        }
        console.log(`Found ${data.conversations.length} conversations`);
        return { success: true, data: data };
      }
      
      return { success: true, data: { conversations: [], totalConversations: 0, totalUnreadMessages: 0 } };
    } catch (error) {
      console.error('Error fetching conversations:', error);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch conversations',
        data: { conversations: [], totalConversations: 0, totalUnreadMessages: 0 }
      };
    }
  }

  /**
   * Get chat history for a match
   */
  async getChatHistory(matchId, page = 0, size = 50) {
    try {
      const response = await apiClient.get(`/chats/${matchId}/messages`, {
        params: { page, size }
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error fetching chat history:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch chat history'
      };
    }
  }

  /**
   * Mark messages as read
   */
  async markAsRead(matchId) {
    try {
      const response = await apiClient.put(`/chats/${matchId}/read`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error marking messages as read:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to mark messages as read'
      };
    }
  }

  /**
   * Get unread count for a match
   */
  async getUnreadCount(matchId) {
    try {
      const response = await apiClient.get(`/chats/${matchId}/unread`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch unread count'
      };
    }
  }

  /**
   * Get total unread count
   */
  async getTotalUnreadCount() {
    try {
      const response = await apiClient.get('/chats/unread/total');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error fetching total unread count:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch total unread count'
      };
    }
  }
}

// Export singleton instance
const chatService = new ChatService();
export default chatService;
