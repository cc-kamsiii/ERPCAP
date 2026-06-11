import { useState, useEffect, useCallback, useRef } from "react";
import {
  Search,
  Plus,
  X,
  Upload,
  ImageIcon,
  Eye,
  Pencil,
  Archive,
} from "lucide-react";
import { supabase } from "../api/supabase";


const isLowStock = (item) => (item.stock ?? 0) <= 5;

const uploadImage = async (file) => {
  const ext = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from("products")
    .upload(fileName, file, { upsert: false });

  if (error) {
    console.error("Storage upload error:", error);
    return null;
  }

  const { data } = supabase.storage.from("products").getPublicUrl(fileName);
  return data.publicUrl;
};


const EMPTY_FORM = {
  product_code: "",
  product_name: "",
  category: "Women",
  stock: "",
  shopee_sold: "",
  lazada_sold: "",
  tiktok_sold: "",
};

function AddProductModal({ onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef();

  const set = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  const handleFile = (file) => {
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = async () => {
    if (!form.product_code.trim() || !form.product_name.trim()) {
      setError("Product code and name are required.");
      return;
    }
    setSaving(true);
    setError("");

    let image_url = null;
    if (imageFile) {
      image_url = await uploadImage(imageFile);
      if (!image_url) {
        setError("Image upload failed. Check your Supabase storage bucket.");
        setSaving(false);
        return;
      }
    }

    const shopee = parseInt(form.shopee_sold) || 0;
    const lazada = parseInt(form.lazada_sold) || 0;
    const tiktok = parseInt(form.tiktok_sold) || 0;

    const payload = {
      product_code: form.product_code.trim().toUpperCase(),
      product_name: form.product_name.trim(),
      category: form.category,
      stock: parseInt(form.stock) || 0,
      shopee_sold: shopee,
      lazada_sold: lazada,
      tiktok_sold: tiktok,
      total_sold: shopee + lazada + tiktok,
      image_url,
      updated_at: new Date().toISOString(),
    };

    const { error: dbErr } = await supabase.from("inventory").insert([payload]);
    if (dbErr) {
      setError(dbErr.message);
      setSaving(false);
      return;
    }

    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-800">Add New Product</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* Code + Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                Product Code *
              </label>
              <input
                type="text"
                placeholder="e.g. F036"
                value={form.product_code}
                onChange={(e) => set("product_code", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                Category *
              </label>
              <select
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
              >
                <option value="Women">Women</option>
                <option value="Men">Men</option>
              </select>
            </div>
          </div>

          {/* Product name */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
              Product Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Dior Sauvage dupe 85ml"
              value={form.product_name}
              onChange={(e) => set("product_name", e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
            />
          </div>

          {/* Stock + Sales */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-amber-700 mb-1 uppercase tracking-wide">
                Stock on Hand
              </label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={form.stock}
                onChange={(e) => set("stock", e.target.value)}
                className="w-full border border-amber-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-red-600 mb-1 uppercase tracking-wide">
                Shopee Sold
              </label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={form.shopee_sold}
                onChange={(e) => set("shopee_sold", e.target.value)}
                className="w-full border border-red-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-indigo-700 mb-1 uppercase tracking-wide">
                Lazada Sold
              </label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={form.lazada_sold}
                onChange={(e) => set("lazada_sold", e.target.value)}
                className="w-full border border-indigo-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">
                TikTok Sold
              </label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={form.tiktok_sold}
                onChange={(e) => set("tiktok_sold", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
              />
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 border border-red-200">
              {error}
            </p>
          )}
        </div>

        {/* Modal footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-5 py-2 text-sm font-semibold text-white bg-red-700 rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving…" : "Add Product"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ImageCell ──────────────────────────────────────────────────────────────

function ImageCell({ item, onUploaded }) {
  const fileInputRef = useRef();
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true);
    const imageUrl = await uploadImage(file);
    if (imageUrl) {
      const { error } = await supabase
        .from("inventory")
        .update({ image_url: imageUrl, updated_at: new Date().toISOString() })
        .eq("id", item.id);
      if (!error) onUploaded(item.id, imageUrl);
    }
    setUploading(false);
  };

  return (
    <td className="px-2 py-1.5 text-center border-r border-gray-200 w-16">
      <div
        onClick={() => !uploading && fileInputRef.current?.click()}
        title={item.image_url ? "Click to replace image" : "Click to add image"}
        className="mx-auto w-10 h-10 rounded-md overflow-hidden border border-gray-200 cursor-pointer hover:ring-2 hover:ring-red-400 transition-all flex items-center justify-center bg-gray-50"
      >
        {uploading ? (
          <span className="text-xs text-gray-400 animate-pulse">↑</span>
        ) : item.image_url ? (
          <img
            src={item.image_url}
            alt={item.product_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <ImageIcon size={14} className="text-gray-300" />
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files[0])}
      />
    </td>
  );
}

// ── Inventory ──────────────────────────────────────────────────────────────

function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [editingStock, setEditingStock] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("inventory")
      .select("*")
      .order("category", { ascending: true })
      .order("product_name", { ascending: true });

    if (!error && data) {
      setInventory(data);
      setLastUpdated(new Date());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // Update image in local state after upload (no full refetch needed)
  const handleImageUploaded = (id, imageUrl) => {
    setInventory((prev) =>
      prev.map((i) => (i.id === id ? { ...i, image_url: imageUrl } : i)),
    );
  };

  const filtered = inventory.filter((item) => {
    const matchCat =
      filterCategory === "All" || item.category === filterCategory;
    const matchSearch =
      !search ||
      item.product_name.toLowerCase().includes(search.toLowerCase()) ||
      item.product_code.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const totals = filtered.reduce(
    (acc, item) => ({
      stock: acc.stock + (item.stock || 0),
      sold: acc.sold + (item.total_sold || 0),
      shopee: acc.shopee + (item.shopee_sold || 0),
      lazada: acc.lazada + (item.lazada_sold || 0),
      tiktok: acc.tiktok + (item.tiktok_sold || 0),
    }),
    { stock: 0, sold: 0, shopee: 0, lazada: 0, tiktok: 0 },
  );

  const saveStock = async (id) => {
    if (!editingStock || editingStock.id !== id) return;
    const newStock = parseInt(editingStock.value);
    if (isNaN(newStock) || newStock < 0) {
      setEditingStock(null);
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("inventory")
      .update({ stock: newStock, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (!error) {
      setInventory((prev) =>
        prev.map((i) => (i.id === id ? { ...i, stock: newStock } : i)),
      );
    }
    setEditingStock(null);
    setSaving(false);
  };

  const handleKeyDown = (e, id) => {
    if (e.key === "Enter") saveStock(id);
    if (e.key === "Escape") setEditingStock(null);
  };

  const TOTAL_COLS = 10;

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Inventory</h1>
        </div>
        <div className="flex gap-2 self-start md:self-auto">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors cursor-pointer"
          >
            <Plus size={15} />
            Add Product
          </button>
          <button
            onClick={fetchInventory}
            disabled={loading}
            className="px-4 py-2 bg-red-700 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loading ? "↻ Loading…" : "↻ Refresh"}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow px-4 py-3 flex flex-col md:flex-row gap-3 items-center">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Search size={18} />
          </span>
          <input
            type="text"
            placeholder="Search product name or code…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none"
            >
              ×
            </button>
          )}
        </div>
        <div className="flex gap-2">
          {["All", "Men", "Women"].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                filterCategory === cat
                  ? cat === "Men"
                    ? "bg-blue-600 text-white"
                    : cat === "Women"
                      ? "bg-pink-500 text-white"
                      : "bg-red-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <p className="text-sm text-gray-400 whitespace-nowrap">
          {filtered.length} products
        </p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse border border-gray-300">
            <thead>
              <tr>
                {/* rowSpan=2 headers */}
                <th
                  className="bg-gray-100 border border-gray-300 w-8"
                  rowSpan={2}
                />
                <th
                  className="bg-gray-100 border border-gray-300 px-3 py-2 text-left text-xs font-bold text-gray-700"
                  rowSpan={2}
                >
                  CODE
                </th>
                <th
                  className="bg-gray-100 border border-gray-300 px-3 py-2 text-left text-xs font-bold text-gray-700 min-w-[200px]"
                  rowSpan={2}
                >
                  PRODUCT NAME
                </th>

                <th className="bg-amber-400 text-amber-900 border border-amber-500 px-3 py-1.5 text-center text-xs font-bold">
                  STOCK
                </th>
                <th className="bg-[#EE4D2D] text-white border border-red-600 px-3 py-1.5 text-center text-xs font-bold">
                  SHOPEE
                </th>
                <th className="bg-violet-700 text-white border border-indigo-800 px-3 py-1.5 text-center text-xs font-bold">
                  LAZADA
                </th>
                <th className="bg-gray-800 text-white border border-gray-900 px-3 py-1.5 text-center text-xs font-bold">
                  TIKTOK
                </th>
                <th className="bg-gray-600 text-white border border-gray-700 px-3 py-1.5 text-center text-xs font-bold">
                  TOTAL SOLD
                </th>
                <th
                  className="bg-emerald-800 text-white border border-emerald-700 px-3 py-1.5 text-center text-xs font-bold"
                  rowSpan={1}
                >
                  ACTION
                </th>
              </tr>
              <tr>
                <th className="bg-amber-100 border border-amber-200 px-3 py-1 text-center text-xs font-semibold text-amber-800">
                  ON HAND
                </th>
                <th className="bg-red-100 border border-red-200 px-3 py-1 text-center text-xs font-semibold text-red-700">
                  QTY
                </th>
                <th className="bg-indigo-100 border border-indigo-200 px-3 py-1 text-center text-xs font-semibold text-indigo-700">
                  QTY
                </th>
                <th className="bg-gray-100 border border-gray-200 px-3 py-1 text-center text-xs font-semibold text-gray-700">
                  QTY
                </th>
                <th className="bg-gray-100 border border-gray-200 px-3 py-1 text-center text-xs font-semibold text-gray-700">
                  QTY
                </th>
                <th className="bg-emerald-100 border border-emerald-200 px-3 py-1 text-center text-xs font-semibold text-emerald-800">
                  VIEW · EDIT · ARCHIVE
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                [...Array(10)].map((_, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    {[...Array(TOTAL_COLS)].map((_, j) => (
                      <td key={j} className="px-3 py-2">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={TOTAL_COLS}
                    className="px-4 py-12 text-center text-gray-400"
                  >
                    <p className="text-4xl mb-2">📦</p>
                    <p className="font-medium text-gray-500">
                      No products found
                    </p>
                  </td>
                </tr>
              ) : (
                (() => {
                  const rows = [];
                  let rowNum = 1;
                  let lastCat = null;

                  for (const item of filtered) {
                    if (item.category !== lastCat) {
                      rows.push(
                        <tr key={`cat-${item.category}`}>
                          <td
                            colSpan={TOTAL_COLS}
                            className={`px-3 py-1.5 text-xs font-bold text-white border ${
                              item.category === "Men"
                                ? "bg-blue-600 border-blue-700"
                                : "bg-pink-500 border-pink-600"
                            }`}
                          >
                            {item.category.toUpperCase()}
                          </td>
                        </tr>,
                      );
                      lastCat = item.category;
                    }

                    const low = isLowStock(item);
                    const hasSold = (item.total_sold || 0) > 0;
                    const rowBg = low
                      ? "bg-red-50"
                      : hasSold
                        ? "bg-green-50 hover:bg-green-100"
                        : rowNum % 2 === 0
                          ? "bg-gray-50 hover:bg-gray-100"
                          : "bg-white hover:bg-gray-50";

                    rows.push(
                      <tr
                        key={item.id}
                        className={`${rowBg} border-b border-gray-200 transition-colors`}
                      >
                        {/* Row number */}
                        <td className="px-2 py-1.5 text-center text-xs text-gray-400 bg-gray-50 border-r border-gray-200 w-8">
                          {rowNum++}
                        </td>

                        {/* Code */}
                        <td className="px-3 py-1.5 text-xs font-mono text-gray-500 border-r border-gray-200 whitespace-nowrap">
                          {item.product_code}
                        </td>

                        {/* Name */}
                        <td className="px-3 py-1.5 text-xs text-gray-800 border-r border-gray-200">
                          <div className="flex items-center gap-2">
                            {item.product_name}
                            {low && (
                              <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-xs rounded font-medium shrink-0">
                                Low
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Stock — click to edit */}
                        <td className="px-3 py-1.5 text-center border-r border-amber-200">
                          {editingStock?.id === item.id ? (
                            <input
                              type="number"
                              min="0"
                              value={editingStock.value}
                              onChange={(e) =>
                                setEditingStock({
                                  id: item.id,
                                  value: e.target.value,
                                })
                              }
                              onBlur={() => saveStock(item.id)}
                              onKeyDown={(e) => handleKeyDown(e, item.id)}
                              autoFocus
                              className="w-16 text-center text-xs border border-amber-400 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-amber-400"
                            />
                          ) : (
                            <button
                              onClick={() =>
                                setEditingStock({
                                  id: item.id,
                                  value: String(item.stock ?? 0),
                                })
                              }
                              title="Click to edit stock"
                              className={`text-xs font-bold px-2 py-0.5 rounded cursor-pointer hover:ring-2 hover:ring-amber-400 transition-all ${
                                low
                                  ? "text-red-700 bg-red-100"
                                  : "text-black bg-white-100"
                              }`}
                            >
                              {item.stock ?? 0}
                            </button>
                          )}
                        </td>

                        {/* Shopee */}
                        <td
                          className={`px-3 py-1.5 text-center text-xs font-semibold border-r border-red-100 ${(item.shopee_sold || 0) > 0 ? "text-red-700" : "text-gray-300"}`}
                        >
                          {item.shopee_sold || 0}
                        </td>

                        {/* Lazada */}
                        <td
                          className={`px-3 py-1.5 text-center text-xs font-semibold border-r border-indigo-100 ${(item.lazada_sold || 0) > 0 ? "text-indigo-700" : "text-gray-300"}`}
                        >
                          {item.lazada_sold || 0}
                        </td>

                        {/* TikTok */}
                        <td
                          className={`px-3 py-1.5 text-center text-xs font-semibold border-r border-gray-200 ${(item.tiktok_sold || 0) > 0 ? "text-gray-800" : "text-gray-300"}`}
                        >
                          {item.tiktok_sold || 0}
                        </td>

                        {/* Total sold */}
                        <td
                          className={`px-3 py-1.5 text-center text-xs font-bold ${(item.total_sold || 0) > 0 ? "text-gray-800" : "text-gray-300"}`}
                        >
                          {item.total_sold || 0}
                        </td>
                        <td className="px-1.5 py-1 text-center border border-gray-300 ">
                          <div className="flex items-center justify-center gap-5">
                            <button
                              onClick={() => onView?.(item)}
                              title="View"
                              className="p-0.5 rounded hover:bg-blue-100 transition-colors cursor-pointer"
                            >
                              <Eye size={20} className="text-blue-600" />
                            </button>
                            <button
                              onClick={() => onEdit?.(item)}
                              title="Edit"
                              className="p-0.5 rounded hover:bg-amber-100 transition-colors cursor-pointer"
                            >
                              <Pencil size={20} className="text-amber-600" />
                            </button>
                            <button
                              onClick={() => onArchive?.(item)}
                              title="Archive"
                              className="p-0.5 rounded hover:bg-pink-100 transition-colors cursor-pointer"
                            >
                              <Archive size={20} className="text-pink-600" />
                            </button>
                          </div>
                        </td>
                      </tr>,
                    );
                  }
                  return rows;
                })()
              )}

              {/* Totals footer */}
              {!loading && filtered.length > 0 && (
                <tr className="bg-amber-400 border-t-2 border-amber-500 font-bold">
                  <td className="px-2 py-2 text-center text-xs text-amber-900 border-r border-amber-500">
                    —
                  </td>
                  <td className="border-r border-amber-500" />
                  <td className="px-3 py-2 text-xs text-amber-900 border-r border-amber-500">
                    TOTAL ({filtered.length} products)
                  </td>
                  {/* empty IMAGE cell in footer */}
                  <td className="border-r border-amber-500" />
                  <td className="px-3 py-2 text-center text-xs font-bold text-amber-900 border-r border-amber-500">
                    {totals.stock.toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-center text-xs font-bold text-red-900 border-r border-amber-500">
                    {totals.shopee.toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-center text-xs font-bold text-indigo-900 border-r border-amber-500">
                    {totals.lazada.toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-center text-xs font-bold text-gray-900 border-r border-amber-500">
                    {totals.tiktok.toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-center text-xs font-bold text-gray-900">
                    {totals.sold.toLocaleString()}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 flex-wrap text-xs text-gray-500 pb-2">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-green-100 border border-green-400 inline-block" />
          Has sales
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-red-100 border border-red-300 inline-block" />
          Low stock (≤ 5)
        </span>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <AddProductModal
          onClose={() => setShowAddModal(false)}
          onSaved={fetchInventory}
        />
      )}
    </div>
  );
}

export default Inventory;
