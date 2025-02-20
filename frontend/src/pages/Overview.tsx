import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainNavigation } from '../components/MainNavigation';
import { useAuthStore, useInvestmentStore, useReserveStore } from '../utils/store';
import { useBudgetComparisonStore } from '../utils/budgetComparisonStore';
import { useCategoryExpensesStore } from '../utils/categoryExpensesStore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function Overview() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuthStore();

  const {
    investments,
    loading: investmentsLoading,
    error: investmentsError,
    fetchInvestments,
    updateInvestment,
  } = useInvestmentStore();

  const {
    reserves,
    loading: reservesLoading,
    error: reservesError,
    fetchReserves,
    updateReserve,
  } = useReserveStore();

  useEffect(() => {
    fetchInvestments();
    fetchReserves();
  }, [fetchInvestments, fetchReserves]);

  const handleInvestmentUpdate = async (id: string, value: string) => {
    try {
      const numericValue = parseFloat(value);
      if (isNaN(numericValue)) {
        throw new Error('Please enter a valid number');
      }
      await updateInvestment(id, numericValue);
      toast.success('Investment updated successfully');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleReserveUpdate = async (id: string, value: string) => {
    try {
      const numericValue = parseFloat(value);
      if (isNaN(numericValue)) {
        throw new Error('Please enter a valid number');
      }
      await updateReserve(id, numericValue);
      toast.success('Reserve updated successfully');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const totalInvestments = investments.reduce((sum, inv) => sum + inv.current_value, 0);
  const totalReserves = reserves.reduce((sum, res) => sum + res.current_value, 0);
  // Budget Comparison Store
  const {
    monthlyComparisons,
    loading: comparisonsLoading,
    error: comparisonsError,
    fetchMonthlyComparisons,
  } = useBudgetComparisonStore();

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchMonthlyComparisons(selectedYear);
  }, [selectedYear, fetchMonthlyComparisons]);

  // Category Expenses Store
  const {
    expenses: categoryExpenses,
    loading: categoryExpensesLoading,
    error: categoryExpensesError,
    fetchCategoryExpenses,
    setSorting,
    sortBy,
    sortDirection,
  } = useCategoryExpensesStore();

  useEffect(() => {
    fetchCategoryExpenses(selectedYear);
  }, [selectedYear, fetchCategoryExpenses]);

  const totalBudget = totalInvestments + totalReserves;

  console.log('Loading states:', {
    authLoading,
    investmentsLoading,
    reservesLoading,
    comparisonsLoading,
    categoryExpensesLoading
  });
  console.log('User:', user);
  console.log('Session:', useAuthStore.getState().session);
  console.log('Investments:', investments);
  console.log('Reserves:', reserves);

  if (authLoading) {
    return (
    <div className="min-h-screen bg-background">
      <MainNavigation />
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600" />
        </div>
    </div>
    );
  }

  if (!user) {
    navigate('/Login', { replace: true });
    return null;
  }

  if (investmentsError || reservesError || categoryExpensesError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">
          {investmentsError || reservesError || categoryExpensesError}
        </div>
      </div>
    );
  }

  return (
      <div className="container mx-auto py-6 space-y-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Overview</h1>
        <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Select year" />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {/* Total Budget Tile */}
      <Card className="p-6">
        {(investmentsLoading || reservesLoading) && (
          <div className="flex items-center justify-center h-24">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600" />
          </div>
        )}
        <h2 className="text-2xl font-semibold mb-4">Total Budget</h2>
        <p className="text-4xl font-bold text-blue-600">
          €{totalBudget.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
        </p>
      </Card>

      {/* Investments Tile */}
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-4">Investments</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {investments.map((investment) => (
            <Card key={investment.id} className="p-4 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">{investment.name}</h3>
                <span className="text-sm text-muted-foreground">{investment.category}</span>
              </div>
              <div className="space-y-2">
                <Input
                  type="number"
                  defaultValue={investment.current_value}
                  onBlur={(e) => handleInvestmentUpdate(investment.id, e.target.value)}
                  step="0.01"
                  className="text-right"
                />
                <p className="text-xs text-muted-foreground text-right">
                  Last updated: {new Date(investment.last_updated).toLocaleString()}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      {/* Reserves Tile */}
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-4">Reserves</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reserves.map((reserve) => (
            <Card key={reserve.id} className="p-4 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">{reserve.name}</h3>
                <span className="text-sm text-muted-foreground">{reserve.category}</span>
              </div>
              <div className="space-y-2">
                <Input
                  type="number"
                  defaultValue={reserve.current_value}
                  onBlur={(e) => handleReserveUpdate(reserve.id, e.target.value)}
                  step="0.01"
                  className="text-right"
                />
                {reserve.target_value && (
                  <div className="flex justify-between text-sm">
                    <span>Target:</span>
                    <span>€{reserve.target_value.toLocaleString('de-DE', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                <p className="text-xs text-muted-foreground text-right">
                  Last updated: {new Date(reserve.last_updated).toLocaleString()}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      {/* Plan vs Actual Chart */}
      <Card className="p-6">
        {comparisonsLoading && (
          <div className="flex items-center justify-center h-24">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600" />
          </div>
        )}
        {comparisonsError && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{comparisonsError}</AlertDescription>
          </Alert>
        )}
        <h2 className="text-2xl font-semibold mb-4">Plan vs Actual Expenses</h2>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={monthlyComparisons}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                tickFormatter={(month) => new Date(2024, month - 1).toLocaleString('default', { month: 'short' })}
              />
              <YAxis />
              <Tooltip
                formatter={(value: number) =>
                  value.toLocaleString('de-DE', {
                    style: 'currency',
                    currency: 'EUR',
                  })
                }
              />
              <Legend />
              <Bar dataKey="planned" fill="#93c5fd" name="Planned" />
              <Bar dataKey="actual" fill="#f87171" name="Actual" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Monthly Budget Deviation */}
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-4">Monthly Budget Deviation</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Month</TableHead>
              <TableHead className="text-right">Planned</TableHead>
              <TableHead className="text-right">Actual</TableHead>
              <TableHead className="text-right">Deviation</TableHead>
              <TableHead className="text-right">Deviation %</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {monthlyComparisons.map((comparison) => (
              <TableRow key={comparison.month}>
                <TableCell>
                  {new Date(2024, comparison.month - 1).toLocaleString('default', { month: 'long' })}
                </TableCell>
                <TableCell className="text-right">
                  {comparison.planned.toLocaleString('de-DE', {
                    style: 'currency',
                    currency: 'EUR',
                  })}
                </TableCell>
                <TableCell className="text-right">
                  {comparison.actual.toLocaleString('de-DE', {
                    style: 'currency',
                    currency: 'EUR',
                  })}
                </TableCell>
                <TableCell
                  className={`text-right ${comparison.deviation < 0 ? 'text-green-600' : 'text-red-600'}`}
                >
                  {comparison.deviation.toLocaleString('de-DE', {
                    style: 'currency',
                    currency: 'EUR',
                    signDisplay: 'always',
                  })}
                </TableCell>
                <TableCell
                  className={`text-right ${comparison.deviationPercentage < 0 ? 'text-green-600' : 'text-red-600'}`}
                >
                  {comparison.deviationPercentage.toFixed(1)}%
                </TableCell>
              </TableRow>
            ))}
            {monthlyComparisons.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  No data available for the selected year
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Monthly Expenses by Category */}
      <Card className="p-6">
        {categoryExpensesLoading && (
          <div className="flex items-center justify-center h-24">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600" />
          </div>
        )}
        <h2 className="text-2xl font-semibold mb-4">Monthly Expenses by Category</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <button
                  onClick={() => setSorting('category')}
                  className="flex items-center space-x-1 hover:text-blue-600"
                >
                  <span>Category</span>
                  {sortBy === 'category' && (
                    <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </button>
              </TableHead>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                <TableHead key={month} className="text-right">
                  {new Date(selectedYear, month - 1).toLocaleString('default', { month: 'short' })}
                </TableHead>
              ))}
              <TableHead>
                <button
                  onClick={() => setSorting('total')}
                  className="flex items-center space-x-1 hover:text-blue-600 ml-auto"
                >
                  <span>Total</span>
                  {sortBy === 'total' && (
                    <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => setSorting('average')}
                  className="flex items-center space-x-1 hover:text-blue-600 ml-auto"
                >
                  <span>Average</span>
                  {sortBy === 'average' && (
                    <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categoryExpenses.map((expense) => (
              <TableRow key={expense.category}>
                <TableCell>{expense.category}</TableCell>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
                  const monthKey = `${selectedYear}-${month.toString().padStart(2, '0')}`;
                  const amount = expense.monthlyExpenses[monthKey] || 0;
                  return (
                    <TableCell key={month} className="text-right">
                      {amount > 0
                        ? amount.toLocaleString('de-DE', {
                            style: 'currency',
                            currency: 'EUR',
                          })
                        : '—'}
                    </TableCell>
                  );
                })}
                <TableCell className="text-right font-medium">
                  {expense.total.toLocaleString('de-DE', {
                    style: 'currency',
                    currency: 'EUR',
                  })}
                </TableCell>
                <TableCell className="text-right">
                  {expense.average.toLocaleString('de-DE', {
                    style: 'currency',
                    currency: 'EUR',
                  })}
                </TableCell>
              </TableRow>
            ))}
            {categoryExpenses.length === 0 && (
              <TableRow>
                <TableCell colSpan={14} className="text-center py-4">
                  No expenses found for the selected year
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
