import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/auth';
import Lead from '@/models/Lead';
import { dbConnect } from '@/lib/dbConnect';
import {
  buildFieldsArray,
  composeAddress,
  normalizeAddress,
  normalizeEmail,
  normalizePhone,
  normalizeText,
  validateLeadPayload,
} from '@/lib/lead-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // Define as Promise
) {
  try {
    await dbConnect();
    const decoded = getAuthToken(request);
    if (!decoded || typeof decoded !== 'object') return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    // FIX: Await params before accessing .id
    const { id: leadId } = await params;

    const lead = await Lead.findById(leadId)
      .populate('createdBy', 'name email')
      .populate('statusHistory.changedBy', 'name email');

    if (!lead) return NextResponse.json({ message: 'Lead not found' }, { status: 404 });

    if (decoded.role !== 'super_admin' &&
        lead.createdBy && lead.createdBy._id.toString() !== decoded.id) {
      return NextResponse.json({ message: 'Access Denied' }, { status: 403 });
    }

    return NextResponse.json({ lead });
  } catch (error: any) {
    return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // Define as Promise
) {
  try {
    await dbConnect();
    const decoded = getAuthToken(request);
    if (!decoded || typeof decoded !== 'object') return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    // FIX: Await params before accessing .id
    const { id: leadId } = await params;
    const body = await request.json();

    if (decoded.role !== 'super_admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    const lead = await Lead.findById(leadId);
    if (!lead) return NextResponse.json({ message: 'Lead not found' }, { status: 404 });

    const existingFields = Array.isArray(lead.fields)
      ? lead.fields.reduce((acc: Record<string, string>, field: { key: string; value: string }) => {
          if (field?.key) acc[field.key] = field.value || '';
          return acc;
        }, {})
      : {};
    const mergedPayload = {
      ...lead.toObject(),
      ...body,
      fields: body.fields && typeof body.fields === 'object' ? body.fields : existingFields,
    };
    const validationErrors = validateLeadPayload(mergedPayload);

    if (validationErrors.length > 0) {
      return NextResponse.json({
        message: validationErrors.join(' '),
        errors: validationErrors,
      }, { status: 400 });
    }

    // Handle status history and dynamic fields as before
    if (body.status && body.status !== lead.status) {
      lead.statusHistory.push({
        fromStatus: lead.status,
        toStatus: body.status,
        notes: body.statusNote || "",
        changedBy: decoded.id,
        timestamp: new Date()
      });
      lead.status = body.status;
    }

    // Dynamic fields transformation
    if (body.fields && typeof body.fields === 'object') {
      lead.fields = buildFieldsArray(body.fields);
    }

    // Update basic fields
    const updateable = ['firstName', 'lastName', 'email', 'phone', 'dateOfBirth', 'applicationType', 'lawsuit', 'notes', 'streetAddress', 'city', 'state', 'zipCode'];
    updateable.forEach(field => {
      if (Object.prototype.hasOwnProperty.call(body, field)) lead[field] = body[field];
    });

    const fullAddress = composeAddress({ ...lead.toObject(), ...body });
    lead.address = fullAddress;
    lead.fullNameNormalized = normalizeText(`${lead.firstName || ''} ${lead.lastName || ''}`);
    lead.emailNormalized = normalizeEmail(lead.email) || undefined;
    lead.phoneNormalized = normalizePhone(lead.phone) || undefined;
    lead.addressNormalized = normalizeAddress({ ...lead.toObject(), ...body }) || undefined;

    await lead.save();
    return NextResponse.json({ message: 'Updated successfully', lead });
  } catch (error: any) {
    return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
  }
}
