import {Product} from "../../types/product";

export default function ProductInfo({ product }: { product: Product }) {
  return(
    <div className="md:col-span-5 flex flex-col gap-2">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white leading-tight">
        {product.name}
      </h1>
      <p className="text-gray-500 dark:text-neutral-400 text-sm mb-2">
        {product.meta.series || 'Stamp Collection'}
      </p>

      <div className="flex items-center gap-2 mb-4">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  product.release.isAvailable
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {product.release.isAvailable ? 'In Stock' : 'Out of Stock'}
              </span>
      </div>

      <div className="space-y-1 text-sm text-gray-600 dark:text-neutral-400 mb-6">
        <p>
          <span className="font-semibold">SKU: #</span>
          {product.stampSKU}
        </p>
        <p>
          <span className="font-semibold">Issue Date: </span>
          {new Date(product.release.date).toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })}
        </p>
      </div>

      <div className="prose prose-sm dark:prose-invert text-gray-700 dark:text-neutral-300">
        <p className="line-clamp-6">{product.description}</p>
      </div>
    </div>
  )
}