import ImageGallery from "./ProductCardDetails/ImageGallery";
import {Product} from "../types/product";
import ProductInfo from "./ProductCardDetails/ProductInfo";
import ProductCheckout from "./ProductCardDetails/ProductCheckout";

export default function StampContainer({ product }: { product: Product }) {


  return (

  <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
    {/* Column 1: Image Gallery (5 columns) */}
    <ImageGallery key={product.stamp_id} product={product} />

    {/* Column 2: Product Info & Summary (5 columns) */}
    <ProductInfo product={product} />

    {/* Column 3: Checkout Controls (3 columns) */}
    <ProductCheckout product={product} />
  </div>
  )
}