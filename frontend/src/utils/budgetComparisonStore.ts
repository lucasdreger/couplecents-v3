import { create } from 'zustand';
import { supabase } from './supabase';

interface MonthlyComparison {
  year: number;
  month: number;
  planned: number;
  actual: number;
  deviation: number;
  deviationPercentage: number;
}

interface BudgetComparisonState {
  monthlyComparisons: MonthlyComparison[];
  loading: boolean;
  error: string | null;
  fetchMonthlyComparisons: (year: number) => Promise<void>;
}

export const useBudgetComparisonStore = create<BudgetComparisonState>((set) => ({
  monthlyComparisons: [],
  loading: false,
  error: null,

  fetchMonthlyComparisons: async (year: number) => {
    set({ loading: true, error: null });
    try {
      // Get all fixed expenses
      const { data: fixedExpenses, error: fixedExpensesError } = await supabase
        .from('fixed_expenses')
        .select('*');

      if (fixedExpensesError) throw fixedExpensesError;

      // Calculate total planned expenses (sum of all fixed expenses)
      const totalPlanned = fixedExpenses.reduce(
        (sum, expense) => sum + expense.estimated_amount,
        0
      );

      // Get all months with variable expenses for the year
      const { data: variableExpenses, error: variableExpensesError } = await supabase
        .from('variable_expenses')
        .select('*')
        .eq('year', year);

      if (variableExpensesError) throw variableExpensesError;

      // Get all monthly fixed expense statuses for the year
      const { data: fixedExpenseStatuses, error: statusesError } = await supabase
        .from('monthly_fixed_expense_status')
        .select('*')
        .eq('year', year);

      if (statusesError) throw statusesError;

      // Create a map of months with data
      const monthsWithData = new Set<number>();
      variableExpenses.forEach((expense) => monthsWithData.add(expense.month));
      fixedExpenseStatuses.forEach((status) => monthsWithData.add(status.month));

      // Calculate comparisons for each month
      const comparisons: MonthlyComparison[] = Array.from(monthsWithData).map((month) => {
        // Calculate actual expenses for the month
        const monthlyVariableExpenses = variableExpenses
          .filter((expense) => expense.month === month)
          .reduce((sum, expense) => sum + expense.amount, 0);

        const monthlyFixedExpenses = fixedExpenseStatuses
          .filter((status) => status.month === month && status.completed)
          .map((status) => {
            const fixedExpense = fixedExpenses.find((fe) => fe.id === status.fixed_expense_id);
            return fixedExpense ? fixedExpense.estimated_amount : 0;
          })
          .reduce((sum, amount) => sum + amount, 0);

        const actual = monthlyVariableExpenses + monthlyFixedExpenses;
        const deviation = actual - totalPlanned;
        const deviationPercentage = (deviation / totalPlanned) * 100;

        return {
          year,
          month,
          planned: totalPlanned,
          actual,
          deviation,
          deviationPercentage,
        };
      });

      // Sort by month
      comparisons.sort((a, b) => a.month - b.month);

      set({ monthlyComparisons: comparisons, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
}));
