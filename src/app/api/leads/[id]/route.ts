import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/auth';
import Lead from '@/models/Lead';
import { dbConnect } from '@/lib/dbConnect';
import User from '@/models/User';
import { findDuplicateLead } from '@/lib/lead-duplicates';
import {
  buildFieldsArray,
  composeAddress,
  LEAD_STATUSES,
  normalizeAddress,
  normalizeEmail,
  normalizeLeadStatus,
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

    const detailFields = ['firstName', 'lastName', 'email', 'phone', 'dateOfBirth', 'applicationType', 'lawsuit', 'notes', 'streetAddress', 'city', 'state', 'zipCode', 'fields'];
    const isLeadDetailSave = detailFields.some(field => Object.prototype.hasOwnProperty.call(body, field));
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
    const validationErrors = isLeadDetailSave ? validateLeadPayload(mergedPayload) : [];

    if (validationErrors.length > 0) {
      return NextResponse.json({
        message: validationErrors.map(error => error.message).join(' '),
        errors: validationErrors,
        fieldErrors: validationErrors,
      }, { status: 400 });
    }

    let duplicateResult: Awaited<ReturnType<typeof findDuplicateLead>> | null = null;
    if (isLeadDetailSave) {
      const user = await User.findById(decoded.id).select('organizationId');
      duplicateResult = await findDuplicateLead({
        decoded,
        user,
        email: mergedPayload.email,
        phone: mergedPayload.phone,
        address: mergedPayload,
        fields: mergedPayload.fields,
        excludeLeadId: leadId,
      });
    }

    // Handle status history and dynamic fields as before
    const incomingStatus = body.status ? normalizeLeadStatus(body.status) : body.status;
    if (incomingStatus && !LEAD_STATUSES.includes(incomingStatus as any)) {
      return NextResponse.json({ message: 'Invalid status selected' }, { status: 400 });
    }

    if (incomingStatus && incomingStatus !== lead.status) {
      lead.statusHistory.push({
        fromStatus: lead.status,
        toStatus: incomingStatus,
        notes: body.statusNote || "",
        changedBy: decoded.id,
        timestamp: new Date()
      });
      lead.status = incomingStatus;
    }

    if (duplicateResult?.isDuplicate && lead.status !== 'DUPLICATE') {
      lead.statusHistory.push({
        fromStatus: lead.status,
        toStatus: 'DUPLICATE',
        notes: `Lead updated and automatically marked as DUPLICATE. ${duplicateResult.duplicateReason}`,
        changedBy: decoded.id,
        timestamp: new Date()
      });
      lead.status = 'DUPLICATE';
    }

    // Dynamic fields transformation
    if (body.fields && typeof body.fields === 'object') {
      lead.fields = buildFieldsArray(body.fields);
    }

    // Update basic fields
    const updateable = detailFields.filter(field => field !== 'fields');
    updateable.forEach(field => {
      if (Object.prototype.hasOwnProperty.call(body, field)) lead[field] = body[field];
    });

    const fullAddress = composeAddress({ ...lead.toObject(), ...body });
    lead.address = fullAddress;
    lead.fullNameNormalized = normalizeText(`${lead.firstName || ''} ${lead.lastName || ''}`);
    lead.emailNormalized = normalizeEmail(lead.email) || undefined;
    lead.phoneNormalized = normalizePhone(lead.phone) || undefined;
    lead.addressNormalized = normalizeAddress({ ...lead.toObject(), ...body }) || undefined;

    if (duplicateResult?.isDuplicate && duplicateResult.existingLeadInfo) {
      lead.notes = `${lead.notes || ''}\n\n[SYSTEM] This lead has been marked as a duplicate. ${duplicateResult.duplicateReason} Existing lead: ${duplicateResult.existingLeadInfo.name}.`.trim();
    }

    await lead.save();
    return NextResponse.json({
      message: duplicateResult?.isDuplicate
        ? 'Lead saved and marked as DUPLICATE.'
        : 'Updated successfully',
      lead,
      isDuplicate: Boolean(duplicateResult?.isDuplicate),
      duplicateInfo: duplicateResult?.existingLeadInfo || null,
      fieldErrors: duplicateResult?.fieldErrors || [],
    });
  } catch (error: any) {
    return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
  }
}
