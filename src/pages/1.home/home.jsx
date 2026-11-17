/* Page: Home - home */
import HeroSection from "./sections/HeroSection";
import CollectionStatementSection from "./sections/CollectionStatementSection";
import FeaturedCategoriesSection from "./sections/FeaturedCategoriesSection";
import FeaturedCollectionSection from "./sections/FeaturedCollectionSection";
import NewArrivalsSection from "./sections/NewArrivalsSection";
import BestSellersSection from "./sections/BestSellersSection";
import TestimonialsSection from "./sections/TestimonialsSection";
import BrandStorySection from "./sections/BrandStorySection";
import InstagramGridSection from "./sections/InstagramGridSection";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <CollectionStatementSection />
      <FeaturedCategoriesSection />
      <FeaturedCollectionSection />
      <NewArrivalsSection />
      <BestSellersSection />
      <TestimonialsSection />
      <BrandStorySection />
      <InstagramGridSection />
    </>
  );
}
