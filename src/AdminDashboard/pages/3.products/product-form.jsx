/* Admin Dashboard Page: Products - product-form */
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { useProductDraft } from "@/context/ProductDraftContext";
import { useToast } from "@/context/ToastContext";
import { useAsyncData } from "@/hooks/useAsyncData";
import { getStaffCategories } from "@/services/catalog/categoriesApi";
import { getColors } from "@/services/catalog/colorsApi";
import { getModels } from "@/services/catalog/modelsApi";
import { getTaxonomy } from "@/services/catalog/navigationApi";
import { createProduct, getProduct, updateProduct } from "@/services/catalog/productsApi";

import ConfirmDialog from "@/components/ui/ConfirmDialog";
import ProductFormCategory from "./sections/productForm/ProductFormCategory";
import ProductFormEssentials from "./sections/productForm/ProductFormEssentials";
import ProductFormLabels from "./sections/productForm/ProductFormLabels";
import ProductFormPhotos from "./sections/productForm/ProductFormPhotos";
import ProductFormPricing from "./sections/productForm/ProductFormPricing";
import ProductFormPublish from "./sections/productForm/ProductFormPublish";
import SaveBar from "./sections/productForm/ProductFormSaveBar";
import FormSkeleton from "./sections/productForm/ProductFormSkeleton";
import ProductFormDetailsCare from "./sections/productForm/ProductFormDetailsCare";
import ProductFormModel from "./sections/productForm/ProductFormModel";
import ProductFormVideo from "./sections/productForm/ProductFormVideo";
import ProductFormVariants from "./sections/productForm/ProductFormVariants";
import { useProductDraftSync } from "./sections/productForm/useProductFormDraftSync";
import { EMPTY_VALUES, toPayload, validateProduct } from "./sections/productForm/productFormPayload";

