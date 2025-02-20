import { useEffect, useState } from 'react';
import { MainNavigation } from 'components/MainNavigation';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMonthlyIncomeStore, useMonthlyCreditCardStore, useMonthlyFixedExpenseStatusStore } from 'utils/monthlyStore';
import { useVariableExpenseStore } from 'utils/variableExpenseStore';
import { useFixedExpenseStore, useCategoryStore } from 'utils/store';
import { Input } from '@/components/ui/input';
import { NumberInput } from 'components/NumberInput';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

export default function MonthlyDetails() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  // Get year and month from URL or use current date
  const year = parseInt(searchParams.get('year') || currentYear.toString());
  const month = parseInt(searchParams.get('month') || (currentMonth + 1).toString());

  const {
    monthlyIncome,
    loading: incomeLoading,
    error: incomeError,
    fetchMonthlyIncome,
    loadDefaultIncome,
    updateMonthlyIncome,
    subscribeToMonthlyIncome,
  } = useMonthlyIncomeStore();

  // Monthly Credit Card Store
  const {
    monthlyCreditCard,
    loading: creditCardLoading,
    error: creditCardError,
    fetchMonthlyCreditCard,
    updateMonthlyCreditCard,
    subscribeToMonthlyCreditCard,
  } = useMonthlyCreditCardStore();

  // Monthly Fixed Expense Status Store
  const {
    monthlyFixedExpenseStatuses,
    loading: statusLoading,
    error: statusError,
    fetchMonthlyFixedExpenseStatuses,
    initializeMonthlyFixedExpenses,
    updateMonthlyFixedExpenseStatus,
    subscribeToMonthlyFixedExpenseStatuses,
  } = useMonthlyFixedExpenseStatusStore();

  // Fixed Expenses Store
  const { fixedExpenses, loading: fixedExpensesLoading } = useFixedExpenseStore();

  // Variable Expenses Store
  const {
    variableExpenses,
    loading: variableExpensesLoading,
    error: variableExpensesError,
    fetchVariableExpenses,
    createVariableExpense,
    updateVariableExpense,
    deleteVariableExpense,
    subscribeToVariableExpenses,
  } = useVariableExpenseStore();

  // Categories Store
  const { categories } = useCategoryStore();

  // Variable Expense Form Schema
  const variableExpenseSchema = z.object({
    category_id: z.string().min(1, 'Category is required'),
    description: z.string().min(1, 'Description is required'),
    amount: z.string().min(1, 'Amount is required'),
    date: z.string().min(1, 'Date is required'),
  });

  // Variable Expense Form
  const form = useForm<z.infer<typeof variableExpenseSchema>>({
    resolver: zodResolver(variableExpenseSchema),
    defaultValues: {
      category_id: '',
      description: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
    },
  });

  const [editingExpense, setEditingExpense] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    // Fetch initial data
    fetchMonthlyIncome(year, month);
    fetchMonthlyCreditCard(year, month);
    fetchMonthlyFixedExpenseStatuses(year, month);
    initializeMonthlyFixedExpenses(year, month);
    fetchVariableExpenses(year, month);

    // Subscribe to real-time updates
    const unsubIncome = subscribeToMonthlyIncome(year, month);
    const unsubCreditCard = subscribeToMonthlyCreditCard(year, month);
    const unsubStatus = subscribeToMonthlyFixedExpenseStatuses(year, month);
    const unsubVariableExpenses = subscribeToVariableExpenses(year, month);

    return () => {
      unsubIncome();
      unsubCreditCard();
      unsubStatus();
      unsubVariableExpenses();
    };
  }, [year, month]);

  const handleIncomeUpdate = (field: 'lucas_income' | 'camila_income' | 'other_income', value: string) => {
    if (!monthlyIncome) return;

    const numericValue = parseFloat(value) || 0;
    updateMonthlyIncome(year, month, {
      ...monthlyIncome,
      [field]: numericValue,
    });
  };

  const handleCreditCardUpdate = (value: string) => {
    const numericValue = parseFloat(value) || 0;
    updateMonthlyCreditCard(year, month, numericValue);
  };

  const onSubmit = async (data: z.infer<typeof variableExpenseSchema>) => {
    if (editingExpense) {
      await updateVariableExpense(editingExpense, {
        category_id: data.category_id,
        description: data.description,
        amount: parseFloat(data.amount),
        date: data.date,
      });
    } else {
      await createVariableExpense({
        year,
        month,
        category_id: data.category_id,
        description: data.description,
        amount: parseFloat(data.amount),
        date: data.date,
      });
    }

    form.reset();
    setEditingExpense(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (expense: typeof variableExpenses[0]) => {
    form.reset({
      category_id: expense.category_id,
      description: expense.description,
      amount: expense.amount.toString(),
      date: expense.date,
    });
    setEditingExpense(expense.id);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this expense?')) {
      await deleteVariableExpense(id);
    }
  };

  const handleStatusUpdate = (id: string, completed: boolean) => {
    updateMonthlyFixedExpenseStatus(id, completed);
  };

  const requiredTasks = monthlyFixedExpenseStatuses.filter(status => {
    const fixedExpense = fixedExpenses.find(fe => fe.id === status.fixed_expense_id);
    return fixedExpense?.status_required;
  });

  const completedTasks = requiredTasks.filter(status => status.completed);

  const handleYearChange = (value: string) => {
    navigate(`/MonthlyDetails?year=${value}&month=${month}`);
  };

  const handleMonthChange = (value: string) => {
    navigate(`/MonthlyDetails?year=${year}&month=${parseInt(value) + 1}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <MainNavigation />
      <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Monthly Details</h1>

        <div className="flex items-center gap-4">
          <Select value={year.toString()} onValueChange={handleYearChange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {YEARS.map((y) => (
                <SelectItem key={y} value={y.toString()}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={(month - 1).toString()} onValueChange={handleMonthChange}>
        <TabsList className="grid grid-cols-6 lg:grid-cols-12">
          {MONTHS.map((m, i) => (
            <TabsTrigger key={m} value={i.toString()} className="text-xs sm:text-sm">
              {m.slice(0, 3)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Monthly Income Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Monthly Income</span>
              <Button
                variant="outline"
                onClick={() => loadDefaultIncome(year, month)}
                disabled={incomeLoading}
              >
                Load Defaults
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {incomeError && (
              <Alert variant="destructive">
                <AlertDescription>{incomeError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Lucas Income</label>
              <NumberInput
                value={monthlyIncome?.lucas_income || 0}
                onChange={(value) => handleIncomeUpdate('lucas_income', value.toString())}
                disabled={incomeLoading}
                min={0}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Camila Income</label>
              <NumberInput
                value={monthlyIncome?.camila_income || 0}
                onChange={(value) => handleIncomeUpdate('camila_income', value.toString())}
                disabled={incomeLoading}
                min={0}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Other Income</label>
              <NumberInput
                value={monthlyIncome?.other_income || 0}
                onChange={(value) => handleIncomeUpdate('other_income', value.toString())}
                disabled={incomeLoading}
                min={0}
              />
            </div>
          </CardContent>
        </Card>

      {/* Variable Expenses Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Variable Expenses</span>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    setEditingExpense(null);
                    form.reset();
                  }}
                >
                  Add Expense
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingExpense ? 'Edit' : 'Add'} Variable Expense</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="category_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem key={category.id} value={category.id}>
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
                            <Input {...field} />
                          </FormControl>
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
                            <Input type="number" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full">
                      {editingExpense ? 'Update' : 'Add'} Expense
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {variableExpensesError && (
            <Alert variant="destructive">
              <AlertDescription>{variableExpensesError}</AlertDescription>
            </Alert>
          )}
          <div className="relative">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {variableExpenses.map((expense) => {
                  const category = categories.find(c => c.id === expense.category_id);
                  return (
                    <TableRow key={expense.id}>
                      <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                      <TableCell>{category?.name}</TableCell>
                      <TableCell>{expense.description}</TableCell>
                      <TableCell className="text-right">
                        {expense.amount.toLocaleString('en-US', { style: 'currency', currency: 'EUR' })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(expense)}
                          className="mr-2"
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(expense.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {variableExpenses.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">
                      No expenses found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardContent className="border-t pt-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              Total Variable Expenses:
            </span>
            <span className="font-medium">
              {variableExpenses
                .reduce((sum, expense) => sum + expense.amount, 0)
                .toLocaleString('en-US', { style: 'currency', currency: 'EUR' })}
            </span>
          </div>
        </CardContent>
      </Card>

        {/* Credit Card Bill Card */}
        <Card>
          <CardHeader>
            <CardTitle>Credit Card Bill</CardTitle>
          </CardHeader>
          <CardContent>
            {creditCardError && (
              <Alert variant="destructive">
                <AlertDescription>{creditCardError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount</label>
              <NumberInput
                value={monthlyCreditCard?.amount || 0}
                onChange={(value) => handleCreditCardUpdate(value.toString())}
                disabled={creditCardLoading}
                min={0}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fixed Expenses Status Card */}
      <Card>
        <CardHeader>
          <CardTitle>
            Fixed Expenses Status
            {requiredTasks.length > 0 && (
              <span className="text-sm font-normal ml-2">
                ({completedTasks.length} of {requiredTasks.length} tasks completed)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {statusError && (
            <Alert variant="destructive">
              <AlertDescription>{statusError}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-4">
            {monthlyFixedExpenseStatuses.map((status) => {
              const fixedExpense = fixedExpenses.find(fe => fe.id === status.fixed_expense_id);
              if (!fixedExpense) return null;

              return (
                <div key={status.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {fixedExpense.status_required && (
                      <Checkbox
                        checked={status.completed}
                        onCheckedChange={(checked) => handleStatusUpdate(status.id, checked as boolean)}
                        disabled={statusLoading}
                      />
                    )}
                    <div>
                      <p className="font-medium">{fixedExpense.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {fixedExpense.owner} - {fixedExpense.estimated_amount.toLocaleString('en-US', { style: 'currency', currency: 'EUR' })}
                      </p>
                    </div>
                  </div>
                  {status.completed && (
                    <span className="text-sm text-muted-foreground">
                      Completed {new Date(status.completed_at!).toLocaleDateString()}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
