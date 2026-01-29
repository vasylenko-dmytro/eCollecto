import {Product} from "../../types/product";
import defaultImg from "@/assets/images/default.png";

export default function StampImageCollectionGallery({product}: { product: Product }) {
  return (
    <div>
      <div className="aspect-square bg-gray-400 rounded-xl overflow-hidden">
        <img className="w-full h-full object-contain p-4 grayscale"
             src={product.images.small}
             alt={product.name}
             loading="lazy"
             onError={(e) => {
               e.currentTarget.src = defaultImg;
               e.currentTarget.onerror = null;
             }}
        />
      </div>
    </div>
  )
}