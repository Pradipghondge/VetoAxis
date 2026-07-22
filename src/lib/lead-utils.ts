import { DYNAMIC_FIELDS } from '@/lib/dynamic-fields';

export const LEAD_STATUSES = [
  'PENDING',
  'REJECTED',
  'VERIFIED',
  'REJECTED_BY_CLIENT',
  'PAID',
  'DUPLICATE',
  'NOT_RESPONDING',
  'FELONY',
  'DEAD_LEAD',
  'WORKING',
  'CALL_BACK',
  'ATTEMPT_1',
  'ATTEMPT_2',
  'ATTEMPT_3',
  'ATTEMPT_4',
  'CHARGEBACK',
  'WAITING_ID',
  'SENT_TO_CLIENT',
  'QC',
  'ID_VERIFIED',
  'BILLABLE',
  'CAMPAIGN_PAUSED',
  'SENT_TO_LAW_FIRM',
  'RETURNED',
  'ON_HOLD',
] as const;

export const WITNESS_NAME_KEY = 'Witness Name';
export const WITNESS_PHONE_KEY = 'Witness Number';
export const LEGACY_WITNESS_NAME_KEY = 'Incident Reported Person Name';
export const LEGACY_WITNESS_PHONE_KEY = 'Incident Reported Person Number';

export const normalizeEmail = (value?: string | null) => (value || '').trim().toLowerCase();

export const normalizePhone = (value?: string | null) => (value || '').replace(/\D/g, '');

export const isTenDigitPhone = (value?: string | null) => /^\d{10}$/.test(value || '');

const FAKE_PHONE_NUMBERS = new Set([
  '0000000000',
  '1111111111',
  '2222222222',
  '3333333333',
  '4444444444',
  '5555555555',
  '6666666666',
  '7777777777',
  '8888888888',
  '9999999999',
  '0123456789',
  '1234567890',
  '9876543210',
  '1231231234',
]);

export const validateUSPhoneNumber = (value?: string | null, label = 'Phone number') => {
  const raw = (value || '').trim();
  const digits = normalizePhone(raw);

  if (!raw) return `${label} is required.`;
  if (raw !== digits || !/^\d+$/.test(raw)) return `${label} must contain only numeric values.`;
  if (!isTenDigitPhone(digits)) return `${label} must contain exactly 10 digits.`;
  if (FAKE_PHONE_NUMBERS.has(digits)) return `${label} appears to be fake or a test number.`;
  if (/^[01]/.test(digits.slice(0, 3))) return 'Invalid US area code.';
  if (/^[01]/.test(digits.slice(3, 6))) return 'Invalid US exchange code.';

  return null;
};

export const normalizeText = (value?: string | null) =>
  (value || '').trim().toLowerCase().replace(/\s+/g, ' ');

export const composeAddress = (values: {
  streetAddress?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  address?: string | null;
}) => {
  const parts = [values.streetAddress, values.city, values.state, values.zipCode]
    .map(part => (part || '').trim())
    .filter(Boolean);

  return parts.length > 0 ? parts.join(', ') : (values.address || '').trim();
};

export const normalizeAddress = (values: {
  streetAddress?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  address?: string | null;
}) =>
  composeAddress(values)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');

export const getFieldValue = (fields: unknown, key: string) => {
  if (!fields || typeof fields !== 'object') return '';

  if (Array.isArray(fields)) {
    const match = fields.find((field: any) => field?.key === key);
    return typeof match?.value === 'string' ? match.value : '';
  }

  const value = (fields as Record<string, unknown>)[key];
  return typeof value === 'string' ? value : '';
};

export const getWitnessDetails = (fields: unknown) => ({
  name:
    getFieldValue(fields, WITNESS_NAME_KEY) ||
    getFieldValue(fields, LEGACY_WITNESS_NAME_KEY),
  phone:
    getFieldValue(fields, WITNESS_PHONE_KEY) ||
    getFieldValue(fields, LEGACY_WITNESS_PHONE_KEY),
});

export const validateLeadPayload = (body: any) => {
  const errors: string[] = [];
  const applicationType = body?.applicationType;
  const fields = body?.fields || {};

  if (!applicationType) errors.push('Application type is required.');
  if (!normalizeText(body?.firstName)) errors.push('First name is required.');
  if (!normalizeText(body?.lastName)) errors.push('Last name is required.');
  if (!normalizeEmail(body?.email)) errors.push('Email address is required.');
  if (!normalizeText(body?.streetAddress)) errors.push('Street Address is required.');
  if (!normalizeText(body?.city)) errors.push('City is required.');
  if (!normalizeText(body?.state)) errors.push('State is required.');
  if (!normalizeText(body?.zipCode)) errors.push('Zip Code is required.');

  const phoneError = validateUSPhoneNumber(body?.phone, 'Phone number');
  if (phoneError) errors.push(phoneError);

  const dynamicFieldsConfig = DYNAMIC_FIELDS[applicationType] || [];
  const isJuvenileAbuse = applicationType === 'Juvenile Detention Center (JDC)';
  const requiredFields = isJuvenileAbuse
    ? dynamicFieldsConfig.filter(field => field.key === 'Location Of Incident')
    : dynamicFieldsConfig.filter(field => field.required);

  requiredFields.forEach(field => {
    if (!getFieldValue(fields, field.key).trim()) {
      errors.push(`${field.label} is required.`);
    }
  });

  dynamicFieldsConfig
    .filter(field => field.type === 'phone')
    .forEach(field => {
      const value = getFieldValue(fields, field.key).trim();
      const fieldError = value ? validateUSPhoneNumber(value, field.label) : null;
      if (fieldError) errors.push(fieldError);
    });

  if (applicationType === 'Rideshare' || applicationType === 'Roblox') {
    const witness = getWitnessDetails(fields);
    if (!witness.name.trim()) errors.push('Witness Name is required.');
    if (!witness.phone.trim()) {
      errors.push('Witness Number is required.');
    } else {
      const witnessError = validateUSPhoneNumber(witness.phone, 'Witness Number');
      if (witnessError) errors.push(witnessError);
    }
  }

  return errors;
};

export const buildFieldsArray = (fields: unknown) => {
  if (!fields || typeof fields !== 'object' || Array.isArray(fields)) return [];

  return Object.entries(fields)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => ({ key, value: String(value) }));
};
