
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { USER_OPTIONS, CONSUMER_CATEGORIES_OPTIONS, METER_PHASES, CONSUMER_LOAD_TYPES, ROOF_TYPES, DISCOM_OPTIONS } from '@/lib/constants';
import type { SiteSurveyFormValues, ConsumerCategoryType, MeterPhaseType, ConsumerLoadType, RoofType, DiscomType, UserOptionType } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { format, isValid, parseISO } from 'date-fns';
import { ClipboardEdit, IndianRupee, UploadCloud } from 'lucide-react';

const siteSurveySchema = z.object({
  consumerName: z.string().min(2, { message: 'Consumer name must be at least 2 characters.' }),
  date: z.string().refine((val) => isValid(parseISO(val)), { message: "A valid date is required." }),
  consumerCategory: z.enum(CONSUMER_CATEGORIES_OPTIONS, { required_error: "Consumer category is required." }),
  location: z.string().min(3, { message: 'Location must be at least 3 characters.' }),
  numberOfMeters: z.coerce.number().int().positive({ message: 'Number of meters must be a positive integer.' }),
  meterRating: z.string().optional(),
  meterPhase: z.enum(METER_PHASES).optional(),
  electricityAmount: z.coerce.number().optional(),
  consumerLoadType: z.enum(CONSUMER_LOAD_TYPES, { required_error: "Consumer load type is required." }),
  roofType: z.enum(ROOF_TYPES, { required_error: "Type of roof is required." }),
  buildingHeight: z.string().min(1, { message: "Building height is required." }),
  shadowFreeArea: z.string().min(1, { message: "Shadow free area is required." }),
  discom: z.enum(DISCOM_OPTIONS, { required_error: "Discom is required." }),
  sanctionedLoad: z.string().optional(),
  remark: z.string().optional(),
  surveyorName: z.enum(USER_OPTIONS, { required_error: "Surveyor name is required." }),
  electricityBillFile: z.instanceof(FileList).optional().nullable()
    .refine(files => !files || files.length === 0 || files[0].size <= 5 * 1024 * 1024, `Max file size is 5MB.`)
    .refine(files => !files || files.length === 0 || ['image/jpeg', 'image/png', 'application/pdf'].includes(files[0].type), '.jpg, .png, or .pdf files are accepted.'),
});

export default function SiteSurveyPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SiteSurveyFormValues>({
    resolver: zodResolver(siteSurveySchema),
    defaultValues: {
      consumerName: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      consumerCategory: undefined,
      location: '',
      numberOfMeters: 1,
      meterRating: '',
      meterPhase: undefined,
      electricityAmount: undefined,
      consumerLoadType: undefined,
      roofType: undefined,
      buildingHeight: '',
      shadowFreeArea: '',
      discom: undefined,
      sanctionedLoad: '',
      remark: '',
      surveyorName: undefined,
      electricityBillFile: null,
    },
  });

  const onSubmit = (values: SiteSurveyFormValues) => {
    setIsSubmitting(true);
    console.log('Site Survey Form Submitted:', values);
    // In a real app, handle file upload here
    const submittedData = { ...values, electricityBillFile: values.electricityBillFile?.[0]?.name };
    toast({
      title: 'Survey Data Submitted',
      description: `Survey for ${values.consumerName} recorded. Bill: ${submittedData.electricityBillFile || 'Not uploaded'}.`,
    });
    form.reset();
    setIsSubmitting(false);
  };

  return (
    <>
      <PageHeader
        title="Site Survey Form"
        description="Fill in the details for the site survey."
        icon={ClipboardEdit}
      />
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Survey Details</CardTitle>
          <CardDescription>Please provide accurate information.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="consumerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Consumer Name</FormLabel>
                      <FormControl><Input placeholder="Enter consumer name" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Survey</FormLabel>
                      <FormControl><Input type="date" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="consumerCategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Consumer Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {CONSUMER_CATEGORIES_OPTIONS.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl><Textarea placeholder="Enter full site address" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="numberOfMeters"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Meters</FormLabel>
                      <FormControl><Input type="number" placeholder="e.g., 1" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="meterRating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meter Rating (Optional)</FormLabel>
                      <FormControl><Input placeholder="e.g., 5-30A" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="meterPhase"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meter Phase (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select phase" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {METER_PHASES.map(phase => <SelectItem key={phase} value={phase}>{phase}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                 <FormField
                  control={form.control}
                  name="electricityAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Avg. Electricity Bill Amount (₹) (Optional)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input type="number" placeholder="0.00" className="pl-8" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="consumerLoadType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Consumer Load Type (LT/HT)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select load type" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {CONSUMER_LOAD_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="roofType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type of Roof</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select roof type" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {ROOF_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="buildingHeight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Height of Building (e.g., G+2)</FormLabel>
                      <FormControl><Input placeholder="e.g., G+2 or 30ft" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="shadowFreeArea"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shadow Free Area (sq.ft.)</FormLabel>
                      <FormControl><Input placeholder="e.g., 500 sq.ft." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="discom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>DISCOM</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select DISCOM" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {DISCOM_OPTIONS.map(discom => <SelectItem key={discom} value={discom}>{discom}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sanctionedLoad"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sanctioned Load (kW/kVA) (Optional)</FormLabel>
                      <FormControl><Input placeholder="e.g., 10 kW or 15 kVA" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="remark"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Remark (Optional)</FormLabel>
                    <FormControl><Textarea placeholder="Any additional remarks..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="surveyorName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Surveyor Name</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select surveyor" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {USER_OPTIONS.map(user => <SelectItem key={user} value={user}>{user}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="electricityBillFile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Upload Electricity Bill (Optional)</FormLabel>
                    <FormControl>
                        <div className="flex items-center justify-center w-full">
                            <label htmlFor="dropzone-file-bill" className="flex flex-col items-center justify-center w-full h-32 border-2 border-border border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <UploadCloud className="w-8 h-8 mb-2 text-muted-foreground" />
                                    <p className="mb-1 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                    <p className="text-xs text-muted-foreground">PDF, PNG, JPG (MAX. 5MB)</p>
                                </div>
                                <Input 
                                  id="dropzone-file-bill" 
                                  type="file" 
                                  className="hidden" 
                                  accept=".pdf,.png,.jpg,.jpeg"
                                  onChange={(e) => field.onChange(e.target.files)} 
                                />
                            </label>
                        </div> 
                    </FormControl>
                    {field.value && field.value[0] && <p className="text-xs text-muted-foreground mt-1">File: {field.value[0].name}</p>}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full md:w-auto" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Survey'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      <div className="mt-8">
        <img src="https://placehold.co/1200x300.png" data-ai-hint="site survey solar" alt="Site Survey for Solar Installation" className="w-full rounded-lg object-cover"/>
      </div>
    </>
  );
}
