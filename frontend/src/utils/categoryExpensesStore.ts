import { create } from 'zustand';
import { supabase } from './supabase';

interface CategoryExpense {
  category: string;
  monthlyExpenses: Record<string, number>; // key is 'YYYY-MM'
  total: number;
  average: number;
}

interface CategoryExpensesState {
  expenses: CategoryExpense[];
  loading: boolean;
  error: string | null;
  sortBy: keyof CategoryExpense;
  sortDirection: 'asc' | 'desc';
  fetchCategoryExpenses: (year: number) => Promise<void>;
  setSorting: (field: keyof CategoryExpense) => void;
}

export const useCategoryExpensesStore = create<CategoryExpensesState>((set, get) => ({
  expenses: [],
  loading: false,
  error: null,
  sortBy: 'total',
  sortDirection: 'desc',

  setSorting: (field: keyof CategoryExpense) => {
    const currentSortBy = get().sortBy;
    const currentDirection = get().sortDirection;
    
    // If clicking the same field, toggle direction
    const newDirection = currentSortBy === field && currentDirection === 'desc' ? 'asc' : 'desc';
    
    set({
      sortBy: field,
      sortDirection: newDirection,
      expenses: [...get().expenses].sort((a, b) => {
        const aValue = a[field];
        const bValue = b[field];
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return newDirection === 'asc' ? aValue - bValue : bValue - aValue;
        }
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return newDirection === 'asc' ? 
            aValue.localeCompare(bValue) : 
            bValue.localeCompare(aValue);
        }
        return 0;
      })
    });
  },

  fetchCategoryExpenses: async (year: number) => {
    set({ loading: true, error: null });
    try {
      // Get all categories
      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('*');

      if (categoriesError) throw categoriesError;

      // Get all variable expenses for the year
      const { data: variableExpenses, error: variableExpensesError } = await supabase
        .from('variable_expenses')
        .select('*')
        .eq('year', year);

      if (variableExpensesError) throw variableExpensesError;

      // Get all fixed expenses and their monthly statuses
      const { data: fixedExpenses, error: fixedExpensesError } = await supabase
        .from('fixed_expenses')
        .select(`
          *,
          monthly_fixed_expense_status!inner(month, completed)
        `)
        .eq('monthly_fixed_expense_status.year', year);

      if (fixedExpensesError) throw fixedExpensesError;

      // Process expenses by category
      const expensesByCategory = new Map<string, CategoryExpense>();

      // Initialize categories
      categories.forEach((category) => {
        expensesByCategory.set(category.name, {
          category: category.name,
          monthlyExpenses: {},
          total: 0,
          average: 0,
        });
      });

      // Process variable expenses
      variableExpenses.forEach((expense) => {
        const monthKey = `${year}-${expense.month.toString().padStart(2, '0')}`;
        const categoryExpense = expensesByCategory.get(expense.category);
        if (categoryExpense) {
          categoryExpense.monthlyExpenses[monthKey] = 
            (categoryExpense.monthlyExpenses[monthKey] || 0) + expense.amount;
          categoryExpense.total += expense.amount;
        }
      });

      // Process fixed expenses
      fixedExpenses.forEach((expense) => {
        if (!expense.monthly_fixed_expense_status.completed) return;
        
        const monthKey = `${year}-${expense.monthly_fixed_expense_status.month.toString().padStart(2, '0')}`;
        const categoryExpense = expensesByCategory.get(expense.category);
        if (categoryExpense) {
          categoryExpense.monthlyExpenses[monthKey] = 
            (categoryExpense.monthlyExpenses[monthKey] || 0) + expense.estimated_amount;
          categoryExpense.total += expense.estimated_amount;
        }
      });

      // Calculate averages and prepare final array
      const expenses = Array.from(expensesByCategory.values()).map(expense => {
        const monthsWithExpenses = Object.keys(expense.monthlyExpenses).length;
        expense.average = monthsWithExpenses > 0 ? 
          expense.total / monthsWithExpenses : 
          0;
        return expense;
      });

      // Sort by total by default
      expenses.sort((a, b) => b.total - a.total);

      set({ expenses, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
}));
