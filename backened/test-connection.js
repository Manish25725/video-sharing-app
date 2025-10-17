import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const testConnection = async () => {
    try {
        console.log('Testing MongoDB connection...');
        console.log('MongoDB URI:', process.env.MONGODB_URI);
        
        // Test connection with timeout
        const connection = await mongoose.connect(`${process.env.MONGODB_URI}/vediotube`, {
            serverSelectionTimeoutMS: 10000, // 10 seconds timeout
            socketTimeoutMS: 45000, // 45 seconds
            maxPoolSize: 10,
            retryWrites: true,
            w: 'majority'
        });
        
        console.log('✅ MongoDB connection successful!');
        console.log('Connected to:', connection.connection.host);
        
        // Test a simple operation
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('Available collections:', collections.map(c => c.name));
        
        await mongoose.disconnect();
        console.log('Connection closed successfully');
        
    } catch (error) {
        console.error('❌ MongoDB connection failed:');
        console.error('Error type:', error.constructor.name);
        console.error('Error message:', error.message);
        
        if (error.message.includes('ENOTFOUND')) {
            console.log('\n🔧 Possible solutions:');
            console.log('1. Check your internet connection');
            console.log('2. Verify MongoDB Atlas cluster is running');
            console.log('3. Check if your IP address is whitelisted in MongoDB Atlas');
            console.log('4. Try using a different network or VPN');
            console.log('5. Check if your firewall is blocking the connection');
        }
        
        process.exit(1);
    }
};

testConnection();