import { create } from 'zustand';
import { supabase } from './supabase';
import { AuthState, UserProfile, InvestmentState, ReserveState, Investment, Reserve, MonthlyIncomeState, MonthlyCreditCardState, MonthlyFixedExpenseStatusState } from './types';

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: true,
  error: null,
  setSession: (session) => set({ session }),
  setUser: (user) => set({ user, loading: false }),
  signIn: async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  },
  signUp: async (email: string, password: string, fullName: string) => {
    const { error: signUpError, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    if (signUpError) throw signUpError;

    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: data.user.id,
            email,
            full_name: fullName,
          },
        ]);
      if (profileError) throw profileError;
    }
  },
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    set({ user: null, session: null });
  },
}));

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  loading: true,
  error: null,
  subscribeToCategories: () => {
    const channel = supabase
      .channel('categories')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'categories',
        },
        () => {
          get().fetchCategories();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
  fetchCategories: async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      set({ categories: data as Category[], loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  createCategory: async (name: string) => {
    try {
      const { error } = await supabase
        .from('categories')
        .insert([{ name }]);

      if (error) throw error;
      await get().fetchCategories();
    } catch (error: any) {
      set({ error: error.message });
    }
  },
  updateCategory: async (id: string, name: string) => {
    try {
      const { error } = await supabase
        .from('categories')
        .update({ name })
        .eq('id', id);

      if (error) throw error;
      await get().fetchCategories();
    } catch (error: any) {
      set({ error: error.message });
    }
  },
  deleteCategory: async (id: string) => {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await get().fetchCategories();
    } catch (error: any) {
      set({ error: error.message });
    }
  },
}));

