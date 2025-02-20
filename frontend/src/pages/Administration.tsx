import React, { useEffect, useState } from 'react';
import { MainNavigation } from 'components/MainNavigation';
import { useCategoryStore, useFixedExpenseStore, useDefaultIncomeStore } from '../utils/store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NumberInput } from 'components/NumberInput';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Category, FixedExpense } from '../utils/types';

export default function Administration() {
  // Categories
  const {
    categories,
    loading: categoriesLoading,
    error: categoriesError,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    subscribeToCategories,
  } = useCategoryStore();

  // Fixed Expenses
  const {
    fixedExpenses,
    loading: fixedExpensesLoading,
    error: fixedExpensesError,
    fetchFixedExpenses,
    createFixedExpense,
    updateFixedExpense,
    deleteFixedExpense,
    subscribeToFixedExpenses,
  } = useFixedExpenseStore();

  // Default Income
  const {
    defaultIncome,
    loading: defaultIncomeLoading,
    error: defaultIncomeError,
    fetchDefaultIncome,
    updateDefaultIncome,
    subscribeToDefaultIncome,
  } = useDefaultIncomeStore();

  // Local state for forms
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newFixedExpense, setNewFixedExpense] = useState({
    category_id: '',
    description: '',
    estimated_amount: 0,
    owner: 'Lucas' as 'Lucas' | 'Camila',
    status_required: false,
  });
  const [editingFixedExpense, setEditingFixedExpense] = useState<FixedExpense | null>(null);

  // Setup real-time subscriptions
  useEffect(() => {
    const unsubCategories = subscribeToCategories();
    const unsubFixedExpenses = subscribeToFixedExpenses();
    const unsubDefaultIncome = subscribeToDefaultIncome();

    fetchCategories();
    fetchFixedExpenses();
    fetchDefaultIncome();

    return () => {
      unsubCategories();
      unsubFixedExpenses();
      unsubDefaultIncome();
    };
  }, []);

  // Categories handlers
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCategory(newCategoryName);
      setNewCategoryName('');
      toast.success('Category created successfully');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    try {
      await updateCategory(editingCategory.id, editingCategory.name);
      setEditingCategory(null);
      toast.success('Category updated successfully');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await deleteCategory(id);
      toast.success('Category deleted successfully');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // Fixed Expenses handlers
  const handleCreateFixedExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createFixedExpense(newFixedExpense);
      setNewFixedExpense({
        category_id: '',
        description: '',
        estimated_amount: 0,
        owner: 'Lucas',
        status_required: false,
      });
      toast.success('Fixed expense created successfully');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleUpdateFixedExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFixedExpense) return;
    try {
      const { id, created_at, ...data } = editingFixedExpense;
      await updateFixedExpense(id, data);
      setEditingFixedExpense(null);
      toast.success('Fixed expense updated successfully');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteFixedExpense = async (id: string) => {
    try {
      await deleteFixedExpense(id);
      toast.success('Fixed expense deleted successfully');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // Default Income handlers
  const handleUpdateDefaultIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!defaultIncome) return;
    try {
      await updateDefaultIncome({
        lucas_income: defaultIncome.lucas_income,
        camila_income: defaultIncome.camila_income,
        other_income: defaultIncome.other_income,
      });
      toast.success('Default income updated successfully');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (categoriesLoading || fixedExpensesLoading || defaultIncomeLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (categoriesError || fixedExpensesError || defaultIncomeError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">
          {categoriesError || fixedExpensesError || defaultIncomeError}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <MainNavigation />
      <div className="container mx-auto py-6 space-y-8">
      {/* Categories Section */}
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-4">Categories</h2>
        
        {/* Add Category Form */}
        <form onSubmit={handleCreateCategory} className="mb-4 flex gap-2">
          <Input
            placeholder="New category name"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            className="flex-1"
          />
          <Button type="submit">Add Category</Button>
        </form>

        {/* Categories List */}
        <div className="space-y-2">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center gap-2">
              {editingCategory?.id === category.id ? (
                <form onSubmit={handleUpdateCategory} className="flex-1 flex gap-2">
                  <Input
                    value={editingCategory.name}
                    onChange={(e) =>
                      setEditingCategory({ ...editingCategory, name: e.target.value })
                    }
                    className="flex-1"
                  />
                  <Button type="submit">Save</Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingCategory(null)}
                  >
                    Cancel
                  </Button>
                </form>
              ) : (
                <>
                  <span className="flex-1">{category.name}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingCategory(category)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteCategory(category.id)}
                  >
                    Delete
                  </Button>
                </>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Fixed Expenses Section */}
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-4">Fixed Expenses</h2>

        {/* Add Fixed Expense Form */}
        <form onSubmit={handleCreateFixedExpense} className="mb-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select
              value={newFixedExpense.category_id}
              onValueChange={(value) =>
                setNewFixedExpense({ ...newFixedExpense, category_id: value })
              }
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

            <Input
              placeholder="Description"
              value={newFixedExpense.description}
              onChange={(e) =>
                setNewFixedExpense({ ...newFixedExpense, description: e.target.value })
              }
            />

            <NumberInput
              placeholder="Estimated Amount"
              value={newFixedExpense.estimated_amount}
              onChange={(value) =>
                setNewFixedExpense({
                  ...newFixedExpense,
                  estimated_amount: value,
                })
              }
              min={0}
            />

            <Select
              value={newFixedExpense.owner}
              onValueChange={(value: 'Lucas' | 'Camila') =>
                setNewFixedExpense({ ...newFixedExpense, owner: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select owner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Lucas">Lucas</SelectItem>
                <SelectItem value="Camila">Camila</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="status_required"
              checked={newFixedExpense.status_required}
              onCheckedChange={(checked) =>
                setNewFixedExpense({
                  ...newFixedExpense,
                  status_required: checked as boolean,
                })
              }
            />
            <label htmlFor="status_required">Status Required</label>
          </div>

          <Button type="submit">Add Fixed Expense</Button>
        </form>

        {/* Fixed Expenses List */}
        <div className="space-y-4">
          {fixedExpenses.map((expense) => (
            <Card key={expense.id} className="p-4">
              {editingFixedExpense?.id === expense.id ? (
                <form onSubmit={handleUpdateFixedExpense} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Select
                      value={editingFixedExpense.category_id}
                      onValueChange={(value) =>
                        setEditingFixedExpense({
                          ...editingFixedExpense,
                          category_id: value,
                        })
                      }
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

                    <Input
                      placeholder="Description"
                      value={editingFixedExpense.description}
                      onChange={(e) =>
                        setEditingFixedExpense({
                          ...editingFixedExpense,
                          description: e.target.value,
                        })
                      }
                    />

                    <NumberInput
                      placeholder="Estimated Amount"
                      value={editingFixedExpense.estimated_amount}
                      onChange={(value) =>
                        setEditingFixedExpense({
                          ...editingFixedExpense,
                          estimated_amount: value,
                        })
                      }
                      min={0}
                    />

                    <Select
                      value={editingFixedExpense.owner}
                      onValueChange={(value: 'Lucas' | 'Camila') =>
                        setEditingFixedExpense({
                          ...editingFixedExpense,
                          owner: value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select owner" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Lucas">Lucas</SelectItem>
                        <SelectItem value="Camila">Camila</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="edit_status_required"
                      checked={editingFixedExpense.status_required}
                      onCheckedChange={(checked) =>
                        setEditingFixedExpense({
                          ...editingFixedExpense,
                          status_required: checked as boolean,
                        })
                      }
                    />
                    <label htmlFor="edit_status_required">Status Required</label>
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit">Save</Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setEditingFixedExpense(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">
                      {categories.find((c) => c.id === expense.category_id)?.name}
                    </span>
                    <span className="text-muted-foreground">{expense.owner}</span>
                  </div>
                  <p>{expense.description}</p>
                  <p className="text-right">
                    €{expense.estimated_amount.toLocaleString('de-DE', {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Checkbox checked={expense.status_required} disabled />
                      <span className="text-sm text-muted-foreground">
                        Status Required
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingFixedExpense(expense)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteFixedExpense(expense.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      </Card>

      {/* Default Income Section */}
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-4">Default Income</h2>

        {defaultIncome && (
          <form onSubmit={handleUpdateDefaultIncome} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label htmlFor="lucas_income" className="text-sm font-medium">
                  Lucas Income
                </label>
                <NumberInput
                  id="lucas_income"
                  value={defaultIncome.lucas_income}
                  onChange={(value) =>
                    useDefaultIncomeStore.setState({
                      defaultIncome: {
                        ...defaultIncome,
                        lucas_income: value,
                      },
                    })
                  }
                  min={0}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="camila_income" className="text-sm font-medium">
                  Camila Income
                </label>
                <NumberInput
                  id="camila_income"
                  value={defaultIncome.camila_income}
                  onChange={(value) =>
                    useDefaultIncomeStore.setState({
                      defaultIncome: {
                        ...defaultIncome,
                        camila_income: value,
                      },
                    })
                  }
                  min={0}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="other_income" className="text-sm font-medium">
                  Other Income
                </label>
                <NumberInput
                  id="other_income"
                  value={defaultIncome.other_income}
                  onChange={(value) =>
                    useDefaultIncomeStore.setState({
                      defaultIncome: {
                        ...defaultIncome,
                        other_income: value,
                      },
                    })
                  }
                  min={0}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit">Save Default Income</Button>
            </div>

            <p className="text-sm text-muted-foreground text-right">
              Last updated: {new Date(defaultIncome.last_updated).toLocaleString()}
            </p>
          </form>
        )}
      </Card>
      </div>
    </div>
  );
}
