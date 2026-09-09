import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Plus, Trash2, Pencil, X, Check } from "lucide-react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin-shell";
import { SectionTitle } from "@/components/shell";
import { fetchCategories, createCategory, updateCategory, deleteCategory, type Category } from "@/lib/spiderhex";

export const Route = createFileRoute("/admin/categories")({
  component: () => (
    <AdminShell>
      <CategoriesAdmin />
    </AdminShell>
  ),
  head: () => ({
    meta: [
      { title: "Categories — SPIDER HEX Admin" },
      { name: "description", content: "Manage product categories." },
    ],
  }),
});

const field = "w-full rounded border border-border bg-background/60 px-3 py-2 text-xs text-foreground outline-none focus:border-primary";

function CategoriesAdmin() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCategory, setNewCategory] = useState({ name: "", displayName: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await fetchCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleCreate = async () => {
    if (!newCategory.name.trim() || !newCategory.displayName.trim()) {
      toast.error("Name and display name are required");
      return;
    }

    const err = await createCategory(newCategory.name.trim(), newCategory.displayName.trim());
    if (err) {
      toast.error(err);
      return;
    }

    toast.success("Category created");
    setNewCategory({ name: "", displayName: "" });
    loadCategories();
  };

  const handleUpdate = async (id: string) => {
    if (!editValue.trim()) {
      toast.error("Display name is required");
      return;
    }

    const err = await updateCategory(id, editValue.trim());
    if (err) {
      toast.error(err);
      return;
    }

    toast.success("Category updated");
    setEditingId(null);
    loadCategories();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this category?")) return;

    const err = await deleteCategory(id);
    if (err) {
      toast.error(err);
      return;
    }

    toast.success("Category deleted");
    loadCategories();
  };

  if (loading) {
    return (
      <AdminShell>
        <SectionTitle sub="// MANAGE CATEGORIES">CATEGORIES</SectionTitle>
        <div className="flex justify-center items-center py-20">
          <p className="text-sm text-muted-foreground">LOADING...</p>
        </div>
      </AdminShell>
    );
  }

  return (
    <>
      <SectionTitle sub="// MANAGE CATEGORIES">CATEGORIES</SectionTitle>

      <div className="panel p-5 mb-6">
        <p className="text-[11px] tracking-[0.2em] text-muted-foreground">ADD NEW CATEGORY</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <input
            className={`${field} flex-1 min-w-[150px]`}
            placeholder="Category ID (e.g. pc_panel)"
            value={newCategory.name}
            onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
          />
          <input
            className={`${field} flex-1 min-w-[150px]`}
            placeholder="Display Name (e.g. PC PANEL)"
            value={newCategory.displayName}
            onChange={(e) => setNewCategory({ ...newCategory, displayName: e.target.value })}
          />
          <button
            onClick={handleCreate}
            className="rounded bg-primary px-4 py-2 text-[11px] font-bold text-primary-foreground hover:opacity-90 flex items-center gap-1"
          >
            <Plus className="h-4 w-4" /> ADD
          </button>
        </div>
      </div>

      <div className="panel overflow-x-auto">
        {categories.length === 0 ? (
          <p className="p-8 text-center text-xs text-muted-foreground">NO CATEGORIES YET</p>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="text-[10px] tracking-[0.15em] text-muted-foreground">
              <tr className="border-b border-border">
                <th className="p-3">ID</th>
                <th className="p-3">DISPLAY NAME</th>
                <th className="p-3">SORT ORDER</th>
                <th className="p-3 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id} className="border-b border-border/50">
                  <td className="p-3 text-muted-foreground">{cat.id}</td>
                  <td className="p-3">
                    {editingId === cat.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          className={field}
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          autoFocus
                        />
                        <button
                          onClick={() => handleUpdate(cat.id)}
                          className="rounded border border-primary/50 p-1 text-primary hover:bg-accent"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="rounded border border-danger/50 p-1 text-danger hover:bg-danger/10"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      cat.display_name
                    )}
                  </td>
                  <td className="p-3 text-muted-foreground">{cat.sort_order}</td>
                  <td className="p-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setEditingId(cat.id);
                          setEditValue(cat.display_name);
                        }}
                        className="rounded border border-border p-2 text-muted-foreground hover:text-primary"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id)}
                        className="rounded border border-danger/50 p-2 text-danger hover:bg-danger/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}