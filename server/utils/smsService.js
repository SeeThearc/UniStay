import twilio from 'twilio';

/**
 * Normalize a phone number to E.164 format.
 * If it already starts with '+', leave it as-is.
 * Otherwise prepend '+91' (India default).
 */
const normalizePhone = (phone) => {
    if (!phone) return null;
    const cleaned = phone.trim();
    return cleaned.startsWith('+') ? cleaned : `+91${cleaned}`;
};

/**
 * Send an SMS to a given phone number.
 * Non-blocking — logs warnings/errors instead of throwing.
 * Reads Twilio credentials lazily so dotenv has time to load.
 * @param {string} to   - Phone number (E.164 or local 10-digit Indian)
 * @param {string} body - SMS message body
 */
export const sendSMS = async (to, body) => {
    const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } = process.env;

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
        console.warn('⚠️  Twilio not configured – SMS skipped. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in .env');
        return;
    }

    if (!TWILIO_PHONE_NUMBER) {
        console.warn('⚠️  TWILIO_PHONE_NUMBER not set – SMS skipped.');
        return;
    }

    if (!to) {
        console.warn('⚠️  No phone number provided – SMS skipped.');
        return;
    }

    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    const normalizedTo = normalizePhone(to);

    try {
        const message = await client.messages.create({
            body,
            from: TWILIO_PHONE_NUMBER,
            to: normalizedTo
        });
        console.log(`✅ SMS sent to ${normalizedTo} | SID: ${message.sid}`);
    } catch (error) {
        console.error(`❌ SMS failed to ${normalizedTo}:`, error.message);
    }
};

/**
 * Send the same SMS to all active wardens.
 * @param {string} body     - SMS message body
 * @param {Model}  UserModel - Mongoose User model (passed to avoid circular imports)
 */
export const notifyWardens = async (body, UserModel) => {
    try {
        const wardens = await UserModel.find({ role: 'warden', isActive: true }).select('name phoneNumber');
        if (!wardens.length) {
            console.warn('⚠️  No active wardens found – warden SMS skipped.');
            return;
        }

        for (const warden of wardens) {
            if (warden.phoneNumber) {
                await sendSMS(normalizePhone(warden.phoneNumber), body);
            } else {
                console.warn(`⚠️  Warden ${warden.name} has no phone number – skipped.`);
            }
        }
    } catch (error) {
        console.error('❌ Failed to notify wardens via SMS:', error.message);
    }
};
