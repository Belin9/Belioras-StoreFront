/* Owned Pieces */
import { Link } from "react-router-dom";
import { RotateCcw } from "lucide-react";

import { useCurrency } from "../../../../context/CurrencyContext";
import { sizeLabel } from "../../../../utils/sizeLabel";

export default function WardrobeGrid({ pieces, dateFmt, onBuyAgain, taxonomy }) {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-5 lg:grid-cols-4">
      {pieces.map((piece) => (
        <li key={piece.productId}>
          <WardrobePiece piece={piece} dateFmt={dateFmt} onBuyAgain={onBuyAgain} taxonomy={taxonomy} />
        </li>
      ))}
    </ul>
  );
}

function WardrobePiece({ piece, dateFmt, onBuyAgain, taxonomy }) {
  const { format } = useCurrency();
  const { product } = piece;

  // A piece withdrawn from the catalogue is still owned, so it stays on the
  // shelf — with the photo its order kept, but no link or way to buy it again.
  const photo = product?.images?.[0] ?? piece.image;
  const body = (
    <>
      <div className="aspect-[3/4] overflow-hidden bg-ivory-300">
        {photo ? (
          <img
            src={photo}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-[11px] uppercase tracking-widest text-espresso/25">
            No longer stocked
          </span>
        )}
      </div>

      <p className="mt-3 text-sm leading-snug text-espresso transition-colors group-hover:text-gold-700">
        {piece.name}
      </p>
    </>
  );

  return (
    <div className="group">
      {product ? (
        <Link to={`/product/${product.slug}`} className="block">
          {body}
        </Link>
      ) : (
        body
      )}

      <p className="mt-1 text-[12px] text-espresso-soft">
        {[
          piece.size && piece.size !== "one-size" ? `Size ${sizeLabel(taxonomy, piece.size)}` : null,
          piece.color,
        ]
          .filter(Boolean)
          .join(" · ") || "One size"}
      </p>

      <p className="mt-0.5 text-[11px] text-espresso/40">
        {dateFmt.format(piece.lastBought)}
        {piece.timesBought > 1 && ` · bought ${piece.timesBought}×`}
      </p>

      {product && product.stock > 0 && (
        <button
          type="button"
          onClick={() => onBuyAgain(piece)}
          className="mt-2 inline-flex min-h-11 items-center gap-1.5 text-[11px] uppercase tracking-widest text-gold-700 transition-colors hover:text-espresso lg:min-h-0"
        >
          <RotateCcw className="size-3.5" aria-hidden="true" />
          Buy again · {format(product.price)}
        </button>
      )}
    </div>
  );
}
