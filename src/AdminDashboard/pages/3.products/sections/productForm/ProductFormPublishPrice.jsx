/* Admin Dashboard Page: Products - ProductFormPublishPrice */
import ProductFormPricing from "./ProductFormPricing";
import ProductFormPublish from "./ProductFormPublish";
import FormSection, { NestedSections } from "./ProductFormSection";

/**
 * Status, the save buttons and the price in one card at the top of the side
 * panel. Below lg the buttons live in the sticky save bar instead.
 */
export default function ProductFormPublishPrice({ actions, register, errors, values, setValue }) {
  return (
    <FormSection title="Publish and price">
      <ProductFormPublish {...actions} bare className="hidden lg:block" />
      <NestedSections>
        <ProductFormPricing register={register} errors={errors} values={values} setValue={setValue} />
      </NestedSections>
    </FormSection>
  );
}
