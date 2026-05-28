import {FirstDayIssue} from "../../types/firstdayissue";
import defaultImg from "@/assets/images/default.png";
import notAvailableImg from "@/assets/images/noAvailableImg.png";
import React from "react";

export default function FirstDayCollection({product}: { product: FirstDayIssue }) {
  return(
    <div className="group flex flex-col gap-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1">
          <div className="aspect-square bg-gray-300 rounded-xl overflow-hidden">
            <img
              className="w-full h-full object-contain p-4"
              src={product.images.envelope ?? defaultImg}
              alt={`${product.name} envelope`}
              loading="lazy"
              onError={(e) => {
                e.currentTarget.src = defaultImg;
                e.currentTarget.onerror = null;
              }}
            />
          </div>
        </div>

        <div className="flex-1">
          <div className="aspect-square bg-gray-300 rounded-xl overflow-hidden">
            <img
              className="w-full h-full object-contain p-4"
              src={product.images.postmark ?? notAvailableImg}
              alt={`${product.name} postmark`}
              loading="lazy"
              onError={(e) => {
                e.currentTarget.src = notAvailableImg;
                e.currentTarget.onerror = null;
              }}
            />
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-bold text-black dark:text-white mb-4">
              {product.name}
            </h3>

            <div className="grid grid-cols-2 gap-x-8 gap-y-2 mt-4">
              <span className="text-gray-400">Envelop SKU:</span>
              <span className="text-black dark:text-white">{product.envelopeSKU}</span>

              <span className="text-gray-400">Postmark SKU:</span>
              <span className="text-black dark:text-white">{product.postmarkSKU}</span>

              <span className="text-gray-400">Designer:</span>
              <span className="text-black dark:text-white">{product.designer}</span>

              <span className="text-gray-400">Print Quantity:</span>
              <span className="text-black dark:text-white">{product.release.printQuantity.toLocaleString()}</span>

              <span className="text-gray-400">Date:</span>
              <span className="text-black dark:text-white">
                {new Date(product.release.date).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
