
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { IndianRupee, Receipt, UploadCloud, Eye } from 'lucide-react';
import { EXPENSE_CATEGORIES, MOCK_EXPENSES, USER_OPTIONS } from '@/lib/constants';
import type { Expense, ExpenseCategory, ExpenseStatus } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO, isValid } from 'date-fns';
import { Badge } from '@/components/ui/badge';

const expenseSchema = z.object({
  date: z.string().refine((val) => isValid(parseISO(val)), { message: "A valid date is required." }),
  category: z.enum(EXPENSE_CATEGORIES, { required_error: "Category is required." }),
  amount: z.coerce.number().positive({ message: 'Amount must be positive and greater than 0.' }),
  description: z.string().min(5, { message: 'Description must be at least 5 characters long.' }),
  receipt: z.any().optional(), // Placeholder for file input
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

export default function ExpensesPage() {
  const [submittedExpenses, setSubmittedExpenses] = useState<Expense[]>(MOCK_EXPENSES);
  const { toast } = useToast();

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      category: undefined,
      amount: 0,
      description: '',
      receipt: undefined,
    },
  });

  const onSubmit = (values: ExpenseFormValues) => {
    console.log('Expense Submitted:', values);
    const newExpense: Expense = {
      id: `exp-${Date.now()}`,
      userId: 'currentUser', // In a real app, get current user ID
      userName: USER_OPTIONS[Math.floor(Math.random() * USER_OPTIONS.length)], // Mock user name
      date: values.date,
      category: values.category,
      amount: values.amount,
      description: values.description,
      // receiptUrl: 'mock-receipt.pdf', // Placeholder
      status: 'Pending',
      submittedAt: new Date().toISOString(),
    };
    setSubmittedExpenses(prev => [newExpense, ...prev]);
    toast({
      title: 'Expense Submitted',
      description: `${values.category} expense of ₹${values.amount} submitted for review.`,
    });
    form.reset({ 
        date: format(new Date(), 'yyyy-MM-dd'), 
        category: undefined, 
        amount: 0, 
        description: '',
        receipt: undefined 
    });
  };

  const getStatusBadgeVariant = (status: ExpenseStatus) => {
    switch (status) {
      case 'Approved': return 'default'; // Or 'success' if you add that variant
      case 'Pending': return 'secondary';
      case 'Rejected': return 'destructive';
      default: return 'outline';
    }
  };


  return (
    <>
      <PageHeader
        title="Manage Expenses"
        description="Submit new expenses and view the status of your submissions."
        icon={Receipt}
      />

      <div className="grid lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Submit New Expense</CardTitle>
            <CardDescription>Fill out the form to record a new expense.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Expense</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select expense category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {EXPENSE_CATEGORIES.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
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
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Detailed description of the expense..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="receipt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Upload Receipt (Optional)</FormLabel>
                      <FormControl>
                        <div className="flex items-center justify-center w-full">
                            <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-border border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <UploadCloud className="w-8 h-8 mb-2 text-muted-foreground" />
                                    <p className="mb-1 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                    <p className="text-xs text-muted-foreground">PNG, JPG, PDF (MAX. 5MB)</p>
                                </div>
                                <Input id="dropzone-file" type="file" className="hidden" onChange={(e) => field.onChange(e.target.files?.[0])} />
                            </label>
                        </div> 
                      </FormControl>
                      {field.value && <p className="text-xs text-muted-foreground mt-1">File: {(field.value as File).name}</p>}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Submitting...' : 'Submit Expense'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>My Submitted Expenses</CardTitle>
            <CardDescription>A list of your recently submitted expenses and their status.</CardDescription>
          </CardHeader>
          <CardContent>
            {submittedExpenses.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                    <Receipt className="mx-auto h-12 w-12 mb-4" />
                    <p>No expenses submitted yet.</p>
                </div>
            ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Submitted By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submittedExpenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>{format(parseISO(expense.date), 'dd MMM, yyyy')}</TableCell>
                    <TableCell>{expense.category}</TableCell>
                    <TableCell className="text-right font-medium">₹{expense.amount.toFixed(2)}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{expense.description}</TableCell>
                    <TableCell>{expense.userName || expense.userId}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(expense.status)}>{expense.status}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button variant="ghost" size="icon" disabled={!expense.receiptUrl} title="View Receipt (Coming Soon)">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
