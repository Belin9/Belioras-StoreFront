import categories from "./categories.json";

/**
 * What a piece is: dresses, hair, accessories. Every product belongs to one.
 *
 * A category decides which sizes the product form offers and which extra
 * details it asks for, so a wig is never offered EU shoe sizes and a dress is
 * never asked for a hair texture. The id is fixed at creation because it is
 * the product's collectionId and part of the storefront's filter tokens.
 */
export default {
  rev: 4,
  items: categories,
};
