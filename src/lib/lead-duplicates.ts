import Lead from '@/models/Lead';
import {
  FieldValidationError,
  WITNESS_EMAIL_KEYS,
  WITNESS_PHONE_KEYS,
  getWitnessDetails,
  normalizeAddress,
  normalizeEmail,
  normalizePhone,
} from '@/lib/lead-utils';

type DuplicateScope = Record<string, unknown>;

export type LeadDuplicateResult = {
  isDuplicate: boolean;
  duplicateReason: string;
  fieldErrors: FieldValidationError[];
  existingLeadInfo: {
    id: unknown;
    name: string;
    status: string;
    createdBy: string;
    createdAt: Date;
  } | null;
};

export const buildLeadDuplicateScope = (): DuplicateScope => {
  return {};
};

const buildLeadInfo = (lead: any) => ({
  id: lead._id,
  name: `${lead.firstName || ''} ${lead.lastName || ''}`.trim(),
  status: lead.status,
  createdBy: lead.createdBy ? lead.createdBy.name : 'Unknown',
  createdAt: lead.createdAt,
});

const fieldValueQuery = (keys: string[], value: string) => ({
  fields: {
    $elemMatch: {
      key: { $in: keys },
      value,
    },
  },
});

const fieldEmailQuery = (keys: string[], value: string) => ({
  fields: {
    $elemMatch: {
      key: { $in: keys },
      value: { $regex: `^${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
    },
  },
});

export const findDuplicateLead = async ({
  decoded,
  user,
  email,
  phone,
  address,
  fields,
  excludeLeadId,
}: {
  decoded: any;
  user: any;
  email?: string | null;
  phone?: string | null;
  address?: {
    streetAddress?: string | null;
    city?: string | null;
    state?: string | null;
    zipCode?: string | null;
    address?: string | null;
  };
  fields?: unknown;
  excludeLeadId?: string | null;
}): Promise<LeadDuplicateResult> => {
  const scope = buildLeadDuplicateScope();
  const emailNormalized = normalizeEmail(email);
  const phoneNormalized = normalizePhone(phone);
  const addressNormalized = address ? normalizeAddress(address) : '';
  const witness = getWitnessDetails(fields);
  const witnessPhoneNormalized = normalizePhone(witness.phone);
  const witnessEmailNormalized = normalizeEmail(witness.email);
  const conditions: any[] = [];
  const fieldErrors: FieldValidationError[] = [];

  if (phoneNormalized) {
    conditions.push({ phoneNormalized });
    conditions.push(fieldValueQuery(WITNESS_PHONE_KEYS, phoneNormalized));
  }

  if (emailNormalized) {
    conditions.push({ emailNormalized });
    conditions.push(fieldEmailQuery(WITNESS_EMAIL_KEYS, emailNormalized));
  }

  if (addressNormalized) {
    conditions.push({ addressNormalized });
  }

  if (witnessPhoneNormalized) {
    conditions.push({ phoneNormalized: witnessPhoneNormalized });
    conditions.push(fieldValueQuery(WITNESS_PHONE_KEYS, witnessPhoneNormalized));
  }

  if (witnessEmailNormalized) {
    conditions.push({ emailNormalized: witnessEmailNormalized });
    conditions.push(fieldEmailQuery(WITNESS_EMAIL_KEYS, witnessEmailNormalized));
  }

  if (conditions.length === 0) {
    return { isDuplicate: false, duplicateReason: '', fieldErrors, existingLeadInfo: null };
  }

  const query: any = {
    ...scope,
    $or: conditions,
  };

  if (excludeLeadId) {
    query._id = { $ne: excludeLeadId };
  }

  const duplicate: any = await Lead.findOne(query)
    .select('_id firstName lastName status createdBy createdAt phoneNormalized emailNormalized addressNormalized fields')
    .populate('createdBy', 'name email')
    .lean();

  if (!duplicate) {
    return { isDuplicate: false, duplicateReason: '', fieldErrors, existingLeadInfo: null };
  }

  const duplicateWitness = getWitnessDetails(duplicate.fields);
  const duplicateWitnessPhone = normalizePhone(duplicateWitness.phone);
  const duplicateWitnessEmail = normalizeEmail(duplicateWitness.email);

  if (
    phoneNormalized &&
    (duplicate.phoneNormalized === phoneNormalized || duplicateWitnessPhone === phoneNormalized)
  ) {
    fieldErrors.push({ field: 'phone', message: 'This lead appears to be a duplicate.' });
  }

  if (
    emailNormalized &&
    (duplicate.emailNormalized === emailNormalized || duplicateWitnessEmail === emailNormalized)
  ) {
    fieldErrors.push({ field: 'email', message: 'This lead appears to be a duplicate.' });
  }

  if (addressNormalized && duplicate.addressNormalized === addressNormalized) {
    fieldErrors.push({ field: 'streetAddress', message: 'This lead appears to be a duplicate.' });
    fieldErrors.push({ field: 'city', message: 'This lead appears to be a duplicate.' });
    fieldErrors.push({ field: 'state', message: 'This lead appears to be a duplicate.' });
    fieldErrors.push({ field: 'zipCode', message: 'This lead appears to be a duplicate.' });
  }

  if (
    witnessPhoneNormalized &&
    (duplicate.phoneNormalized === witnessPhoneNormalized || duplicateWitnessPhone === witnessPhoneNormalized)
  ) {
    fieldErrors.push({
      field: 'fields.Witness Number',
      message: 'Witness phone number already exists in another lead.',
    });
  }

  if (
    witnessEmailNormalized &&
    (duplicate.emailNormalized === witnessEmailNormalized || duplicateWitnessEmail === witnessEmailNormalized)
  ) {
    fieldErrors.push({
      field: 'fields.Witness Email',
      message: 'Witness email already exists in another lead.',
    });
  }

  return {
    isDuplicate: true,
    duplicateReason: fieldErrors.map(error => error.message).join(' '),
    fieldErrors: fieldErrors.length > 0
      ? fieldErrors
      : [{ field: 'root', message: 'This lead appears to be a duplicate.' }],
    existingLeadInfo: buildLeadInfo(duplicate),
  };
};
