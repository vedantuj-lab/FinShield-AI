import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { count, eq } from 'drizzle-orm';
import { db } from './index.ts';
import {
  educationalSafetyContent,
  scamCategories,
  users,
} from './schema.ts';

export async function getOrCreateFirebaseUser(uid: string, email: string, name?: string) {
  try {
    const displayName = name && name.trim().length > 0 ? name.trim() : email.split('@')[0] || 'User';
    const result = await db
      .insert(users)
      .values({
        uid,
        email: email.toLowerCase(),
        name: displayName,
        role: 'user',
        status: 'active',
        preferredLanguage: 'en',
        lastLoginAt: new Date(),
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email: email.toLowerCase(),
          lastLoginAt: new Date(),
        },
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error('Database user upsert failed:', error);
    throw new Error('Failed to synchronize user account.', { cause: error });
  }
}

export async function findUserByEmail(email: string) {
  try {
    const rows = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);
    return rows[0] || null;
  } catch (error) {
    console.error('Database user lookup failed:', error);
    throw new Error('Database lookup failed.', { cause: error });
  }
}

export async function findUserByUid(uid: string) {
  try {
    const rows = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
    return rows[0] || null;
  } catch (error) {
    console.error('Database user lookup by UID failed:', error);
    throw new Error('Database lookup failed.', { cause: error });
  }
}

export async function findUserById(id: number) {
  try {
    const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return rows[0] || null;
  } catch (error) {
    console.error('Database user lookup by ID failed:', error);
    throw new Error('Database lookup failed.', { cause: error });
  }
}

export async function countAdminUsers(): Promise<number> {
  const rows = await db
    .select({ value: count() })
    .from(users)
    .where(eq(users.role, 'admin'));
  return Number(rows[0]?.value || 0);
}

/**
 * Controlled initial admin setup via server environment variables:
 * Never creates a hardcoded public password. Only seeds when ADMIN_EMAIL and
 * ADMIN_INITIAL_PASSWORD are explicitly supplied in server env and zero admins exist.
 */
export async function ensureControlledInitialAdmin() {
  try {
    const adminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    const adminPassword = (process.env.ADMIN_INITIAL_PASSWORD || '').trim();
    if (!adminEmail || !adminPassword || adminPassword.length < 10) {
      return;
    }

    const existingAdminCount = await countAdminUsers();
    if (existingAdminCount > 0) return;

    const existingUser = await findUserByEmail(adminEmail);
    const passwordHash = await bcrypt.hash(adminPassword, 12);

    if (existingUser) {
      await db
        .update(users)
        .set({ role: 'admin', status: 'active', passwordHash })
        .where(eq(users.id, existingUser.id));
    } else {
      await db.insert(users).values({
        uid: `admin_${crypto.randomUUID()}`,
        name: 'Platform Administrator',
        email: adminEmail,
        passwordHash,
        role: 'admin',
        status: 'active',
        preferredLanguage: 'en',
      });
    }
    console.log(`Initialized controlled administrator account for ${adminEmail}`);
  } catch (err) {
    console.error('Controlled admin initialization skipped:', err);
  }
}

