import { env } from '../config/env';
import { connectDatabase, disconnectDatabase } from '../config/db';
import { User } from '../models/user.model';
import { hashPassword } from '../utils/security';

const seedAdmin = async () => {
  try {
    console.log('🌱 Starting Controlled Administrator Provisioning Seeder...');
    await connectDatabase();

    const adminEmail = env.INITIAL_ADMIN_EMAIL?.trim().toLowerCase();
    const adminPassword = env.INITIAL_ADMIN_PASSWORD;
    const adminName = env.INITIAL_ADMIN_NAME?.trim();

    if (!adminEmail || !adminPassword || !adminName) {
      console.error('❌ Missing required administrator provisioning credentials in environment (.env).');
      process.exit(1);
    }

    // Assert minimum password security requirements: at least 10 chars, upper, lower, number, special char
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{10,}$/;
    if (!passwordRegex.test(adminPassword)) {
      console.error(
        '❌ Initial administrator password does not meet security criteria. Must be at least 10 characters and contain lowercase, uppercase, numbers, and special characters.'
      );
      process.exit(1);
    }

    // 1. Check if an administrator already exists (prevent unexpected overwrite)
    const existingAdmin = await User.findOne({ role: 'SOCIETY_ADMIN' });
    if (existingAdmin) {
      console.warn(
        `⚠️ A SOCIETY_ADMIN account already exists in database (Email: ${existingAdmin.email}). Aborting seeder to prevent accidental overwrite.`
      );
      await disconnectDatabase();
      process.exit(0);
    }

    // 2. Hash password with bcryptjs (12 salt rounds)
    const passwordHash = await hashPassword(adminPassword);

    // 3. Create administrator document
    const newAdmin = await User.create({
      fullName: adminName,
      email: adminEmail,
      passwordHash,
      role: 'SOCIETY_ADMIN',
      status: 'ACTIVE',
      tokenVersion: 0,
    });

    console.log('✅ Initial Society Administrator successfully provisioned:');
    console.log(`   - ID: ${newAdmin._id}`);
    console.log(`   - Name: ${newAdmin.fullName}`);
    console.log(`   - Email: ${newAdmin.email}`);
    console.log(`   - Role: ${newAdmin.role}`);
    console.log('🔒 Password stored securely with 12 bcrypt salt rounds. Plaintext password was not logged.');

    await disconnectDatabase();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Failed to provision initial administrator:', error.message);
    await disconnectDatabase();
    process.exit(1);
  }
};

seedAdmin();