export const useFixedExpenseStore = create<FixedExpenseState>((set, get) => ({
  fixedExpenses: [],
  loading: true,
  error: null,
  subscribeToFixedExpenses: () => {
    const channel = supabase
      .channel('fixed_expenses')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'fixed_expenses',
        },
        () => {
          get().fetchFixedExpenses();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
  fetchFixedExpenses: async () => {
    try {
      const { data, error } = await supabase
        .from('fixed_expenses')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      set({ fixedExpenses: data as FixedExpense[], loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  createFixedExpense: async (data: Omit<FixedExpense, 'id' | 'created_at'>) => {
    const { v4: uuidv4 } = await import('uuid');
    const id = uuidv4();

    try {
      const { error } = await supabase
        .from('fixed_expenses')
        .insert([{ id, ...data }]);

      if (error) throw error;
      await get().fetchFixedExpenses();
    } catch (error: any) {
      set({ error: error.message });
    }
  },
  updateFixedExpense: async (id: string, data: Partial<Omit<FixedExpense, 'id' | 'created_at'>>) => {
    try {
      const { error } = await supabase
        .from('fixed_expenses')
        .update(data)
        .eq('id', id);

      if (error) throw error;
      await get().fetchFixedExpenses();
    } catch (error: any) {
      set({ error: error.message });
    }
  },
  deleteFixedExpense: async (id: string) => {
    try {
      const { error } = await supabase
        .from('fixed_expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await get().fetchFixedExpenses();
    } catch (error: any) {
      set({ error: error.message });
    }
  },
}));

export const useMonthlyIncomeStore = create<MonthlyIncomeState>((set, get) => ({
  monthlyIncome: null,
  loading: false,
  error: null,
  subscribeToMonthlyIncome: (year: number, month: number) => {
    const channel = supabase
      .channel(`monthly_income_${year}_${month}`)
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
        .upsert({
          year,
          month,
          lucas_income: defaultIncome.lucas_income,
          camila_income: defaultIncome.camila_income,
          other_income: defaultIncome.other_income,
        })
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
      .channel(`monthly_credit_card_${year}_${month}`)
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
      .channel(`monthly_fixed_expense_status_${year}_${month}`)
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
      const { error } = await supabase
        .rpc('initialize_monthly_fixed_expenses', { p_year: year, p_month: month });

      if (error) throw error;
      
      // Fetch the updated list
      const { data, error: fetchError } = await supabase
        .from('monthly_fixed_expense_status')
        .select('*')
        .eq('year', year)
        .eq('month', month);

      if (fetchError) throw fetchError;
      set({ monthlyFixedExpenseStatuses: data, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
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

export const useDefaultIncomeStore = create<DefaultIncomeState>((set, get) => ({
  defaultIncome: null,
  loading: true,
  error: null,
  subscribeToDefaultIncome: () => {
    const channel = supabase
      .channel('default_income')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'default_income',
        },
        () => {
          get().fetchDefaultIncome();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
  fetchDefaultIncome: async () => {
    try {
      const { data, error } = await supabase
        .from('default_income')
        .select('*')
        .single();

      if (error) throw error;
      set({ defaultIncome: data as DefaultIncome, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  updateDefaultIncome: async (data: Pick<DefaultIncome, 'lucas_income' | 'camila_income' | 'other_income'>) => {
    try {
      const { error } = await supabase
        .from('default_income')
        .update({
          ...data,
          last_updated: new Date().toISOString(),
        })
        .eq('id', get().defaultIncome?.id);

      if (error) throw error;
      await get().fetchDefaultIncome();
    } catch (error: any) {
      set({ error: error.message });
    }
  },
}));

export const useInvestmentStore = create<InvestmentState>((set, get) => ({
  investments: [],
  loading: true,
  error: null,
  subscribeToInvestments: () => {
    const channel = supabase
      .channel('investments')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'investments',
        },
        () => {
          get().fetchInvestments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
  fetchInvestments: async () => {
    try {
      const { data, error } = await supabase
        .from('investments')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      set({ investments: data as Investment[], loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  updateInvestment: async (id: string, value: number) => {
    try {
      const user = useAuthStore.getState().user;
      if (!user) throw new Error('You must be logged in to update investments');

      const investment = get().investments.find((i) => i.id === id);
      if (!investment) throw new Error('Investment not found');

      // Update investment
      const { error: updateError } = await supabase
        .from('investments')
        .update({
          current_value: value,
          last_updated: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) throw updateError;

      // Add to history
      const { error: historyError } = await supabase.from('investment_history').insert([
        {
          investment_id: id,
          previous_value: investment.current_value,
          new_value: value,
          updated_by: user.id,
        },
      ]);

      if (historyError) throw historyError;

      // Update local state
      set({
        investments: get().investments.map((i) =>
          i.id === id
            ? { ...i, current_value: value, last_updated: new Date().toISOString() }
            : i
        ),
      });
    } catch (error: any) {
      set({ error: error.message });
      throw error; // Re-throw to handle in UI
    }
  },
}));

export const useReserveStore = create<ReserveState>((set, get) => ({
  reserves: [],
  loading: true,
  error: null,
  subscribeToReserves: () => {
    const channel = supabase
      .channel('reserves')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reserves',
        },
        () => {
          get().fetchReserves();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
  fetchReserves: async () => {
    try {
      const { data, error } = await supabase
        .from('reserves')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      set({ reserves: data as Reserve[], loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  updateReserve: async (id: string, value: number) => {
    try {
      const user = useAuthStore.getState().user;
      if (!user) throw new Error('You must be logged in to update reserves');

      const reserve = get().reserves.find((r) => r.id === id);
      if (!reserve) throw new Error('Reserve not found');

      // Update reserve
      const { error: updateError } = await supabase
        .from('reserves')
        .update({
          current_value: value,
          last_updated: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) throw updateError;

      // Add to history
      const { error: historyError } = await supabase.from('reserve_history').insert([
        {
          reserve_id: id,
          previous_value: reserve.current_value,
          new_value: value,
          updated_by: user.id,
        },
      ]);

      if (historyError) throw historyError;

      // Update local state
      set({
        reserves: get().reserves.map((r) =>
          r.id === id
            ? { ...r, current_value: value, last_updated: new Date().toISOString() }
            : r
        ),
      });
    } catch (error: any) {
      set({ error: error.message });
      throw error; // Re-throw to handle in UI
    }
  },
}));
