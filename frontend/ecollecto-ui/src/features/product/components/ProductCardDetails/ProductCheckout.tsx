import {formatStampValue} from "../../../../shared/utils/stampHelpers";
import {Product} from "../../types/product";
import {useState} from "react";

export default function ProductCheckout({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1);

  return(
    <div className="md:col-span-3">
      <div className="bg-gray-50 dark:bg-neutral-800 p-6 rounded-3xl border border-gray-200 dark:border-neutral-700 sticky top-24">
        <div className="mb-6">
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
            1. Denomination:
          </label>
          <button className="w-full p-4 bg-white dark:bg-neutral-900 border-2 border-blue-600 rounded-xl shadow-sm text-center">
                  <span className="text-xl font-black text-blue-600 dark:text-blue-400">
                    {formatStampValue(product.meta.denomination)}
                  </span>
          </button>
        </div>

        <div className="mb-8">
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
            2. Choose a Quantity:
          </label>
          <div className="relative">
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value))}
              className="w-full bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-600 rounded-xl px-4 py-3 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button className="w-full bg-green-700 hover:bg-green-800 text-white font-bold py-4 rounded-xl transition-all items-center justify-center gap-2 shadow-md">
            Add to Collection
            <sup className="ms-0.5 text-xs bg-blue-700 text-white py-0.5 px-1 rounded-lg">TBD</sup>
          </button>
          <button className="w-full bg-white dark:bg-neutral-700 border border-gray-300 dark:border-neutral-600 text-gray-700 dark:text-neutral-200 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-600 transition-all font-semibold text-sm">
            Save for Later
            <sup className="ms-0.5 text-xs bg-blue-700 text-white py-0.5 px-1 rounded-lg">TBD</sup>
          </button>
        </div>
      </div>
    </div>
  )
}