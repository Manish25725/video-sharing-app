// Simple script to check notification data
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './backened/.env' });

// Notification schema (simplified)
const notificationSchema = new mongoose.Schema({
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['video_upload', 'tweet_post', 'subscription'], required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

const Notification = mongoose.model('Notification', notificationSchema);

async function checkNotifications() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Count all notifications
        const totalCount = await Notification.countDocuments();
        console.log(`📊 Total notifications in database: ${totalCount}`);

        // Count unread notifications
        const unreadCount = await Notification.countDocuments({ isRead: false });
        console.log(`🔔 Unread notifications: ${unreadCount}`);

        // Get all notifications
        const notifications = await Notification.find().populate('recipient', 'userName').populate('sender', 'userName').sort({ createdAt: -1 });
        
        console.log('\n📋 All notifications:');
        notifications.forEach((notification, index) => {
            console.log(`${index + 1}. Type: ${notification.type}, Read: ${notification.isRead}`);
            console.log(`   Message: ${notification.message}`);
            console.log(`   Recipient: ${notification.recipient?.userName || 'Unknown'}`);
            console.log(`   Sender: ${notification.sender?.userName || 'Unknown'}`);
            console.log(`   Created: ${notification.createdAt}`);
            console.log('---');
        });

        // Clean up test notifications if needed
        if (process.argv.includes('--clean')) {
            console.log('\n🧹 Cleaning up all notifications...');
            const deleteResult = await Notification.deleteMany({});
            console.log(`✅ Deleted ${deleteResult.deletedCount} notifications`);
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Disconnected from MongoDB');
    }
}

checkNotifications();