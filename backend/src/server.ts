import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/db';
import { createApp } from './app';

const startServer = async () => {
  try {
    console.log('🚀 Starting Radhe Windson Society ERP Backend...');
    
    // Connect to database before accepting incoming HTTP connections
    await connectDatabase();

    // In development mode, auto-provision initial administrator if database is clean
    if (env.NODE_ENV === 'development' && env.INITIAL_ADMIN_EMAIL && env.INITIAL_ADMIN_PASSWORD) {
      const { User } = await import('./models/user.model');
      const { hashPassword } = await import('./utils/security');
      const adminCount = await User.countDocuments({ role: 'SOCIETY_ADMIN' });
      if (adminCount === 0) {
        const passwordHash = await hashPassword(env.INITIAL_ADMIN_PASSWORD);
        await User.create({
          fullName: env.INITIAL_ADMIN_NAME || 'Radhe Windson Administrator',
          email: env.INITIAL_ADMIN_EMAIL.toLowerCase().trim(),
          passwordHash,
          role: 'SOCIETY_ADMIN',
          status: 'ACTIVE',
          tokenVersion: 0,
        });
        console.log(`🌱 Initial Society Administrator bootstrapped: ${env.INITIAL_ADMIN_EMAIL}`);
      }
    }

    const app = createApp();

    const server = app.listen(env.PORT, () => {
      console.log(`📡 Server running in [${env.NODE_ENV}] mode on http://localhost:${env.PORT}`);
      console.log(`🩺 Health check accessible at: http://localhost:${env.PORT}/api/v1/health`);
    });

    // Graceful Shutdown Handling
    const handleShutdown = async (signal: string) => {
      console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
      server.close(async () => {
        console.log('🔌 HTTP server closed.');
        await disconnectDatabase();
        console.log('🏁 Process terminated gracefully.');
        process.exit(0);
      });

      // Force shutdown after 10s if dangling connections persist
      setTimeout(() => {
        console.error('⚠️ Forcing process termination due to timeout.');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));

  } catch (error: any) {
    console.error('❌ Fatal error during backend initialization:', error);
    process.exit(1);
  }
};

startServer();
