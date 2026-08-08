import { UserProfile } from '../types';

/**
 * Generates a permanent unique referral code for CBT Master.
 * Format: CBT + 5 random uppercase alphanumeric characters (e.g., CBT8XK92)
 */
export function generateUniqueReferralCode(existingCodes: string[] = []): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // Excludes confusing characters 0, 1, O, I
  let code = '';
  let attempts = 0;
  
  do {
    let suffix = '';
    for (let i = 0; i < 5; i++) {
      suffix += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    code = `CBT${suffix}`;
    attempts++;
  } while (existingCodes.includes(code) && attempts < 1000);

  return code;
}

/**
 * Ensures a user profile has a referral code and referral count.
 * If missing, generates a permanent one and returns the updated profile.
 */
export function ensureReferralFields(user: UserProfile, existingUsers: UserProfile[] = []): UserProfile {
  let needsUpdate = false;
  let code = user.referralCode;

  if (!code) {
    const existingCodes = existingUsers
      .map((u) => u.referralCode)
      .filter((c): c is string => Boolean(c));
    code = generateUniqueReferralCode(existingCodes);
    needsUpdate = true;
  }

  const count = typeof user.completedReferrals === 'number'
    ? user.completedReferrals
    : typeof user.successfulReferrals === 'number'
    ? user.successfulReferrals
    : 0;

  if (user.completedReferrals !== count || user.successfulReferrals !== count) {
    needsUpdate = true;
  }

  if (needsUpdate) {
    return {
      ...user,
      referralCode: code,
      successfulReferrals: count,
      completedReferrals: count,
    };
  }

  return user;
}

/**
 * Constructs the user's permanent referral link.
 */
export function getReferralLink(referralCode: string): string {
  const baseUrl = window.location.origin || 'https://cbtmaster.app';
  return `${baseUrl}/signup?ref=${referralCode}`;
}
