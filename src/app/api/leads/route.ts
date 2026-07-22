import { NextRequest, NextResponse } from 'next/server';
import Lead from '@/models/Lead';
import { getAuthToken } from '@/lib/auth';
import { dbConnect } from '@/lib/dbConnect';
import User from '@/models/User';
import {
  buildFieldsArray,
  composeAddress,
  getFieldValue,
  getWitnessDetails,
  normalizeAddress,
  normalizeEmail,
  normalizePhone,
  normalizeText,
  validateLeadPayload,
} from '@/lib/lead-utils';

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildDuplicateScope = (decoded: any, user: any) => {
  if (decoded.role === 'super_admin') return {};
  if (user?.organizationId) return { organizationId: user.organizationId };
  return { createdBy: decoded.id };
};

const buildLeadInfo = (lead: any) => ({
  id: lead._id,
  name: `${lead.firstName} ${lead.lastName}`,
  status: lead.status,
  createdBy: lead.createdBy ? lead.createdBy.name : 'Unknown',
  createdAt: lead.createdAt
});

const buildVendorCode = (userId: string) => `VEN-${userId.slice(-6).toUpperCase()}`;

const parseDateOnly = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const year = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10);
  const day = Number.parseInt(match[3], 10);
  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) return null;

  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
};

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Already returns decoded token payload
    const decoded = getAuthToken(request);

    if (!decoded || typeof decoded !== 'object') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = decoded.id;
    const userRole = decoded.role;
    if (!userId) {
      return NextResponse.json({ error: 'Token missing user ID' }, { status: 401 });
    }

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('search');
    const entryDate = url.searchParams.get('entryDate');
    const applicationType = url.searchParams.get('applicationType');

    const skip = (page - 1) * limit;

    // Build query
    let query: any = {};

    if (userRole !== 'super_admin') {
      query.createdBy = userId;
    }

    if (status) {
      query.status = status;
    }

    if (applicationType) {
      query.applicationType = applicationType;
    }

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    if (entryDate) {
      const parsed = parseDateOnly(entryDate);
      if (parsed) {
        const start = new Date(parsed.year, parsed.month - 1, parsed.day, 0, 0, 0, 0);
        const end = new Date(parsed.year, parsed.month - 1, parsed.day + 1, 0, 0, 0, 0);
        query.createdAt = { $gte: start, $lt: end };
      }
    }

    const leads = await Lead.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'name email')
      .lean();

    const total = await Lead.countDocuments(query);

    return NextResponse.json({
      leads,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching leads:', error);
    return NextResponse.json(
      { message: 'Server error', error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    // Verify authentication
    const decoded = getAuthToken(request);

    if (!decoded || typeof decoded !== 'object') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get the user's organization to assign it to the lead
    const user = await User.findById(decoded.id).select('organizationId');

    const body = await request.json();
    const normalizedEmail = normalizeEmail(body.email);
    const normalizedPhone = normalizePhone(body.phone);
    const normalizedAddress = normalizeAddress(body);
    const fullNameNormalized = normalizeText(`${body.firstName || ''} ${body.lastName || ''}`);
    const fullAddress = composeAddress(body);

    // Server-side validation for required fields
    const { applicationType, fields } = body;
    const validationErrors = validateLeadPayload(body);
    if (validationErrors.length > 0) {
      return NextResponse.json({
        message: validationErrors.join(' '),
        errors: validationErrors,
      }, { status: 400 });
    }

    // Check for duplicate email or phone
    let isDuplicate = false;
    let duplicateReason = '';
    let existingLeadInfo = null;

    // Build duplicate query with proper scope
    let duplicateQuery: any = buildDuplicateScope(decoded, user);

    if (normalizedEmail) {
      duplicateQuery = { ...duplicateQuery, emailNormalized: normalizedEmail };

      const duplicateEmail = await Lead.findOne(duplicateQuery)
        .populate('createdBy', 'name email');

      if (duplicateEmail) {
        isDuplicate = true;
        duplicateReason = 'email';
        existingLeadInfo = buildLeadInfo(duplicateEmail);
      }
    }

    // Reset duplicate query except for scope filter
    duplicateQuery = buildDuplicateScope(decoded, user);

    // If not duplicate by email, check phone
    if (!isDuplicate && normalizedPhone) {
      duplicateQuery = { ...duplicateQuery, phoneNormalized: normalizedPhone };

      const duplicatePhone = await Lead.findOne(duplicateQuery)
        .populate('createdBy', 'name email');

      if (duplicatePhone) {
        isDuplicate = true;
        duplicateReason = 'phone number';
        existingLeadInfo = buildLeadInfo(duplicatePhone);
      }
    }

    duplicateQuery = buildDuplicateScope(decoded, user);

    if (!isDuplicate && normalizedAddress) {
      const duplicateAddress = await Lead.findOne({
        ...duplicateQuery,
        $or: [
          { addressNormalized: normalizedAddress },
          { address: { $regex: new RegExp(`^${escapeRegex(fullAddress)}$`, 'i') } },
        ],
      }).populate('createdBy', 'name email');

      if (duplicateAddress) {
        isDuplicate = true;
        duplicateReason = 'full address';
        existingLeadInfo = buildLeadInfo(duplicateAddress);
      }
    }

    duplicateQuery = buildDuplicateScope(decoded, user);

    if (!isDuplicate && (applicationType === 'Rideshare' || applicationType === 'Roblox')) {
      const witness = getWitnessDetails(fields);
      const witnessName = normalizeText(witness.name);
      const witnessNumber = normalizePhone(witness.phone);

      if (witnessNumber) {
        const rideshareLeads = await Lead.find({
          ...duplicateQuery,
          applicationType,
          fields: {
            $all: [
              { $elemMatch: { key: { $in: ['Witness Number', 'Incident Reported Person Number'] } } }
            ]
          }
        }).populate('createdBy', 'name email');

        const duplicateWitness = rideshareLeads.find((lead: any) => {
          const existingFields = Array.isArray(lead.fields) ? lead.fields : [];
          const existingWitness = getWitnessDetails(existingFields);
          const existingName = normalizeText(existingWitness.name);
          const existingNumber = normalizePhone(existingWitness.phone);

          return existingNumber === witnessNumber &&
            (!witnessName || !existingName || existingName === witnessName);
        });

        if (duplicateWitness) {
          isDuplicate = true;
          duplicateReason = 'witness details';
          existingLeadInfo = buildLeadInfo(duplicateWitness);
        }
      }
    }

    duplicateQuery = buildDuplicateScope(decoded, user);

    if (!isDuplicate && fullNameNormalized) {
      const duplicateName = await Lead.findOne({
        ...duplicateQuery,
        $or: [
          { fullNameNormalized },
          {
            firstName: { $regex: new RegExp(`^${escapeRegex(body.firstName || '')}$`, 'i') },
            lastName: { $regex: new RegExp(`^${escapeRegex(body.lastName || '')}$`, 'i') },
          },
        ],
      }).populate('createdBy', 'name email');

      if (duplicateName) {
        isDuplicate = true;
        duplicateReason = 'customer name';
        existingLeadInfo = buildLeadInfo(duplicateName);
      }
    }

    // Set status to DUPLICATE if a duplicate was found
    const status = isDuplicate ? 'DUPLICATE' : (body.status || 'PENDING');

    // Create notes with duplicate information if applicable
    let notes = body.notes || '';
    if (isDuplicate && existingLeadInfo) {
      notes = `${notes}\n\n[SYSTEM] This lead has been marked as a duplicate because the ${duplicateReason} matches an existing lead (${existingLeadInfo.name}).`;
    }

    // Transform dynamic fields from object to array format
    const fieldsArray = buildFieldsArray(body.fields);

    // Create the lead with proper fields format and assign organization
    const lead = await Lead.create({
      firstName: body.firstName,
      lastName: body.lastName,
      fullNameNormalized,
      email: body.email,
      emailNormalized: isDuplicate ? undefined : (normalizedEmail || undefined),
      phone: body.phone,
      phoneNormalized: isDuplicate ? undefined : (normalizedPhone || undefined),
      dateOfBirth: body.dateOfBirth,
      address: fullAddress,
      streetAddress: body.streetAddress,
      city: body.city,
      state: body.state,
      zipCode: body.zipCode,
      addressNormalized: normalizedAddress || undefined,
      applicationType: body.applicationType,
      lawsuit: body.lawsuit,
      notes: notes,
      status: status,
      fields: fieldsArray,
      createdBy: decoded.id,
      buyerCode: body.buyerCode || buildVendorCode(decoded.id),
      // Assign the user's organization ID to the lead
      organizationId: user?.organizationId || null,
      statusHistory: [
        {
          fromStatus: '',
          toStatus: status,
          notes: isDuplicate
            ? `Lead created and automatically marked as DUPLICATE (matching ${duplicateReason})`
            : 'Lead created',
          changedBy: decoded.id,
          timestamp: new Date()
        }
      ]
    });

    return NextResponse.json({
      message: isDuplicate
        ? `Lead created but marked as DUPLICATE (matching ${duplicateReason})`
        : 'Lead created successfully',
      lead,
      isDuplicate,
      duplicateInfo: isDuplicate ? existingLeadInfo : null
    }, { status: 201 });
  } catch (error) {
    const mongoError = error as { code?: number };
    if (mongoError?.code === 11000) {
      return NextResponse.json(
        { message: 'Duplicate lead detected while saving. Please refresh and review the existing record.' },
        { status: 409 }
      );
    }
    console.error('Error creating lead:', error);
    return NextResponse.json(
      { message: 'Server error', error: (error as Error).message },
      { status: 500 }
    );
  }
}
