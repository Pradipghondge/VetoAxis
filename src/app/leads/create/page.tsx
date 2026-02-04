'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
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
  FormDescription
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Loader2,
  ArrowLeft,
  User,
  ClipboardList,
  Save,
  Check
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';
import { DYNAMIC_FIELDS } from '@/lib/dynamic-fields';

const APPLICATION_TYPES = Object.keys(DYNAMIC_FIELDS);

const formSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  applicationType: z.string().min(1, 'Application type is required'),
  lawsuit: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function CreateLeadPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('');
  const [dynamicFields, setDynamicFields] = useState<Record<string, any>>({});

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      address: '',
      applicationType: '',
      lawsuit: '',
      notes: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    const requiredDynamicFields = (DYNAMIC_FIELDS[selectedType] || []).filter(field => field.required);
    const missingFields = requiredDynamicFields.filter(field => !dynamicFields[field.key]);

    if (missingFields.length > 0) {
      toast({
        title: 'Error',
        description: `Please fill out all required fields: ${missingFields.map(f => f.label).join(', ')}`,
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      await axios.post('/api/leads', {
        ...values,
        fields: dynamicFields,
        status: 'PENDING',
      });

      setSubmitted(true);
      toast({ title: 'Success', description: 'Lead created successfully' });
      setTimeout(() => router.push('/leads'), 1500);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create Lead',
        variant: 'destructive'
      });
      setLoading(false);
    }
  };

  const handleDynamicFieldChange = (key: string, value: any) => {
    setDynamicFields(prev => ({ ...prev, [key]: value }));
  };

  const renderDynamicFields = () => {
    const fields = DYNAMIC_FIELDS[selectedType] || [];
    return fields.map(field => {
      let inputComponent;
      if (field.type === 'text' || field.type === 'email' || field.type === 'phone') {
        inputComponent = (
          <Input
            type={field.type}
            value={dynamicFields[field.key] || ''}
            onChange={e => handleDynamicFieldChange(field.key, e.target.value)}
            placeholder={`Enter ${field.label.toLowerCase()}`}
          />
        );
      } else if (field.type === 'date') {
        inputComponent = (
          <Input
            type="text"
            value={dynamicFields[field.key] || ''}
            onChange={e => handleDynamicFieldChange(field.key, e.target.value)}
            placeholder="MM/DD/YYYY"
          />
        );
      } else if (field.type === 'textarea') {
        inputComponent = (
          <Textarea
            value={dynamicFields[field.key] || ''}
            onChange={e => handleDynamicFieldChange(field.key, e.target.value)}
            placeholder={`Enter ${field.label.toLowerCase()}`}
          />
        );
      } else {
        const options = field.options || [
          { label: 'Yes', value: 'Yes' },
          { label: 'No', value: 'No' }
        ];
        inputComponent = (
          <Select
            value={dynamicFields[field.key] || ''}
            onValueChange={val => handleDynamicFieldChange(field.key, val)}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      }

      return (
        <FormItem key={field.key}>
          <FormLabel>{field.label}{field.required && '*'}</FormLabel>
          <FormControl>
            {inputComponent}
          </FormControl>
          <FormMessage />
        </FormItem>
      );
    });
  };

  if (submitted) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center min-h-[70vh] px-4">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md w-full">
            <div className="bg-green-100 dark:bg-green-900/20 p-3 rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center">
              <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl md:text-2xl font-semibold mb-2">Lead Profile Created</h2>
            <p className="text-sm md:text-base text-muted-foreground mb-6">The new lead has been successfully added to your pipeline.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="outline" onClick={() => router.push('/leads')} className="w-full sm:w-auto">View All Leads</Button>
              <Button onClick={() => { form.reset(); setSubmitted(false); setSelectedType(''); setDynamicFields({}); }} className="w-full sm:w-auto">Add Another</Button>
            </div>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 md:space-y-8 pb-20">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={() => router.back()} className="h-9 w-9 shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl md:text-2xl font-semibold tracking-tight">New Lead Profile</h1>
              <p className="text-xs md:text-sm text-muted-foreground">Capture new client details and case information.</p>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Base Details */}
            <Card className="rounded-xl md:rounded-2xl border shadow-sm bg-card/40 overflow-hidden">
              <CardHeader className="p-4 md:p-6">
                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-lg md:text-xl">Client Details</CardTitle>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {['first Name', 'last Name', 'email', 'phone', 'dateOfBirth', 'address'].map(fieldName => (
                  <FormField 
                    key={fieldName} 
                    control={form.control} 
                    name={fieldName as keyof FormValues} 
                    render={({ field }) => (
                      <FormItem className={fieldName === 'address' ? 'md:col-span-2' : ''}>
                        <FormLabel className="text-sm">
                          {fieldName === 'dateOfBirth' ? 'Date of Birth' :
                          fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}
                          {(fieldName === 'firstName' || fieldName === 'lastName') && '*'}
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type='text'
                            placeholder={fieldName === 'dateOfBirth' ? 'MM/DD/YYYY' : fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} 
                            {...field} 
                            className="h-10"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} 
                  />
                ))}
              </CardContent>
            </Card>

            {/* Case Information */}
            <Card className="rounded-xl md:rounded-2xl border shadow-sm bg-card/40 overflow-hidden">
              <CardHeader className="p-4 md:p-6">
                <div className="flex items-center space-x-2">
                  <ClipboardList className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-lg md:text-xl">Case Information</CardTitle>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <FormField control={form.control} name="applicationType" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Application Type*</FormLabel>
                    <Select
                      onValueChange={(val) => {
                        field.onChange(val);
                        setSelectedType(val);
                        setDynamicFields({});
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Select application type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {APPLICATION_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <div>
                  <FormLabel className="text-sm">Status</FormLabel>
                  <div className="flex items-center h-10 px-3 py-2 rounded-md border border-input bg-background text-sm">
                    <span className="text-muted-foreground mr-2">Default:</span>
                    <span className="font-semibold text-foreground text-xs md:text-sm">PENDING</span>
                  </div>
                  <p className="text-[10px] md:text-[11px] text-muted-foreground mt-2">
                    Status is set automatically.
                  </p>
                </div>

                

                <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormItem className="col-span-1 md:col-span-2">
                    <FormLabel className="text-sm">Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any additional notes about this lead"
                        {...field}
                        className="min-h-[100px] resize-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </CardContent>
            </Card>

            {/* Dynamic Fields */}
            {selectedType && DYNAMIC_FIELDS[selectedType] && (
              <Card className="rounded-xl md:rounded-2xl border shadow-sm bg-card/40 overflow-hidden">
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="text-lg md:text-xl">Case-Specific Information</CardTitle>
                  <CardDescription className="text-xs">
                    Details for: <span className="font-semibold text-foreground">{selectedType}</span>
                  </CardDescription>
                </CardHeader>
                <Separator />
                <CardContent className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  {renderDynamicFields()}
                </CardContent>
              </Card>
            )}

            {/* Form Actions */}
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => router.back()} 
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={loading} 
                className="w-full sm:min-w-[150px] gap-2 h-11 sm:h-10"
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />Creating...</>
                ) : (
                  <><Save className="h-4 w-4" />Save Lead</>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </DashboardLayout>
  );
}