export async function ensureDefaultGovernanceSeed() {
  try {
    const catCountRows = await db.select({ value: count() }).from(scamCategories);
    if (Number(catCountRows[0]?.value || 0) === 0) {
      await db.insert(scamCategories).values([
        {
          slug: 'authority-impersonation-kyc',
          name: 'Bank / KYC Impersonation',
          description:
            'Callers or SMS claiming your bank account or UPI wallet will be blocked unless KYC is verified immediately.',
          severityDefault: 'CRITICAL',
          isActive: true,
          ruleWeightsJson: {
            indicatorKey: 'authority_impersonation',
            weight: 20,
            keywords: ['kyc', 'account blocked', 'rbi', 'verification department', 'suspend'],
            guidance: 'Never pay a verification fee or click SMS links for KYC updates.',
          },
        },
        {
          slug: 'otp-pin-harvesting',
          name: 'OTP / UPI PIN Credential Harvesting',
          description:
            'Social engineering attempts requesting OTPs, UPI PINs, ATM PINs, CVVs, or screen-sharing apps.',
          severityDefault: 'CRITICAL',
          isActive: true,
          ruleWeightsJson: {
            indicatorKey: 'otp_or_pin_request',
            weight: 25,
            keywords: ['otp', 'upi pin', 'cvv', 'anydesk', 'teamviewer', 'screen share'],
            guidance: 'Legitimate banks never ask for OTP or UPI PIN to cancel or receive money.',
          },
        },
        {
          slug: 'fake-refund-collect',
          name: 'Fake Refund / UPI Collect Request Trap',
          description:
            'Scammers tricking victims into approving a UPI Collect request under the pretext of receiving a refund or cashback.',
          severityDefault: 'HIGH',
          isActive: true,
          ruleWeightsJson: {
            indicatorKey: 'payment_purpose_inconsistency',
            weight: 15,
            keywords: ['collect request', 'refund', 'cashback', 'receive money', 'scan qr'],
            guidance: 'Entering your UPI PIN always sends money out; it is never needed to receive funds.',
          },
        },
        {
          slug: 'urgent-payment-coercion',
          name: 'Urgent Deadline & Disconnection Threat',
          description:
            'Manufactured 10-minute deadlines threatening electricity disconnection, SIM deactivation, or legal arrest.',
          severityDefault: 'HIGH',
          isActive: true,
          ruleWeightsJson: {
            indicatorKey: 'urgent_payment_demand',
            weight: 15,
            keywords: ['within 10 minutes', 'disconnected tonight', 'digital arrest', 'police warrant'],
            guidance: 'Pause immediately and verify independently through official helpline numbers.',
          },
        },
        {
          slug: 'phishing-lookalike-url',
          name: 'Lookalike Banking / Payment Phishing URL',
          description:
            'Shortened or unofficial domains containing banking keywords designed to capture credentials.',
          severityDefault: 'HIGH',
          isActive: true,
          ruleWeightsJson: {
            indicatorKey: 'suspicious_external_link',
            weight: 15,
            keywords: ['bit.ly', 'tinyurl', '.xyz', '.top', 'kyc-update'],
            guidance: 'Never enter banking credentials on links forwarded over SMS or WhatsApp.',
          },
        },
      ]);
    }

    const eduCountRows = await db.select({ value: count() }).from(educationalSafetyContent);
    if (Number(eduCountRows[0]?.value || 0) === 0) {
      await db.insert(educationalSafetyContent).values([
        {
          title: 'Receiving Money Never Requires Your UPI PIN or OTP',
          category: 'UPI Safety',
          language: 'en',
          summary:
            'Scammers often send UPI Collect requests or QR codes claiming you must enter your UPI PIN to receive a refund, prize, or OLX/marketplace payment. In UPI, entering a PIN only authorises debiting your account.',
          actionChecklist: [
            'Decline any unexpected UPI Collect request immediately.',
            'Never scan a QR code sent by someone promising to pay you.',
            'Call 1930 or report at cybercrime.gov.in if funds were debited.',
          ],
          isPublished: true,
        },
        {
          title: 'Verify Urgent KYC & Account Freeze Alerts Independently',
          category: 'Impersonation Defense',
          language: 'en',
          summary:
            'Fraudsters create panic with 10-minute account-freeze warnings or fake electricity disconnection threats. Always check your official banking app or call the helpline printed on your debit card.',
          actionChecklist: [
            'Do not call phone numbers listed inside suspicious SMS messages.',
            'Do not install remote screen-sharing apps like AnyDesk or QuickSupport.',
            'Use FINSHIELD AI Pre-Payment Safety Checkpoint before any transfer.',
          ],
          isPublished: true,
        },
        {
          title: 'पैसे मिळवण्यासाठी UPI PIN किंवा OTP ची गरज नसते',
          category: 'UPI Safety',
          language: 'mr',
          summary:
            'फसवणूक करणारे रिफंड किंवा बक्षिसाच्या नावाखाली UPI Collect विनंती पाठवतात. UPI मध्ये PIN टाकल्यास पैसे तुमच्या खात्यातून जातात, मिळत नाहीत.',
          actionChecklist: [
            'अनोळखी UPI Collect विनंती तात्काळ नाकारा.',
            'पैसे मिळवण्यासाठी कधीही QR कोड स्कॅन करू नका.',
            'पैसे गेल्यास तात्काळ १९३० (1930) वर कॉल करा.',
          ],
          isPublished: true,
        },
        {
          title: 'पैसे प्राप्त करने के लिए कभी भी UPI PIN या OTP नहीं लगता',
          category: 'UPI Safety',
          language: 'hi',
          summary:
            'ठग अक्सर रिफंड या कैशबैक का झांसा देकर UPI Collect अनुरोध भेजते हैं। UPI PIN डालने से पैसा केवल आपके खाते से कटता है, प्राप्त नहीं होता।',
          actionChecklist: [
            'किसी भी अनजान UPI Collect अनुरोध को तुरंत अस्वीकार करें।',
            'पैसे पाने के लिए कभी भी कोई QR कोड स्कैन न करें।',
            'धोखाधड़ी होने पर तुरंत 1930 पर कॉल करें और cybercrime.gov.in पर रिपोर्ट करें।',
          ],
          isPublished: true,
        },
      ]);
    }
  } catch (err) {
    console.error('Default governance seed skipped:', err);
  }
}