export default function ProductForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { toast } = useToast();
  const draft = useProductDraft();

  // Bumped after a colour or category is created from inside the form.
  const [revision, setRevision] = useState(0);
  const { data: existing, loading } = useAsyncData(() => (isEdit ? getProduct(id, { includeDrafts: true }) : Promise.resolve(null)), [id]);
  const { data: categories } = useAsyncData(getStaffCategories, [revision]);
  const { data: colors } = useAsyncData(getColors, [revision]);
  const { data: taxonomy } = useAsyncData(getTaxonomy, []);
  const { data: models } = useAsyncData(getModels, []);

  const [photos, setPhotos] = useState([]);
  const [videos, setVideos] = useState({});
  const [colorIds, setColorIds] = useState([]);
  const [stock, setStock] = useState({});
  const [sizes, setSizes] = useState([]);
  const [tags, setTags] = useState([]);
  const [spread, setSpread] = useState(false);
  const [askDiscard, setAskDiscard] = useState(false);

  const form = useForm({ defaultValues: EMPTY_VALUES });
  const values = form.watch();
  const category = (categories ?? []).find((c) => c.id === values.collectionId) ?? null;

  // The Blob serialises to {} and only wastes storage quota, so it is left out.
  const draftPhotos = photos.map(({ id: photoId, url, name, colorId }) => ({ id: photoId, url, name, colorId }));
  const snapshot = JSON.stringify({ values, colorIds, stock, sizes, tags, photos: draftPhotos, videos });

  useProductDraftSync({
    isEdit, existing, draft, reset: form.reset, snapshot, toast,
    setPhotos, setVideos, setColorIds, setStock, setSizes, setTags, setSpread,
  });

  // Sizes and a type the new category does not offer are dropped rather than kept hidden.
  const chooseCategory = (next) => {
    form.setValue("collectionId", next.id, { shouldDirty: true });
    if (!(next.types ?? []).some((t) => t.id === form.getValues("type"))) form.setValue("type", "");
    setSizes((prev) => (next.sizes ?? []).filter((s) => prev.includes(s)));
  };

  const save = (status) =>
    form.handleSubmit(
      async (formValues) => {
        const problem = validateProduct({ status, category, colorIds, photos });
        if (problem) {
          toast(problem, "error");
          return;
        }
        const payload = toPayload(formValues, { photos, videos, colorIds, stock, sizes, tags, category, status });
        try {
          const saved = isEdit ? await updateProduct(id, payload) : await createProduct(payload);
          if (!isEdit) draft.clearDraft("new-product");
          toast(status === "active" ? `${saved.name} is live in the shop.` : `${saved.name} saved as a draft.`, "success");
          navigate("/dashboard/products");
        } catch (err) {
          toast(err.message ?? "Could not save that product.", "error");
        }
      },
      () => toast("A few fields need attention before saving.", "error"),
    )();

  const discardDraft = () => {
    draft.clearDraft("new-product");
    form.reset(EMPTY_VALUES);
    [setPhotos, setColorIds, setSizes, setTags].forEach((set) => set([]));
    setVideos({});
    setStock({});
  };

  if (isEdit && loading) return <FormSkeleton />;

  const actions = { isEdit, status: values.status, submitting: form.formState.isSubmitting,
    hasDraft: !isEdit && Boolean(draft.draftFor("new-product")), onDiscardDraft: () => setAskDiscard(true), onSave: save };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <Link to="/dashboard/products" className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-espresso-soft transition-colors hover:text-espresso">
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          All products
        </Link>
        <p className="truncate text-[13px] text-espresso-soft">
          {isEdit ? "Editing" : "New piece"}
          {values.name?.trim() && <span className="text-espresso"> · {values.name.trim()}</span>}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-4">
          <ProductFormEssentials register={form.register} errors={form.formState.errors} />
          <ProductFormPhotos photos={photos} onChange={setPhotos} colors={colors ?? []} colorIds={colorIds} onImageProgress={(p) => draft.updateDraft("new-product", { progress: p })} />
          <ProductFormVideo
            colors={colors ?? []} colorIds={colorIds} videos={videos} onVideosChange={setVideos}
            photos={photos}
          />
          <ProductFormModel register={form.register} models={models ?? []} sizes={sizes} taxonomy={taxonomy ?? {}} />
          <ProductFormDetailsCare register={form.register} values={values} setValue={form.setValue} />
          <ProductFormVariants
            colors={colors ?? []} colorIds={colorIds} onColorIdsChange={setColorIds}
            photos={photos} onPhotosChange={setPhotos} stock={stock} onStockChange={setStock}
            sizes={sizes} onSizesChange={setSizes} category={category} taxonomy={taxonomy ?? {}}
            spread={spread} onColorCreated={() => setRevision((n) => n + 1)}
            register={form.register} reserved={existing?.reservedCells ?? {}}
          />
        </div>

        {/* Stays in view beside a long form. The page scrolls inside <main>,
            below the header, so it sticks to the top of that. */}
        <aside className="min-w-0">
          <div className="space-y-4 lg:sticky lg:top-0">
            <ProductFormPublish {...actions} className="hidden lg:block" />
            <ProductFormCategory
              categories={categories ?? []} value={values.collectionId} type={values.type} tags={tags}
              onChange={chooseCategory} onTypeChange={(next) => form.setValue("type", next, { shouldDirty: true })}
              onTagsChange={setTags}
              onCreated={(created) => { setRevision((n) => n + 1); chooseCategory(created); }}
            />
            <ProductFormPricing register={form.register} errors={form.formState.errors} values={values} setValue={form.setValue} />
            <ProductFormLabels values={values} setValue={form.setValue} />
          </div>
        </aside>
      </div>

      <SaveBar {...actions} className="lg:hidden" />

      <ConfirmDialog
        open={askDiscard}
        onClose={() => setAskDiscard(false)}
        onConfirm={() => {
          setAskDiscard(false);
          discardDraft();
        }}
        title="Discard this draft?"
        description="Everything typed and uploaded for this new piece is cleared. This cannot be undone."
        confirmLabel="Discard draft"
        cancelLabel="Keep editing"
      />
    </div>
  );
}
