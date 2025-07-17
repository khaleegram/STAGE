
// To run this script, use the command:
// npx tsx src/lib/firebase/seed.ts

import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

const ACCESS_CODE = '787978';

async function seedAccessCode() {
  try {
    console.log('Seeding database with initial admin access code...');
    const settingsRef = doc(db, 'system_settings', 'access_code');
    await setDoc(settingsRef, {
      code: ACCESS_CODE,
    });
    console.log('✅ Success! Admin access code has been set to 787978.');
    console.log('You can now sign up with a new account using this code.');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Check if the script is being run directly
if (require.main === module) {
  seedAccessCode().then(() => {
    process.exit(0);
  });
}
