import { GoogleGenerativeAI } from '@google/generative-ai';

// ⚠️ Do NOT initialise genAI at module level — ES module imports are
// hoisted before dotenv.config() runs, so process.env.GEMINI_API_KEY
// would be undefined. Instead, create the client lazily inside each function.

const getModel = () => {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key || key === 'your_gemini_api_key_here') {
    throw new Error('GEMINI_API_KEY is not set in server/.env');
  }
  const genAI = new GoogleGenerativeAI(key);
  return genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });
};

// ── Schema context fed to Gemini every request ──────────────────────────────
const SCHEMA_CONTEXT = `
You are an AI assistant embedded inside "UniStay" — a Smart Hostel Management System.
The system has these MongoDB collections:

1. users  — fields: name, email, role (admin|warden|student), studentId, phoneNumber, isActive, roomAssigned (ObjectId→room), dateOfBirth, address, guardianName, guardianContact
2. rooms  — fields: roomNumber, block, floor, capacity, occupants (array of user ObjectIds), status (Available|Full|Maintenance), amenities (array), rentPerBed
3. complaints — fields: ticketId, studentId (→user), title, description, category (Maintenance|Electrical|Plumbing|Cleaning|Security|Other), status (Pending|In Progress|Resolved), priority (Low|Medium|High), comments (array), resolvedBy (→user), resolvedAt
4. fees   — fields: studentId (→user), totalFee, amountPaid, remainingDues, status (Paid|Partially Paid|Unpaid), semester, dueDate, paymentHistory (array)
5. leaves — fields: studentId (→user), fromDate, toDate, reason, status (Pending|Approved|Rejected), leaveType (Medical|Emergency|Personal|Other), approvedBy (→user), numberOfDays, rejectionReason
`;

// ── STEP 1: Extract structured intent from natural language ──────────────────
export const extractIntent = async (question) => {
  const model = getModel();

  const prompt = `
${SCHEMA_CONTEXT}

Given the user question below, extract a structured query intent as valid JSON only.
No explanation, no markdown — ONLY raw JSON.

Return this exact shape:
{
  "intent": "count" | "list" | "summary" | "unknown",
  "collection": "users" | "rooms" | "complaints" | "fees" | "leaves",
  "filters": {
    "role": "student" | "warden" | "admin" | null,
    "status": "<exact enum value from schema>" | null,
    "priority": "Low" | "Medium" | "High" | null,
    "category": "<complaint category>" | null,
    "leaveType": "Medical" | "Emergency" | "Personal" | "Other" | null,
    "block": "<block letter>" | null,
    "floor": <floor number as integer> | null,
    "isActive": true | false | null,
    "feeCheck": "overdue" | "paid" | "unpaid" | "partial" | null
  },
  "groupBy": "status" | "category" | "block" | "floor" | "leaveType" | "priority" | null,
  "sortBy": "createdAt" | "remainingDues" | "name" | "numberOfDays" | null,
  "sortOrder": "asc" | "desc",
  "limit": <number, 1-20, default 10>
}

User question: "${question}"
`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  // Robustly extract the first {...} JSON object regardless of surrounding text
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error('Gemini raw response (no JSON found):', text.substring(0, 500));
    throw new Error(`Gemini did not return valid JSON. Got: ${text.substring(0, 200)}`);
  }

  try {
    return JSON.parse(jsonMatch[0]);
  } catch (parseErr) {
    console.error('JSON parse failed. Raw match:', jsonMatch[0].substring(0, 500));
    throw new Error(`Failed to parse Gemini JSON: ${parseErr.message}`);
  }

};

// ── STEP 2: Format raw DB results into a human answer ───────────────────────
export const formatAnswer = async (question, intent, rawData) => {
  const model = getModel();

  const prompt = `
You are a helpful hostel management assistant inside UniStay.
The admin/warden asked: "${question}"

Here is the raw data from the database (JSON):
${JSON.stringify(rawData, null, 2)}

Write a clear, concise, friendly answer in 1-3 sentences.
- If it's a number, state it directly.
- If it's a list, summarize the key points.
- Use "students", "rooms", "complaints" etc — not technical field names.
- Do NOT mention MongoDB, queries, or technical details.
- Keep it under 80 words.
`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
};
