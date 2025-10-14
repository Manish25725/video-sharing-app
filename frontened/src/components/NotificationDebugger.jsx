import React, { useEffect, useState } from 'react';
import notificationService from '../services/notificationService';

const NotificationDebugger = () => {
    const [debugInfo, setDebugInfo] = useState({});

    useEffect(() => {
        const runTests = async () => {
            try {
                console.log('🔍 Running notification debug tests...');
                
                // Test unread count
                try {
                    const unreadResponse = await notificationService.getUnreadCount();
                    console.log('📊 Unread count response:', unreadResponse);
                    setDebugInfo(prev => ({ ...prev, unreadCount: unreadResponse }));
                } catch (error) {
                    console.error('❌ Unread count error:', error);
                    setDebugInfo(prev => ({ ...prev, unreadError: error.message }));
                }

                // Test get notifications
                try {
                    const notificationsResponse = await notificationService.getNotifications(1, 5);
                    console.log('📋 Notifications response:', notificationsResponse);
                    setDebugInfo(prev => ({ ...prev, notifications: notificationsResponse }));
                } catch (error) {
                    console.error('❌ Notifications error:', error);
                    setDebugInfo(prev => ({ ...prev, notificationsError: error.message }));
                }

            } catch (error) {
                console.error('❌ Debug test error:', error);
            }
        };

        runTests();
    }, []);

    return (
        <div style={{ 
            position: 'fixed', 
            top: '10px', 
            right: '10px', 
            background: 'white', 
            border: '1px solid #ccc', 
            padding: '10px', 
            zIndex: 9999,
            fontSize: '12px',
            maxWidth: '300px'
        }}>
            <h4>Notification Debug Info:</h4>
            <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
        </div>
    );
};

export default NotificationDebugger;