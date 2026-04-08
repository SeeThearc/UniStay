import User from '../models/User.js';
import Room from '../models/Room.js';
import Complaint from '../models/Complaint.js';
import Fee from '../models/Fee.js';
import Leave from '../models/Leave.js';
import { extractIntent, formatAnswer } from '../utils/geminiService.js';

// ── safe field whitelists ───────────────────────────────────────────────────
const SAFE_FIELDS = {
  users: 'name email studentId phoneNumber role isActive roomAssigned',
  rooms: 'roomNumber block floor capacity status occupants rentPerBed amenities',
  complaints: 'ticketId title category status priority studentId createdAt resolvedAt',
  fees: 'studentId totalFee amountPaid remainingDues status semester dueDate',
  leaves: 'studentId fromDate toDate reason status leaveType numberOfDays',
};

const MODELS = { users: User, rooms: Room, complaints: Complaint, fees: Fee, leaves: Leave };

// ── Build a safe Mongoose filter from intent.filters ────────────────────────
const buildFilter = (filters = {}, collection) => {
  const f = {};
  if (!filters) return f;

  if (filters.role) f.role = filters.role;
  if (filters.status) f.status = filters.status;
  if (filters.priority) f.priority = filters.priority;
  if (filters.category) f.category = filters.category;
  if (filters.leaveType) f.leaveType = filters.leaveType;
  if (filters.block) f.block = filters.block;
  if (filters.floor != null && !isNaN(filters.floor)) f.floor = Number(filters.floor);
  if (filters.isActive != null) f.isActive = Boolean(filters.isActive);

  if (filters.feeCheck && collection === 'fees') {
    if (filters.feeCheck === 'overdue' || filters.feeCheck === 'unpaid')
      f.remainingDues = { $gt: 0 };
    if (filters.feeCheck === 'paid')
      f.status = 'Paid';
    if (filters.feeCheck === 'partial')
      f.status = 'Partially Paid';
  }
  return f;
};

// ── Execute the safe query based on intent ───────────────────────────────────
const runQuery = async (intent) => {
  const { collection, filters, intent: queryType, groupBy, sortBy, sortOrder, limit } = intent;

  const Model = MODELS[collection];
  if (!Model) throw new Error(`Unknown collection: ${collection}`);

  const filter = buildFilter(filters, collection);
  const safeFields = SAFE_FIELDS[collection];
  const safeLimit = Math.min(Number(limit) || 10, 20);
  const sortDir = sortOrder === 'asc' ? 1 : -1;
  const sortField = sortBy || 'createdAt';

  // ── COUNT ──
  if (queryType === 'count') {
    const count = await Model.countDocuments(filter);
    return { type: 'count', value: count, collection };
  }

  // ── GROUP BY (summary / distribution) ──
  if (queryType === 'summary' && groupBy) {
    const pipeline = [
      { $match: filter },
      { $group: { _id: `$${groupBy}`, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ];
    const rows = await Model.aggregate(pipeline);
    return { type: 'summary', groupBy, rows, collection };
  }

  // ── LIST ──
  let query = Model.find(filter).select(safeFields).limit(safeLimit).sort({ [sortField]: sortDir });

  // Populate student name for relational collections
  if (['complaints', 'fees', 'leaves'].includes(collection)) {
    query = query.populate('studentId', 'name studentId');
  }
  if (collection === 'rooms') {
    query = query.populate('occupants', 'name studentId');
  }

  const docs = await query.lean();
  return { type: 'list', docs, count: docs.length, collection };
};

// ── Main controller ──────────────────────────────────────────────────────────
export const askAI = async (req, res) => {
  try {
    const { question } = req.body;
    if (!question || !question.trim()) {
      return res.status(400).json({ success: false, message: 'Question is required' });
    }

    const q = question.trim().slice(0, 500); // cap length

    // Step 1 — extract intent from Gemini
    let intent;
    try {
      intent = await extractIntent(q);
    } catch (err) {
      console.error('Intent extraction failed:', err.message);
      return res.status(422).json({
        success: false,
        message: 'Could not understand the question. Try rephrasing it.',
        raw: err.message,   // visible in browser network tab
      });
    }

    // Guard: unknown intent
    if (intent.intent === 'unknown' || !MODELS[intent.collection]) {
      return res.json({
        success: true,
        answer: "I can only answer questions about students, rooms, complaints, fees, and leaves. Please try a more specific question.",
        data: null,
        intent,
      });
    }

    // Step 2 — run safe DB query
    const rawData = await runQuery(intent);

    // Step 3 — format answer via Gemini
    const answer = await formatAnswer(q, intent, rawData);

    res.json({ success: true, answer, data: rawData, intent });
  } catch (err) {
    console.error('AI query error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
