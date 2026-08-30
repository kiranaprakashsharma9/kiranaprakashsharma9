"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { useAdminSession } from "@/hooks/useAdminSession";
import { FiEdit3, FiTrash2 } from "react-icons/fi";

// Compress images on the client before uploading to storage to reduce size
async function compressImageFile(file, maxDimension = 2000, quality = 0.9) {
  if (!file) return file;
  // Prefer createImageBitmap when available
  try {
    const bitmap = await createImageBitmap(file);
    let { width, height } = bitmap;
    const max = Math.max(width, height);
    let scale = 1;
    if (max > maxDimension) scale = maxDimension / max;
    const w = Math.round(width * scale);
    const h = Math.round(height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0, w, h);

    // Use webp for better compression; fallback to original type if not supported
    const mime = 'image/webp';
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, mime, quality));
    if (!blob) return file;
    // Return a File with .webp extension to keep names unique/small
    const newName = file.name.replace(/\.[^/.]+$/, '.webp');
    return new File([blob], newName, { type: blob.type });
  } catch (err) {
    // Fallback to returning original file
    console.warn('Image compression failed, uploading original file', err);
    return file;
  }
}

const GROUPS = [
  { key: "shuba", label: "Shuba (Auspicious Poojas)" },
  { key: "ashuba", label: "Ashuba (Post-death Rituals)" },
];

