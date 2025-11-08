#!/usr/bin/env node

/**
 * Generate VAPID keys for Web Push notifications
 * Run this script once to generate your VAPID keys and add them to your .env file
 */

import webpush from 'web-push';

console.log('Generating VAPID keys for Web Push notifications...\n');

const vapidKeys = webpush.generateVAPIDKeys();

console.log('VAPID Keys Generated Successfully!');
console.log('Add these to your .env file:\n');
console.log(`VAPID_PUBLIC_KEY="${vapidKeys.publicKey}"`);
console.log(`VAPID_PRIVATE_KEY="${vapidKeys.privateKey}"`);
console.log('VAPID_SUBJECT="mailto:your-email@example.com"');
console.log('\nReplace "your-email@example.com" with your actual email address.');
console.log('\nIMPORTANT: Keep your private key secret and never commit it to version control!');
