'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { DataTable, Column } from '@/components/ui/data-table';
import { GlassButton } from '@/components/ui/glass-button';
import { GlassBadge } from '@/components/ui/glass-badge';
import { GlassInput } from '@/components/ui/glass-input';
import { SearchInput } from '@/components/ui/search-input';
import { FilterBar } from '@/components/ui/filter-bar';
import { FormDialog } from '@/components/ui/form-dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { MOCK_PRODUCTS, MOCK_CATEGORIES } from '@/lib/mock-data';
import { ProductItem } from '@/types';
import { formatCurrency, slugify } from '@/lib/utils';
import { Plus, Edit2, Trash2, Image as ImageIcon, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductItem[]>(MOCK_PRODUCTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<ProductItem | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [priceInRupees, setPriceInRupees] = useState<number>(0);
  const [comparePriceInRupees, setComparePriceInRupees] = useState<number>(0);
  const [categoryId, setCategoryId] = useState(MOCK_CATEGORIES[0].id);
  const [stockQuantity, setStockQuantity] = useState<number>(10);
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(5);
  const [imageUrl, setImageUrl] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [badge, setBadge] = useState('Best Seller');
  const [badgeColor, setBadgeColor] = useState<'amber' | 'cyan' | 'purple' | 'emerald' | 'rose' | 'blue'>('amber');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      categoryFilter === 'ALL' ? true : p.categoryId === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const handleOpenCreate = () => {
    setName('');
    setSku('');
    setDescription('');
    setPriceInRupees(1999);
    setComparePriceInRupees(2499);
    setCategoryId(MOCK_CATEGORIES[0].id);
    setStockQuantity(20);
    setLowStockThreshold(5);
    setImageUrl('/images/products/wild-forest-honey.jpg');
    setIsPublished(true);
    setBadge('Best Seller');
    setBadgeColor('amber');
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (p: ProductItem) => {
    setEditingProduct(p);
    setName(p.name);
    setSku(p.sku);
    setDescription(p.description);
    setPriceInRupees(p.price / 100);
    setComparePriceInRupees(p.compareAtPrice ? p.compareAtPrice / 100 : 0);
    setCategoryId(p.categoryId);
    setStockQuantity(p.stockQuantity);
    setLowStockThreshold(p.lowStockThreshold);
    setImageUrl(p.images[0]?.url || '');
    setIsPublished(p.isPublished);
    setBadge(p.badge || '');
    setBadgeColor(p.badgeColor || 'amber');
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const priceMinor = Math.round(priceInRupees * 100);
    const comparePriceMinor = comparePriceInRupees > 0 ? Math.round(comparePriceInRupees * 100) : null;
    const cat = MOCK_CATEGORIES.find((c) => c.id === categoryId);

    const newProduct: ProductItem = {
      id: `prod-${Date.now()}`,
      slug: slugify(name),
      sku,
      name,
      description,
      price: priceMinor,
      compareAtPrice: comparePriceMinor,
      categoryId,
      category: cat,
      stockQuantity,
      reservedQuantity: 0,
      lowStockThreshold,
      isPublished,
      badge: badge.trim() || undefined,
      badgeColor: badge.trim() ? badgeColor : undefined,
      images: imageUrl
        ? [{ id: `img-${Date.now()}`, url: imageUrl, altText: name, position: 0 }]
        : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct),
      });
    } catch {}

    setProducts((prev) => [newProduct, ...prev]);
    setIsCreateOpen(false);
    setIsSubmitting(false);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setIsSubmitting(true);

    const priceMinor = Math.round(priceInRupees * 100);
    const comparePriceMinor = comparePriceInRupees > 0 ? Math.round(comparePriceInRupees * 100) : null;
    const cat = MOCK_CATEGORIES.find((c) => c.id === categoryId);

    const updated: ProductItem = {
      ...editingProduct,
      name,
      sku,
      description,
      price: priceMinor,
      compareAtPrice: comparePriceMinor,
      categoryId,
      category: cat,
      stockQuantity,
      lowStockThreshold,
      isPublished,
      badge: badge.trim() || undefined,
      badgeColor: badge.trim() ? badgeColor : undefined,
      images: imageUrl
        ? [{ id: editingProduct.images[0]?.id || `img-${Date.now()}`, url: imageUrl, altText: name, position: 0 }]
        : editingProduct.images,
      updatedAt: new Date().toISOString(),
    };

    try {
      await fetch(`/api/products/${editingProduct.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch {}

    setProducts((prev) =>
      prev.map((p) => (p.id === editingProduct.id ? updated : p))
    );
    setEditingProduct(null);
    setIsSubmitting(false);
  };

  const handleConfirmDelete = async () => {
    if (!deletingProduct) return;
    try {
      await fetch(`/api/products/${deletingProduct.id}`, { method: 'DELETE' });
    } catch {}
    setProducts((prev) => prev.filter((p) => p.id !== deletingProduct.id));
    setDeletingProduct(null);
  };

  const columns: Column<ProductItem>[] = [
    {
      key: 'name',
      header: 'Product',
      render: (product) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden glass-control shrink-0 relative bg-muted/20">
            {product.images[0] ? (
              <img
                src={product.images[0].url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center w-full h-full text-muted-foreground">
                <ImageIcon className="w-4 h-4" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="font-semibold text-foreground text-sm truncate">{product.name}</p>
              {product.badge && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border border-primary/30 bg-primary/10 text-primary">
                  {product.badge}
                </span>
              )}
            </div>
            <p className="text-xs font-mono text-muted-foreground">{product.sku}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (product) => (
        <GlassBadge variant="default" size="sm">
          {product.category?.name || 'General'}
        </GlassBadge>
      ),
    },
    {
      key: 'price',
      header: 'Price',
      render: (product) => (
        <div>
          <span className="font-semibold text-foreground text-sm">
            {formatCurrency(product.price)}
          </span>
          {product.compareAtPrice && (
            <p className="text-[11px] text-muted-foreground line-through">
              {formatCurrency(product.compareAtPrice)}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'stock',
      header: 'Inventory',
      render: (product) => {
        const isLow = product.stockQuantity <= product.lowStockThreshold;
        return (
          <div className="space-y-0.5">
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-block ${
                isLow
                  ? 'bg-rose-500/15 text-rose-500 border border-rose-500/20'
                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {product.stockQuantity} in stock
            </span>
            {isLow && (
              <p className="text-[10px] text-rose-500 font-medium">Low stock alert</p>
            )}
          </div>
        );
      },
    },
    {
      key: 'isPublished',
      header: 'Visibility',
      render: (product) => (
        <GlassBadge variant={product.isPublished ? 'success' : 'outline'} size="sm">
          {product.isPublished ? 'Published' : 'Draft'}
        </GlassBadge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (product) => (
        <div className="flex items-center justify-end gap-1.5">
          <GlassButton
            variant="outline"
            size="sm"
            onClick={() => handleOpenEdit(product)}
            title="Edit product"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </GlassButton>
          <GlassButton
            variant="destructive"
            size="sm"
            onClick={() => setDeletingProduct(product)}
            title="Delete product"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </GlassButton>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout role="ADMIN" title="Product Catalog Management" userName="Super Admin">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            Product Catalog
          </h2>
          <p className="text-xs text-muted-foreground">
            Manage merchandise items, specifications, pricing, and stock limits
          </p>
        </div>
        <GlassButton variant="primary" size="md" onClick={handleOpenCreate} className="gap-2">
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </GlassButton>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <FilterBar
          options={[
            { label: 'All Items', value: 'ALL', count: products.length },
            ...MOCK_CATEGORIES.map((c) => ({
              label: c.name,
              value: c.id,
              count: products.filter((p) => p.categoryId === c.id).length,
            })),
          ]}
          selectedValue={categoryFilter}
          onSelect={setCategoryFilter}
        />

        <SearchInput
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onClear={() => setSearchQuery('')}
          placeholder="Search products by title, SKU, or tags..."
        />
      </div>

      {/* Products Data Table */}
      <DataTable
        columns={columns}
        data={filteredProducts}
        keyExtractor={(p) => p.id}
        emptyMessage="No products match the selected criteria."
      />

      {/* Create Product Dialog */}
      <FormDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add New Merchandise Item"
        description="Configure product specifications, images, pricing, and stock limits"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <GlassInput
              label="Product Title"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!sku) setSku(e.target.value.substring(0, 3).toUpperCase() + '-001');
              }}
              placeholder="e.g. Lumina 65 Smoky Glass Keyboard"
            />
            <GlassInput
              label="SKU Identifier"
              required
              value={sku}
              onChange={(e) => setSku(e.target.value.toUpperCase())}
              placeholder="e.g. LUM-65-SMK"
            />
          </div>

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-medium text-foreground/85">
              Description
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Physical specifications, materials, and features..."
              className="glass-input w-full p-3 text-sm rounded-control text-foreground placeholder:text-muted-foreground/60 transition-all outline-none focus:ring-2 focus:ring-ring/40"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <GlassInput
              label="Retail Price (INR)"
              type="number"
              required
              min={1}
              value={priceInRupees || ''}
              onChange={(e) => setPriceInRupees(Number(e.target.value))}
              placeholder="18999"
            />
            <GlassInput
              label="Compare At Price (INR)"
              type="number"
              min={0}
              value={comparePriceInRupees || ''}
              onChange={(e) => setComparePriceInRupees(Number(e.target.value))}
              placeholder="Optional comparison price"
            />
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-medium text-foreground/85">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="glass-input w-full h-10 px-3 text-sm rounded-control text-foreground outline-none focus:ring-2 focus:ring-ring/40 bg-card"
              >
                {MOCK_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id} className="bg-background text-foreground">
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <GlassInput
              label="Current Stock Quantity"
              type="number"
              required
              min={0}
              value={stockQuantity}
              onChange={(e) => setStockQuantity(Number(e.target.value))}
            />
            <GlassInput
              label="Low Stock Warning Level"
              type="number"
              required
              min={1}
              value={lowStockThreshold}
              onChange={(e) => setLowStockThreshold(Number(e.target.value))}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <GlassInput
              label="Product Badge Tag"
              value={badge}
              onChange={(e) => setBadge(e.target.value)}
              placeholder="e.g. Best Seller, Rare Harvest"
              hint="Prominently displayed on card and product page"
            />
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-medium text-foreground/85">
                Badge Color Accent
              </label>
              <select
                value={badgeColor}
                onChange={(e) => setBadgeColor(e.target.value as any)}
                className="glass-input w-full h-10 px-3 text-sm rounded-control text-foreground outline-none focus:ring-2 focus:ring-ring/40 bg-card"
              >
                <option value="amber">Amber (Golden)</option>
                <option value="cyan">Cyan (Cool Alpine)</option>
                <option value="purple">Purple (Royal Saffron)</option>
                <option value="emerald">Emerald (Organic Raw)</option>
                <option value="rose">Rose (Artisan Comb)</option>
                <option value="blue">Blue (Crafted Wood)</option>
              </select>
            </div>
          </div>

          <GlassInput
            label="Image Asset URL"
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="/images/products/wild-forest-honey.jpg"
            hint="S3 or public image link"
          />

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isPublishedCheck"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="rounded border-border text-primary focus:ring-ring"
            />
            <label htmlFor="isPublishedCheck" className="text-xs font-medium text-foreground cursor-pointer">
              Publish immediately on storefront
            </label>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border/40">
            <GlassButton type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </GlassButton>
            <GlassButton type="submit" variant="primary" isLoading={isSubmitting}>
              Save Product
            </GlassButton>
          </div>
        </form>
      </FormDialog>

      {/* Edit Product Dialog */}
      <FormDialog
        isOpen={!!editingProduct}
        onClose={() => setEditingProduct(null)}
        title={`Edit Product: ${editingProduct?.name}`}
        maxWidth="2xl"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <GlassInput
              label="Product Title"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <GlassInput
              label="SKU Identifier"
              required
              value={sku}
              onChange={(e) => setSku(e.target.value.toUpperCase())}
            />
          </div>

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-medium text-foreground/85">
              Description
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="glass-input w-full p-3 text-sm rounded-control text-foreground outline-none focus:ring-2 focus:ring-ring/40"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <GlassInput
              label="Price (INR)"
              type="number"
              required
              min={1}
              value={priceInRupees || ''}
              onChange={(e) => setPriceInRupees(Number(e.target.value))}
            />
            <GlassInput
              label="Compare At Price (INR)"
              type="number"
              min={0}
              value={comparePriceInRupees || ''}
              onChange={(e) => setComparePriceInRupees(Number(e.target.value))}
            />
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-medium text-foreground/85">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="glass-input w-full h-10 px-3 text-sm rounded-control text-foreground outline-none focus:ring-2 focus:ring-ring/40 bg-card"
              >
                {MOCK_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id} className="bg-background text-foreground">
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <GlassInput
              label="Stock Quantity"
              type="number"
              required
              min={0}
              value={stockQuantity}
              onChange={(e) => setStockQuantity(Number(e.target.value))}
            />
            <GlassInput
              label="Low Stock Alert Threshold"
              type="number"
              required
              min={1}
              value={lowStockThreshold}
              onChange={(e) => setLowStockThreshold(Number(e.target.value))}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <GlassInput
              label="Product Badge Tag"
              value={badge}
              onChange={(e) => setBadge(e.target.value)}
              placeholder="e.g. Best Seller, Rare Harvest"
            />
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-medium text-foreground/85">
                Badge Color Accent
              </label>
              <select
                value={badgeColor}
                onChange={(e) => setBadgeColor(e.target.value as any)}
                className="glass-input w-full h-10 px-3 text-sm rounded-control text-foreground outline-none focus:ring-2 focus:ring-ring/40 bg-card"
              >
                <option value="amber">Amber (Golden)</option>
                <option value="cyan">Cyan (Cool Alpine)</option>
                <option value="purple">Purple (Royal Saffron)</option>
                <option value="emerald">Emerald (Organic Raw)</option>
                <option value="rose">Rose (Artisan Comb)</option>
                <option value="blue">Blue (Crafted Wood)</option>
              </select>
            </div>
          </div>

          <GlassInput
            label="Image Asset URL"
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isPublishedEditCheck"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="rounded border-border text-primary focus:ring-ring"
            />
            <label htmlFor="isPublishedEditCheck" className="text-xs font-medium text-foreground cursor-pointer">
              Published on storefront
            </label>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border/40">
            <GlassButton type="button" variant="outline" onClick={() => setEditingProduct(null)}>
              Cancel
            </GlassButton>
            <GlassButton type="submit" variant="primary" isLoading={isSubmitting}>
              Update Product
            </GlassButton>
          </div>
        </form>
      </FormDialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingProduct}
        onCancel={() => setDeletingProduct(null)}
        onConfirm={handleConfirmDelete}
        title={`Delete "${deletingProduct?.name}"?`}
        description="This will permanently delete or archive this product from the catalog. Existing historical orders will preserve their purchase snapshots."
        confirmLabel="Delete Product"
        isDestructive
      />
    </DashboardLayout>
  );
}
