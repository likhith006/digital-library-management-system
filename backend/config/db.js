import mongoose from 'mongoose';
import dns from 'node:dns';

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/digital_library';
  const dnsServers = process.env.MONGODB_DNS_SERVERS || '8.8.8.8';
  dns.setServers(dnsServers.split(',').map((server) => server.trim()).filter(Boolean));

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`[DB] Connected to MongoDB Host: ${conn.connection.host}; database: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    throw new Error(`[DB] Could not connect to configured MongoDB: ${error.message}`, { cause: error });
  }
};

export default connectDB;
