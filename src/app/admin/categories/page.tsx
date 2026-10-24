'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { DataTable, Column } from '@/components/ui/data-table';
import { GlassButton } from '@/components/ui/glass-button';
import { GlassBadge } from '@/components/ui/glass-badge';
import { GlassInput } from '@/components/ui/glass-input';
import { SearchInput } from '@/components/ui/search-input';
import { FormDialog } from '@/components/ui/form-dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { MOCK_CATEGORIES, MOCK_PRODUCTS } from '@/lib/mock-data';
import { CategoryItem } from '@/types';
import { slugify } from '@/lib/utils';
import { Plus, Edit2, Trash2, Layers, AlertCircle } from 'lucide-react';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>(MOCK_CATEGORIES);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<CategoryItem | null>(null);
  const [dependencyError, setDependencyError] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isVisible, setIsVisible] = useState(true);

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleOpenCreate = () => {
    setName('');
    setDescription('');
    setIsVisible(true);
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (cat: CategoryItem) => {
    setEditingCategory(cat);
    setName(cat.name);
    setDescription(cat.description || '');
    setIsVisible(cat.isVisible);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newCat: CategoryItem = {
      id: `cat-${Date.now()}`,
      slug: slugify(name),
      name,
      description,
      isVisible,
      productCount: 0,
    };
    setCategories((prev) => [...prev, newCat]);
    setIsCreateOpen(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    setCategories((prev) =>
      prev.map((c) =>
        c.id === editingCategory.id
          ? { ...c, name, slug: slugify(name), description, isVisible }
          : c
      )
    );
    setEditingCategory(null);
  };

  const attemptDelete = (cat: CategoryItem) => {
    const dependentCount = MOCK_PRODUCTS.filter((p) => p.categoryId === cat.id).length;
    if (dependentCount > 0) {
      setDependencyError(
        `Cannot delete "${cat.name}" because ${dependentCount} product(s) are assigned to it. Reassign or delete those products first.`
      );
      return;
    }
    setDependencyError(null);
    setDeletingCategory(cat);
  };

  const confirmDelete = () => {
    if (!deletingCategory) return;
    setCategories((prev) => prev.filter((c) => c.id !== deletingCategory.id));
    setDeletingCategory(null);
  };

  const columns: Column<CategoryItem>[] = [
    {
      key: 'name',
      header: 'Category',
      render: (cat) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl glass-control flex items-center justify-center text-foreground shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm">{cat.name}</p>
            <p className="text-xs font-mono text-muted-foreground">/{cat.slug}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (cat) => (
        <p className="text-xs text-muted-foreground max-w-md line-clamp-1">
          {cat.description || 'No description set'}
        </p>
      ),
    },
    {
      key: 'productCount',
      header: 'Assigned Products',
      render: (cat) => {
        const count = MOCK_PRODUCTS.filter((p) => p.categoryId === cat.id).length;
        return (
          <span className="text-xs font-mono font-medium text-foreground">
            {count} items
          </span>
        );
      },
    },
    {
      key: 'isVisible',
      header: 'Visibility',
      render: (cat) => (
        <GlassBadge variant={cat.isVisible ? 'success' : 'outline'} size="sm">
          {cat.isVisible ? 'Active' : 'Hidden'}
        </GlassBadge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (cat) => (
        <div className="flex items-center justify-end gap-1.5">
          <GlassButton variant="outline" size="sm" onClick={() => handleOpenEdit(cat)}>
            <Edit2 className="w-3.5 h-3.5" />
          </GlassButton>
          <GlassButton variant="destructive" size="sm" onClick={() => attemptDelete(cat)}>
            <Trash2 className="w-3.5 h-3.5" />
          </GlassButton>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout role="ADMIN" title="Product Categories" userName="Super Admin">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            Product Categories
          </h2>
          <p className="text-xs text-muted-foreground">
            Organize the storefront taxonomy, navigational menus, and search filters
          </p>
        </div>
        <GlassButton variant="primary" size="md" onClick={handleOpenCreate} className="gap-2">
          <Plus className="w-4 h-4" />
          <span>New Category</span>
        </GlassButton>
      </div>

      {dependencyError && (
        <div className="p-3 rounded-xl bg-destructive/15 text-destructive text-xs flex items-center justify-between border border-destructive/20 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{dependencyError}</span>
          </div>
          <button
            onClick={() => setDependencyError(null)}
            className="text-xs font-bold underline hover:opacity-80"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <SearchInput
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onClear={() => setSearchQuery('')}
          placeholder="Search categories..."
        />
      </div>

      <DataTable
        columns={columns}
        data={filteredCategories}
        keyExtractor={(c) => c.id}
        emptyMessage="No categories created yet."
      />

      {/* Create Dialog */}
      <FormDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add Category"
        description="Creates a new category for storefront navigation and product grouping"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 pt-2">
          <GlassInput
            label="Category Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Mechanical Keyboards"
          />
          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-medium text-foreground/85">
              Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description for customer category pages..."
              className="glass-input w-full p-3 text-sm rounded-control text-foreground outline-none focus:ring-2 focus:ring-ring/40"
            />
          </div>
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="catVisibleCheck"
              checked={isVisible}
              onChange={(e) => setIsVisible(e.target.checked)}
              className="rounded border-border text-primary"
            />
            <label htmlFor="catVisibleCheck" className="text-xs font-medium text-foreground cursor-pointer">
              Visible on storefront navigation
            </label>
          </div>
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border/40">
            <GlassButton type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </GlassButton>
            <GlassButton type="submit" variant="primary">
              Create Category
            </GlassButton>
          </div>
        </form>
      </FormDialog>

      {/* Edit Dialog */}
      <FormDialog
        isOpen={!!editingCategory}
        onClose={() => setEditingCategory(null)}
        title={`Edit Category: ${editingCategory?.name}`}
      >
        <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
          <GlassInput
            label="Category Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-medium text-foreground/85">
              Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="glass-input w-full p-3 text-sm rounded-control text-foreground outline-none focus:ring-2 focus:ring-ring/40"
            />
          </div>
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="catVisibleEditCheck"
              checked={isVisible}
              onChange={(e) => setIsVisible(e.target.checked)}
              className="rounded border-border text-primary"
            />
            <label htmlFor="catVisibleEditCheck" className="text-xs font-medium text-foreground cursor-pointer">
              Visible on storefront navigation
            </label>
          </div>
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border/40">
            <GlassButton type="button" variant="outline" onClick={() => setEditingCategory(null)}>
              Cancel
            </GlassButton>
            <GlassButton type="submit" variant="primary">
              Update Category
            </GlassButton>
          </div>
        </form>
      </FormDialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingCategory}
        onCancel={() => setDeletingCategory(null)}
        onConfirm={confirmDelete}
        title={`Delete Category "${deletingCategory?.name}"?`}
        description="Are you sure you want to remove this category? Products without this category will need reassignment."
        confirmLabel="Delete Category"
        isDestructive
      />
    </DashboardLayout>
  );
}