export default function AdminDashboardPage() {
  const { status, user } = useAdminSession({ redirectIfNotAdmin: true });

  const [group, setGroup] = useState("shuba");
  const [categoryOptions, setCategoryOptions] = useState(["shuba"]);
  const [selectedCategory, setSelectedCategory] = useState("shuba");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [images, setImages] = useState([]);
  const [loadingImages, setLoadingImages] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);
  const [editingImage, setEditingImage] = useState(null);
  const [editCaption, setEditCaption] = useState("");
  const [editFile, setEditFile] = useState(null);
  const [updatingImage, setUpdatingImage] = useState(false);
  const [trackedData, setTrackedData] = useState({
    totalVisits: 0,
    uniqueVisitors: 0,
    pageViews: 0,
    conversions: 0,
    avgSession: "00:00",
    bounceRate: 0,
    recentActivity: [{ label: "Loading analytics...", type: "page", time: "Please wait" }],
  });
  const [analyticsStatus, setAnalyticsStatus] = useState("loading");

  useEffect(() => {
    if (status === "admin") {
      loadCategories();
      fetchAnalytics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, group]);

  useEffect(() => {
    if (status === "admin") {
      loadImages();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, selectedCategory]);

  async function fetchAnalytics() {
    try {
      setAnalyticsStatus("loading");
      const response = await fetch("/api/admin/analytics");
      const result = await response.json();

      if (!response.ok || !result.success || !result.data) {
        setAnalyticsStatus("not-configured");
        setTrackedData(result?.data || {
          totalVisits: 0,
          uniqueVisitors: 0,
          pageViews: 0,
          conversions: 0,
          avgSession: "00:00",
          bounceRate: 0,
          recentActivity: [{ label: "Google Analytics not configured", type: "page", time: "Setup required" }],
        });
        return;
      }

      setTrackedData(result.data);
      setAnalyticsStatus("ready");
    } catch (error) {
      console.error("Analytics fetch failed:", error);
      setAnalyticsStatus("error");
      setTrackedData({
        totalVisits: 0,
        uniqueVisitors: 0,
        pageViews: 0,
        conversions: 0,
        avgSession: "00:00",
        bounceRate: 0,
        recentActivity: [{ label: "Analytics unavailable", type: "page", time: "Check service config" }],
      });
    }
  }

  async function loadCategories() {
    setLoadingCategories(true);
    try {
      const { data: categoryRows, error: categoryError } = await supabase
        .from("gallery_categories")
        .select("value, group")
        .eq("group", group)
        .order("value", { ascending: true });

      if (!categoryError && categoryRows && categoryRows.length > 0) {
        const values = Array.from(
          new Set(
            categoryRows
              .map((item) => item.value)
              .filter(Boolean)
              .filter((value) => value === group || value.startsWith(`${group}/`))
          )
        );

        const options = values.length > 0 ? [group, ...values.filter((value) => value !== group)] : [group];
        setCategoryOptions(options);
        setSelectedCategory((current) => (options.includes(current) ? current : options[0]));
        setLoadingCategories(false);
        return;
      }

      const { data, error } = await supabase
        .from("gallery_images")
        .select("category")
        .like("category", `${group}%`);

      if (error) throw error;

      const values = Array.from(
        new Set(
          (data || [])
            .map((item) => item.category)
            .filter(Boolean)
            .filter((value) => value === group || value.startsWith(`${group}/`))
        )
      );

      const options = values.length > 0 ? [group, ...values.filter((value) => value !== group)] : [group];
      setCategoryOptions(options);
      setSelectedCategory((current) => (options.includes(current) ? current : options[0]));
    } catch (error) {
      console.warn("Unable to load gallery categories, using top-level group only:", error);
      const fallback = [group];
      setCategoryOptions(fallback);
      setSelectedCategory(group);
    } finally {
      setLoadingCategories(false);
    }
  }

  async function createCategory(event) {
    if (event) event.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;

    const safeSlug = trimmed
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "category";

    const nextCategory = `${group}/${safeSlug}`;

    try {
      const { error } = await supabase
        .from("gallery_categories")
        .upsert(
          {
            group,
            value: nextCategory,
            slug: safeSlug,
            name: trimmed,
          },
          { onConflict: "group,value" }
        );

      if (!error) {
        setCategoryOptions((current) =>
          current.includes(nextCategory) ? current : [...current, nextCategory],
        );
      }
    } catch (error) {
      console.warn("gallery_categories table not available; using local state only", error);
    }

    setSelectedCategory(nextCategory);
    setNewCategoryName("");
    setMessage({ type: "success", text: `Category "${trimmed}" is ready for upload.` });
  }

  async function removeCategory(categoryValue) {
    if (!categoryValue || categoryValue === group) return;

    const label = categoryValue.replace(`${group}/`, "");
    const confirmed = window.confirm(
      `Remove the "${label}" subcategory? Existing images will move to the main ${group} group.`
    );

    if (!confirmed) return;

    try {
      const { error: categoryTableError } = await supabase
        .from("gallery_categories")
        .delete()
        .eq("group", group)
        .eq("value", categoryValue);

      if (categoryTableError) {
        const { error } = await supabase
          .from("gallery_images")
          .update({ category: group })
          .eq("category", categoryValue);

        if (error) throw error;
      }

      setCategoryOptions((current) => current.filter((value) => value !== categoryValue));
      if (selectedCategory === categoryValue) {
        setSelectedCategory(group);
      }
      setMessage({ type: "success", text: `Subcategory "${label}" removed.` });
      loadImages();
      loadCategories();
    } catch (error) {
      console.error("Failed to remove category:", error);
      setMessage({ type: "error", text: error.message || "Unable to remove category." });
    }
  }

  async function loadImages() {
    setLoadingImages(true);

    let query = supabase.from("gallery_images").select("*");

    if (selectedCategory === group) {
      query = query.like("category", `${group}%`);
    } else {
      query = query.eq("category", selectedCategory);
    }

    const { data, error } = await query
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (!error) setImages(data || []);
    setLoadingImages(false);
  }

  async function handleUpload(e) {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setMessage(null);

    const activeCategory = selectedCategory || group;

    // Compress the image before upload to reduce size (keeps good quality)
    const compressed = await compressImageFile(file, 2000, 0.9);
    const safeName = compressed.name.replace(/\s+/g, "-").toLowerCase();
    const path = `${activeCategory}/${Date.now()}-${safeName}`;

    // 1. Upload the actual file to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("gallery")
      .upload(path, compressed);

    if (uploadError) {
      setMessage({ type: "error", text: uploadError.message });
      setUploading(false);
      return;
    }

    // 2. Get its public URL
    const { data: publicUrlData } = supabase.storage
      .from("gallery")
      .getPublicUrl(path);

    // 3. Save a row pointing to it, so the public site can list/query it
    const { error: insertError } = await supabase.from("gallery_images").insert({
      category: activeCategory,
      storage_path: path,
      image_url: publicUrlData.publicUrl,
      caption: caption || null,
    });

    if (insertError) {
      setMessage({ type: "error", text: insertError.message });
    } else {
      setMessage({ type: "success", text: "Image added." });
      setFile(null);
      setCaption("");
      loadImages();
    }
    setUploading(false);
  }

  async function handleDelete(image) {
    const confirmed = window.confirm("Delete this image? This cannot be undone.");
    if (!confirmed) return;

    await supabase.storage.from("gallery").remove([image.storage_path]);
    await supabase.from("gallery_images").delete().eq("id", image.id);
    loadImages();
  }

  function startEdit(image) {
    setEditingImage(image);
    setEditCaption(image.caption || "");
    setEditFile(null);
    setMessage(null);
  }

  async function handleUpdateImage(e) {
    e.preventDefault();
    if (!editingImage) return;

    setUpdatingImage(true);
    setMessage(null);

    try {
      let imageUrl = editingImage.image_url;
      let storagePath = editingImage.storage_path;

      if (editFile) {
        // compress replacement file before upload
        const compressedEdit = await compressImageFile(editFile, 2000, 0.9);
        const safeName = compressedEdit.name.replace(/\s+/g, "-").toLowerCase();
        const newPath = `${group}/${Date.now()}-${safeName}`;

        const { error: uploadError } = await supabase.storage
          .from("gallery")
          .upload(newPath, compressedEdit);

        if (uploadError) {
          throw new Error(uploadError.message);
        }

        const { data: publicUrlData } = supabase.storage
          .from("gallery")
          .getPublicUrl(newPath);

        imageUrl = publicUrlData.publicUrl;
        storagePath = newPath;
      }

      const { error: updateError } = await supabase
        .from("gallery_images")
        .update({
          caption: editCaption || null,
          image_url: imageUrl,
          storage_path: storagePath,
        })
        .eq("id", editingImage.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      setMessage({ type: "success", text: "Image updated." });
      setEditingImage(null);
      setEditCaption("");
      setEditFile(null);
      loadImages();
    } catch (error) {
      setMessage({ type: "error", text: error.message || "Failed to update image." });
    } finally {
      setUpdatingImage(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.assign(`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/admin/login`);
  }

  if (status === "loading") {
    return (
      <main className="min-h-[60vh] flex items-center justify-center text-gray-500">
        Checking your session...
      </main>
    );
  }

  if (status !== "admin") return null; // hook already redirects to /admin/login

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-orange-700">Admin Dashboard</h1>
          <p className="text-sm text-gray-500">Signed in as {user?.email}</p>
        </div>
        <button
          onClick={handleSignOut}
          className="px-4 py-2 rounded-md border border-orange-600 text-orange-700 hover:bg-orange-50 transition text-sm font-medium"
        >
          Sign Out
        </button>
      </div>

      <section className="mb-8 rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50 via-white to-orange-100 p-6 shadow-sm">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-600">
              User tracked data
            </p>
            <h2 className="mt-2 text-2xl font-bold text-orange-800">
              Website analytics overview
            </h2>
          </div>
          <div className="flex justify-end sm:justify-start">
            <div
              className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-wide sm:text-xs ${
                analyticsStatus === "not-configured"
                  ? "border-red-200 bg-red-50 text-red-600 animate-pulse"
                  : "border-orange-200 bg-white text-orange-700"
              }`}
            >
              {analyticsStatus === "ready" ? "Live summary" : analyticsStatus === "not-configured" ? "Setup required" : "Loading"}
            </div>
          </div>
        </div>

        {analyticsStatus === "not-configured" && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            Google Analytics is not configured yet. Add GA_SERVICE_ACCOUNT_EMAIL, GA_PRIVATE_KEY, and GA_PROPERTY_ID in your environment to enable real tracking.
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
          {[
            { label: "Total visits", value: trackedData.totalVisits.toLocaleString(), accent: "bg-orange-600" },
            { label: "Unique visitors", value: trackedData.uniqueVisitors.toLocaleString(), accent: "bg-amber-500" },
            { label: "Page views", value: trackedData.pageViews.toLocaleString(), accent: "bg-yellow-500" },
            { label: "Conversions", value: trackedData.conversions.toLocaleString(), accent: "bg-emerald-500" },
            { label: "Avg. session", value: trackedData.avgSession, accent: "bg-cyan-500" },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-orange-100 bg-white p-4 shadow-sm">
              <div className={`mb-3 h-2 w-12 rounded-full ${item.accent}`} />
              <p className="text-sm text-gray-500">{item.label}</p>
              <p className="mt-2 text-xl font-bold text-gray-900 sm:text-2xl">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-xl border border-orange-100 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Recent activity</h3>
              <span className="text-xs font-medium text-gray-500">Last 24 hours</span>
            </div>
            <div className="space-y-3">
              {trackedData.recentActivity.map((activity, index) => (
                <div key={`${activity.label}-${index}`} className="flex items-center justify-between rounded-lg bg-orange-50 px-3 py-2">
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex h-2.5 w-2.5 rounded-full ${
                        activity.type === "action" ? "bg-emerald-500" : "bg-orange-500"
                      }`}
                    />
                    <span className="text-sm font-medium text-gray-700">{activity.label}</span>
                  </div>
                  <span className="text-xs text-gray-500">{activity.time}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-orange-100 bg-white p-4 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800">Engagement</h3>
            <div className="mt-5 space-y-4">
              <div>
                <div className="mb-1 flex justify-between text-sm text-gray-600">
                  <span>Bounce rate</span>
                  <span className="font-semibold text-gray-800">{trackedData.bounceRate}%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-orange-100">
                  <div className="h-full rounded-full bg-orange-600" style={{ width: `${trackedData.bounceRate}%` }} />
                </div>
              </div>

              <div className="rounded-lg bg-gradient-to-r from-orange-100 to-amber-100 p-3">
                <p className="text-sm text-gray-600">Most visited page</p>
                <p className="mt-1 text-base font-bold text-orange-700">Home</p>
              </div>

              <div className="rounded-lg bg-gradient-to-r from-emerald-100 to-green-100 p-3">
                <p className="text-sm text-gray-600">Top action</p>
                <p className="mt-1 text-base font-bold text-emerald-700">WhatsApp clicks</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Group tabs */}
      <div className="mb-6 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        {GROUPS.map((c) => (
          <button
            key={c.key}
            onClick={() => {
              setGroup(c.key);
              setSelectedCategory(c.key);
            }}
            className={`rounded-md px-2 py-2 text-[11px] font-semibold transition sm:px-4 sm:text-sm ${
              group === c.key
                ? "bg-orange-600 text-white"
                : "bg-orange-50 text-orange-700 hover:bg-orange-100"
            }`}
            style={{ whiteSpace: "nowrap" }}
          >
            {c.label}
          </button>
        ))}
      </div>

      <form
        onSubmit={handleUpload}
        className="mb-8 rounded-xl border border-orange-100 bg-white p-6 shadow-sm"
      >
        <div className="mb-4 overflow-x-auto pb-1">
          <div className="flex min-w-max gap-2">
            {categoryOptions
              .filter((value) => value !== group)
              .map((value) => {
                const label = value.replace(`${group}/`, "");

                return (
                  <div
                    key={value}
                    className={`flex items-center gap-2 rounded-full border px-2 py-1.5 text-xs font-medium transition ${
                      selectedCategory === value
                        ? "border-orange-600 bg-orange-600 text-white"
                        : "border-orange-200 bg-white text-orange-700 hover:border-orange-400 hover:bg-orange-100"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedCategory(value)}
                      className="whitespace-nowrap"
                    >
                      {label}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeCategory(value)}
                      aria-label={`Remove ${label}`}
                      title={`Remove ${label}`}
                      className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold transition hover:bg-black/10"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Image file
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-600"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Caption
            </label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
              placeholder="Optional"
            />
          </div>
          <button
            type="submit"
            disabled={uploading || !file}
            className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-5 py-2.5 rounded-md transition disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Add Image"}
          </button>
        </div>
      </form>

      {message && (
        <p
          className={`text-sm mb-6 ${
            message.type === "error" ? "text-red-600" : "text-green-600"
          }`}
        >
          {message.text}
        </p>
      )}

      {/* Edit form */}
      {editingImage && (
        <form
          onSubmit={handleUpdateImage}
          className="mb-8 rounded-xl border border-orange-200 bg-orange-50 p-4 shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-orange-700">Edit Image</h2>
            <button
              type="button"
              onClick={() => {
                setEditingImage(null);
                setEditCaption("");
                setEditFile(null);
              }}
              className="text-sm text-gray-600 hover:text-orange-700"
            >
              Cancel
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Replace Image (optional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setEditFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-gray-600"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Caption
              </label>
              <input
                type="text"
                value={editCaption}
                onChange={(e) => setEditCaption(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                placeholder="Optional"
              />
            </div>

            <button
              type="submit"
              disabled={updatingImage}
              className="rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:opacity-60"
            >
              {updatingImage ? "Updating..." : "Update Image"}
            </button>
          </div>
        </form>
      )}

      {/* Image grid */}
      {loadingImages ? (
        <p className="text-gray-500">Loading images...</p>
      ) : images.length === 0 ? (
        <p className="text-gray-500">No images in this category yet.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {images.map((img) => (
            <div
              key={img.id}
              className="border border-orange-100 rounded-lg overflow-hidden bg-white shadow-sm"
            >
              <div className="relative w-full h-32">
                <Image
                  src={img.image_url}
                  alt={img.caption || "Gallery image"}
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>
              <div className="p-2">
                <p className="text-xs text-gray-600 truncate">
                  {img.caption || "—"}
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => startEdit(img)}
                    className="flex-1 flex items-center justify-center gap-1 text-xs text-orange-700 hover:bg-orange-50 border border-orange-300 rounded py-1 transition"
                  >
                    <FiEdit3 size={12} /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(img)}
                    className="flex-1 flex items-center justify-center gap-1 text-xs text-red-600 hover:text-white hover:bg-red-600 border border-red-300 rounded py-1 transition"
                  >
                    <FiTrash2 size={12} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
