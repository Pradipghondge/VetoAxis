'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FieldErrors, useForm } from 'react-hook-form';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Loader2,
  ArrowLeft,
  User,
  ClipboardList,
  Save,
  Check,
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';
import { DYNAMIC_FIELDS } from '@/lib/dynamic-fields';
import { normalizePhone, validateUSPhoneNumber } from '@/lib/lead-utils';

const APPLICATION_TYPES = Object.keys(DYNAMIC_FIELDS);

const formSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().superRefine((value, ctx) => {
    const error = validateUSPhoneNumber(value);
    if (error) ctx.addIssue({ code: 'custom', message: error });
  }),
  dateOfBirth: z.string().optional(),
  streetAddress: z.string().min(1, 'Street Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zipCode: z.string().min(1, 'ZIP code is required').regex(/^\d{5}(-\d{4})?$/, 'ZIP code format is incorrect.'),
  applicationType: z.string().min(1, 'Application type is required'),
  lawsuit: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const FORM_FIELD_LABELS: Record<keyof FormValues, string> = {
  firstName: 'First name',
  lastName: 'Last name',
  email: 'Email',
  phone: 'Phone number',
  dateOfBirth: 'Date of birth',
  streetAddress: 'Street Address',
  city: 'City',
  state: 'State',
  zipCode: 'ZIP code',
  applicationType: 'Application type',
  lawsuit: 'Lawsuit',
  notes: 'Notes',
};

export default function PublicLeadPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [selectedType, setSelectedType] = useState('');
  const [dynamicFields, setDynamicFields] = useState<Record<string, any>>({});
  const [dynamicErrors, setDynamicErrors] = useState<Record<string, string>>({});

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      streetAddress: '',
      city: '',
      state: '',
      zipCode: '',
      applicationType: '',
      lawsuit: '',
      notes: '',
    },
  });

  const formatToMMDDYYYY = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${month}/${day}/${year}`;
  };

  const onSubmit = async (values: FormValues) => {
    const requiredDynamicFields =
      selectedType === 'Juvenile Detention Center (JDC)'
        ? (DYNAMIC_FIELDS[selectedType] || []).filter(f => f.key === 'Location Of Incident')
        : (DYNAMIC_FIELDS[selectedType] || []).filter(f => f.required);

    const missingFields = requiredDynamicFields.filter(
      f => !dynamicFields[f.key]
    );
    const invalidPhoneFields = (DYNAMIC_FIELDS[selectedType] || [])
      .filter(f => f.type === 'phone')
      .map(f => ({
        label: f.label,
        error: dynamicFields[f.key] ? validateUSPhoneNumber(dynamicFields[f.key], f.label) : null,
      }))
      .filter(f => f.error);

    if (missingFields.length > 0) {
      toast({
        title: 'Error',
        description: `Please fill out: ${missingFields
          .map(f => f.label)
          .join(', ')}`,
        variant: 'destructive',
      });
      return;
    }

    if (invalidPhoneFields.length > 0) {
      toast({
        title: 'Error',
        description: invalidPhoneFields.map(f => f.error).join(' '),
        variant: 'destructive',
      });
      return;
    }

    setDynamicErrors({});
    setLoading(true);
    try {
      const formattedDOB = values.dateOfBirth
        ? formatToMMDDYYYY(values.dateOfBirth)
        : undefined;

      const formattedDynamicFields = { ...dynamicFields };
      (DYNAMIC_FIELDS[selectedType] || []).forEach(field => {
        if (field.type === 'date' && formattedDynamicFields[field.key]) {
          formattedDynamicFields[field.key] = formatToMMDDYYYY(
            formattedDynamicFields[field.key]
          );
        }
      });

      const { data } = await axios.post('/api/leads', {
        ...values,
        dateOfBirth: formattedDOB,
        fields: formattedDynamicFields,
        status: 'PENDING',
      });

      setSubmitted(true);
      toast({
        title: data.isDuplicate ? 'Duplicate Lead' : 'Success',
        description: data.message || 'Lead created successfully',
      });
      setTimeout(() => router.push('/leads'), 1500);
    } catch (error: any) {
      const fieldErrors = error.response?.data?.fieldErrors || error.response?.data?.errors || [];
      const nextDynamicErrors: Record<string, string> = {};

      fieldErrors.forEach((fieldError: { field?: string; message?: string }) => {
        if (!fieldError?.field || !fieldError?.message) return;
        if (fieldError.field.startsWith('fields.')) {
          nextDynamicErrors[fieldError.field.replace('fields.', '')] = fieldError.message;
          return;
        }

        if (fieldError.field in form.getValues()) {
          form.setError(fieldError.field as keyof FormValues, { type: 'server', message: fieldError.message });
        }
      });

      setDynamicErrors(nextDynamicErrors);
      toast({
        title: 'Error',
        description:
          error.response?.data?.message || 'Failed to create Lead',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  const onInvalidSubmit = (errors: FieldErrors<FormValues>) => {
    const firstMessage = Object.values(errors).find(error => error?.message)?.message;
    const missingFields = Object.entries(errors)
      .filter(([, error]) => typeof error?.message === 'string' && error.message.toLowerCase().includes('required'))
      .map(([field]) => FORM_FIELD_LABELS[field as keyof FormValues] || field);

    toast({
      title: 'Action Required',
      description: missingFields.length > 0
        ? `Please fill out: ${missingFields.join(', ')}.`
        : String(firstMessage || 'Please correct the highlighted fields.'),
      variant: 'warning',
    });
  };

  const renderDynamicFields = () =>
    (DYNAMIC_FIELDS[selectedType] || []).map(field => (
      <FormItem key={field.key}>
        <FormLabel className="text-sm">
          {field.label}
          {(selectedType === 'Juvenile Detention Center (JDC)'
            ? field.key === 'Location Of Incident'
            : field.required) && '*'}
        </FormLabel>
        <FormControl>
          {field.type === 'textarea' ? (
            <Textarea
              value={dynamicFields[field.key] || ''}
              onChange={e => {
                setDynamicErrors(p => ({ ...p, [field.key]: '' }));
                setDynamicFields(p => ({
                  ...p,
                  [field.key]: e.target.value,
                }));
              }}
              className={dynamicErrors[field.key] ? 'border-destructive focus-visible:ring-destructive' : ''}
            />
          ) : (
            <Input
              type={field.type === 'phone' ? 'text' : field.type}
              inputMode={field.type === 'phone' ? 'numeric' : undefined}
              maxLength={field.type === 'phone' ? 10 : undefined}
              placeholder={
                selectedType === 'Juvenile Detention Center (JDC)' && field.key === 'Location Of Incident'
                  ? 'Enter Juvenile Detention Center (JDC) name'
                  : undefined
              }
              value={dynamicFields[field.key] || ''}
              onChange={e => {
                setDynamicErrors(p => ({ ...p, [field.key]: '' }));
                setDynamicFields(p => ({
                  ...p,
                  [field.key]: field.type === 'phone' ? normalizePhone(e.target.value).slice(0, 10) : e.target.value,
                }));
              }}
              className={dynamicErrors[field.key] ? 'border-destructive focus-visible:ring-destructive' : ''}
            />
          )}
        </FormControl>
        {dynamicErrors[field.key] && (
          <p className="text-sm font-medium text-destructive">{dynamicErrors[field.key]}</p>
        )}
      </FormItem>
    ));

  if (submitted) {
    return (
      <DashboardLayout hideSidebar>
        <div className="flex justify-center items-center min-h-[70vh]">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <Check className="mx-auto h-10 w-10 text-green-500" />
            <h2 className="text-xl font-semibold mt-4">
              Lead Profile Created
            </h2>
            <Button className="mt-6" onClick={() => router.push('/leads')}>
              View All Leads
            </Button>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout hideSidebar>
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-semibold">New Lead Profile</h1>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, onInvalidSubmit)} className="space-y-6">

            {/* Client Details */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  <CardTitle>Client Details</CardTitle>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {['firstName', 'lastName', 'email', 'phone', 'dateOfBirth', 'streetAddress', 'city', 'state', 'zipCode'].map(name => (
                  <FormField
                    key={name}
                    control={form.control}
                    name={name as keyof FormValues}
                    render={({ field }) => (
                      <FormItem className={name === 'streetAddress' ? 'md:col-span-2' : ''}>
                        <FormLabel>
                          {name.replace(/([A-Z])/g, ' $1')}
                          {(name === 'firstName' || name === 'lastName' || name === 'phone' || name === 'streetAddress' || name === 'city' || name === 'state' || name === 'zipCode') && '*'}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type={name === 'dateOfBirth' ? 'date' : 'text'}
                            inputMode={name === 'phone' || name === 'zipCode' ? 'numeric' : undefined}
                            maxLength={name === 'phone' ? 10 : undefined}
                            {...field}
                            onChange={(event) => {
                              field.onChange(name === 'phone' ? normalizePhone(event.target.value).slice(0, 10) : event.target.value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </CardContent>
            </Card>

            {/* Case Info */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" />
                  <CardTitle>Case Information</CardTitle>
                </div>
              </CardHeader>
              <Separator />
              <CardContent>
                <FormField
                  control={form.control}
                  name="applicationType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Application Type*</FormLabel>
                      <Select
                        onValueChange={val => {
                          field.onChange(val);
                          setSelectedType(val);
                          setDynamicFields({});
                          setDynamicErrors({});
                        }}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select application type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {APPLICATION_TYPES.map(type => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Case Specific */}
            {selectedType && (
              <Card>
                <CardHeader>
                  <CardTitle>Case-Specific Information</CardTitle>
                  <CardDescription>
                    Details for: {selectedType}
                  </CardDescription>
                </CardHeader>
                <Separator />
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderDynamicFields()}
                </CardContent>
              </Card>
            )}

            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : <Save />}
              Save Lead
            </Button>

          </form>
        </Form>
      </div>
    </DashboardLayout>
  );
}
