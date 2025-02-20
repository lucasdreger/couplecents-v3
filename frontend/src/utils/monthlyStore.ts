import { create } from 'zustand';
import { supabase } from './supabase';
import { MonthlyIncomeState, MonthlyCreditCardState, MonthlyFixedExpenseStatusState, MonthlyIncome } from './types';

export const useMonthlyIncomeStore = create<MonthlyIncomeState>((set, get) => ({
  monthlyIncome: null,
  loading: false,
  error: null,

  subscribeToMonthlyIncome: (year: number, month: number) => {
    const channel = supabase
      .channel('monthly_income')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'monthly_income',
          filter: `year=eq.${year}&month=eq.${month}`,
        },
        () => {
          get().fetchMonthlyIncome(year, month);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  fetchMonthlyIncome: async (year: number, month: number) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .rpc('get_or_create_monthly_income', { p_year: year, p_month: month })
        .single();

      if (error) throw error;
      set({ monthlyIncome: data, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  loadDefaultIncome: async (year: number, month: number) => {
    set({ loading: true, error: null });
    try {
      const { data: defaultIncome, error: fetchError } = await supabase
        .from('default_income')
        .select('*')
        .single();

      if (fetchError) throw fetchError;

      const { data, error } = await supabase
        .from('monthly_income')
        .upsert(
          {
            year,
            month,
            lucas_income: defaultIncome.lucas_income,
            camila_income: defaultIncome.camila_income,
            other_income: defaultIncome.other_income,
          },
          { onConflict: 'year,month' }
        )
        .select()
        .single();

      if (error) throw error;
      set({ monthlyIncome: data, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  updateMonthlyIncome: async (year: number, month: number, data: Pick<MonthlyIncome, 'lucas_income' | 'camila_income' | 'other_income'>) => {
    set({ loading: true, error: null });
    try {
      const { data: updatedIncome, error } = await supabase
        .from('monthly_income')
        .upsert({
          year,
          month,
          ...data,
        })
        .select()
        .single();

      if (error) throw error;
      set({ monthlyIncome: updatedIncome, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
}));

export const useMonthlyCreditCardStore = create<MonthlyCreditCardState>((set, get) => ({
  monthlyCreditCard: null,
  loading: false,
  error: null,

  subscribeToMonthlyCreditCard: (year: number, month: number) => {
    const channel = supabase
      .channel('monthly_credit_card')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'monthly_credit_card',
          filter: `year=eq.${year}&month=eq.${month}`,
        },
        () => {
          get().fetchMonthlyCreditCard(year, month);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  fetchMonthlyCreditCard: async (year: number, month: number) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .rpc('get_or_create_monthly_credit_card', { p_year: year, p_month: month })
        .single();

      if (error) throw error;
      set({ monthlyCreditCard: data, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  updateMonthlyCreditCard: async (year: number, month: number, amount: number) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('monthly_credit_card')
        .upsert(
          { year, month, amount },
          { onConflict: 'year,month' }
        )
        .select()
        .single();

      if (error) throw error;
      set({ monthlyCreditCard: data, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
}));

export const useMonthlyFixedExpenseStatusStore = create<MonthlyFixedExpenseStatusState>((set, get) => ({
  monthlyFixedExpenseStatuses: [],
  loading: false,
  error: null,

  subscribeToMonthlyFixedExpenseStatuses: (year: number, month: number) => {
    const channel = supabase
      .channel('monthly_fixed_expense_status')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'monthly_fixed_expense_status',
          filter: `year=eq.${year}&month=eq.${month}`,
        },
        () => {
          get().fetchMonthlyFixedExpenseStatuses(year, month);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  fetchMonthlyFixedExpenseStatuses: async (year: number, month: number) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('monthly_fixed_expense_status')
        .select('*')
        .eq('year', year)
        .eq('month', month);

      if (error) throw error;
      set({ monthlyFixedExpenseStatuses: data, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  initializeMonthlyFixedExpenses: async (year: number, month: number) => {
    set({ loading: true, error: null });
    try {
      // First initialize any missing fixed expenses
      const { error: initError } = await supabase
        .rpc('initialize_monthly_fixed_expenses', { p_year: year, p_month: month });

      if (initError) throw initError;
      
      // Then fetch the updated list
      const { data, error: fetchError } = await supabase
        .from('monthly_fixed_expense_status')
        .select('*')
        .eq('year', year)
        .eq('month', month);

      if (fetchError) throw fetchError;
      set({ monthlyFixedExpenseStatuses: data, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error; // Re-throw to handle in the UI
    }
  },

  updateMonthlyFixedExpenseStatus: async (id: string, completed: boolean) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('monthly_fixed_expense_status')
        .update({
          completed,
          completed_at: completed ? new Date().toISOString() : null,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      set((state) => ({
        monthlyFixedExpenseStatuses: state.monthlyFixedExpenseStatuses.map((status) =>
          status.id === id ? data : status
        ),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
}));