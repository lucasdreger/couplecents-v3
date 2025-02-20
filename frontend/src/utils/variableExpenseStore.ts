import { create } from 'zustand';
import { supabase } from './supabase';
import { VariableExpenseState, VariableExpense } from './types';

export const useVariableExpenseStore = create<VariableExpenseState>((set, get) => ({
  variableExpenses: [],
  loading: false,
  error: null,

  subscribeToVariableExpenses: (year: number, month: number) => {
    const channel = supabase
      .channel('variable_expenses')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'variable_expenses',
          filter: `year=eq.${year}&month=eq.${month}`,
        },
        () => {
          get().fetchVariableExpenses(year, month);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  fetchVariableExpenses: async (year: number, month: number) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('variable_expenses')
        .select('*')
        .eq('year', year)
        .eq('month', month)
        .order('date', { ascending: false });

      if (error) throw error;
      set({ variableExpenses: data, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  createVariableExpense: async (data: Omit<VariableExpense, 'id' | 'created_at'>) => {
    set({ loading: true, error: null });
    try {
      // Validate required fields
      if (!data.category_id) {
        throw new Error('Please select a category for the expense');
      }
      if (!data.description) {
        throw new Error('Please enter a description for the expense');
      }
      if (!data.amount) {
        throw new Error('Please enter an amount for the expense');
      }

      const { v4: uuidv4 } = await import('uuid');
      const id = uuidv4();

      const { error } = await supabase
        .from('variable_expenses')
        .insert([{ id, ...data }]);

      if (error) throw error;
      await get().fetchVariableExpenses(data.year, data.month);
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error; // Re-throw to handle in the UI
    } finally {
      set({ loading: false });
    }
  },

  updateVariableExpense: async (id: string, data: Partial<Omit<VariableExpense, 'id' | 'created_at'>>) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('variable_expenses')
        .update(data)
        .eq('id', id);

      if (error) throw error;

      const expense = get().variableExpenses.find(e => e.id === id);
      if (expense) {
        await get().fetchVariableExpenses(expense.year, expense.month);
      }
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  deleteVariableExpense: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const expense = get().variableExpenses.find(e => e.id === id);
      if (!expense) throw new Error('Expense not found');

      const { error } = await supabase
        .from('variable_expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await get().fetchVariableExpenses(expense.year, expense.month);
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
}));
