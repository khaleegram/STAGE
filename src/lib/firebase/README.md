# Firebase Utilities

This directory contains Firebase configuration and helper functions.

## Seeding the Database

To use the application's secure signup feature, you must first seed the database with an initial admin access code.

Run the following command in your terminal **ONCE**:

```bash
npx tsx src/lib/firebase/seed.ts
```

This will create the necessary document in your Firestore database. After running this script, you can sign up for a new account using the access code `787978`.
