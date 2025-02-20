export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
}

export interface AuthState {
  user: UserProfile | null;
  session: any | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  setSession: (session: any) => void;
  setUser: (user: UserProfile | null) => void;
}

export interface Investment {
  id: string;
  category: string;
  name: string;
  current_value: number;
  last_updated: string;
  created_at: string;
}

export interface InvestmentHistory {
  id: string;
  investment_id: string;
  previous_value: number;
  new_value: number;
  updated_by: string;
  created_at: string;
}

export interface Reserve {
  id: string;
  category: string;
  name: string;
  current_value: number;
  target_value?: number;
  last_updated: string;
  created_at: string;
}

export interface ReserveHistory {
  id: string;
  reserve_id: string;
  previous_value: number;
  new_value: number;
  updated_by: string;
  created_at: string;
}

export interface InvestmentState {
  investments: Investment[];
  loading: boolean;
  error: string | null;
  updateInvestment: (id: string, value: number) => Promise<void>;
  fetchInvestments: () => Promise<void>;
}

export interface ReserveState {
  reserves: Reserve[];
  loading: boolean;
  error: string | null;
  updateReserve: (id: string, value: number) => Promise<void>;
  fetchReserves: () => Promise<void>;
}

export interface Category {
  id: string;
  name: string;
  created_at: string;
}

export interface FixedExpense {
  id: string;
  category_id: string;
  description: string;
  estimated_amount: number;
  owner: 'Lucas' | 'Camila';
  status_required: boolean;
  created_at: string;
}

export interface DefaultIncome {
  id: string;
  lucas_income: number;
  camila_income: number;
  other_income: number;
  last_updated: string;
  created_at: string;
}

export interface CategoryState {
  categories: Category[];
  loading: boolean;
  error: string | null;
  createCategory: (name: string) => Promise<void>;
  updateCategory: (id: string, name: string) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  fetchCategories: () => Promise<void>;
}

export interface FixedExpenseState {
  fixedExpenses: FixedExpense[];
  loading: boolean;
  error: string | null;
  createFixedExpense: (data: Omit<FixedExpense, 'id' | 'created_at'>) => Promise<void>;
  updateFixedExpense: (id: string, data: Partial<Omit<FixedExpense, 'id' | 'created_at'>>) => Promise<void>;
  deleteFixedExpense: (id: string) => Promise<void>;
  fetchFixedExpenses: () => Promise<void>;
}

export interface DefaultIncomeState {
  defaultIncome: DefaultIncome | null;
  loading: boolean;
  error: string | null;
  updateDefaultIncome: (data: Pick<DefaultIncome, 'lucas_income' | 'camila_income' | 'other_income'>) => Promise<void>;
  fetchDefaultIncome: () => Promise<void>;
}

export interface MonthlyIncome {
  id: string;
  year: number;
  month: number;
  lucas_income: number;
  camila_income: number;
  other_income: number;
  created_at: string;
}

export interface MonthlyCreditCard {
  id: string;
  year: number;
  month: number;
  amount: number;
  created_at: string;
}

export interface MonthlyFixedExpenseStatus {
  id: string;
  year: number;
  month: number;
  fixed_expense_id: string;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
}

export interface MonthlyIncomeState {
  monthlyIncome: MonthlyIncome | null;
  loading: boolean;
  error: string | null;
  subscribeToMonthlyIncome: (year: number, month: number) => () => void;
  fetchMonthlyIncome: (year: number, month: number) => Promise<void>;
  loadDefaultIncome: (year: number, month: number) => Promise<void>;
  updateMonthlyIncome: (year: number, month: number, data: Pick<MonthlyIncome, 'lucas_income' | 'camila_income' | 'other_income'>) => Promise<void>;
}

export interface MonthlyCreditCardState {
  monthlyCreditCard: MonthlyCreditCard | null;
  loading: boolean;
  error: string | null;
  subscribeToMonthlyCreditCard: (year: number, month: number) => () => void;
  fetchMonthlyCreditCard: (year: number, month: number) => Promise<void>;
  updateMonthlyCreditCard: (year: number, month: number, amount: number) => Promise<void>;
}

export interface VariableExpense {
  id: string;
  year: number;
  month: number;
  category_id: string;
  description: string;
  amount: number;
  date: string;
  created_at: string;
}

export interface VariableExpenseState {
  variableExpenses: VariableExpense[];
  loading: boolean;
  error: string | null;
  subscribeToVariableExpenses: (year: number, month: number) => () => void;
  fetchVariableExpenses: (year: number, month: number) => Promise<void>;
  createVariableExpense: (data: Omit<VariableExpense, 'id' | 'created_at'>) => Promise<void>;
  updateVariableExpense: (id: string, data: Partial<Omit<VariableExpense, 'id' | 'created_at'>>) => Promise<void>;
  deleteVariableExpense: (id: string) => Promise<void>;
}

export interface MonthlyFixedExpenseStatusState {
  monthlyFixedExpenseStatuses: MonthlyFixedExpenseStatus[];
  loading: boolean;
  error: string | null;
  subscribeToMonthlyFixedExpenseStatuses: (year: number, month: number) => () => void;
  fetchMonthlyFixedExpenseStatuses: (year: number, month: number) => Promise<void>;
  initializeMonthlyFixedExpenses: (year: number, month: number) => Promise<void>;
  updateMonthlyFixedExpenseStatus: (id: string, completed: boolean) => Promise<void>;
}
