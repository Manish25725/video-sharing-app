import { io } from 'socket.io-client';

class SocketService {
    constructor() {
        this.socket = null;
        this.isConnected = false;
    }

    // Initialize socket connection
    connect(userId) {
        if (this.socket) {
            this.disconnect();
        }

        this.socket = io('http://localhost:8002', {
            withCredentials: true,
            transports: ['websocket', 'polling']
        });

        this.socket.on('connect', () => {
            console.log('Connected to server:', this.socket.id);
            this.isConnected = true;
            
            // Join user's notification room
            if (userId) {
                this.socket.emit('join-user', userId);
            }
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
            this.isConnected = false;
        });

        this.socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
        });

        return this.socket;
    }

    // Disconnect from socket
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
        }
    }

    // Join user notification room
    joinUserRoom(userId) {
        if (this.socket && this.isConnected) {
            this.socket.emit('join-user', userId);
        }
    }

    // Join video room for real-time interactions
    joinVideoRoom(videoId) {
        if (this.socket && this.isConnected) {
            this.socket.emit('join-video', videoId);
        }
    }

    // Listen for notifications
    onNotification(callback) {
        if (this.socket) {
            this.socket.on('notification', callback);
        }
    }

    // Remove notification listener
    offNotification(callback) {
        if (this.socket) {
            this.socket.off('notification', callback);
        }
    }

    // Listen for any custom event
    on(event, callback) {
        if (this.socket) {
            this.socket.on(event, callback);
        }
    }

    // Remove custom event listener
    off(event, callback) {
        if (this.socket) {
            this.socket.off(event, callback);
        }
    }

    // Emit custom event
    emit(event, data) {
        if (this.socket && this.isConnected) {
            this.socket.emit(event, data);
        }
    }

    // Get connection status
    getConnectionStatus() {
        return this.isConnected;
    }
}

// Create a singleton instance
const socketService = new SocketService();

export default socketService;