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
              src={product.images.envelope}
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
            <h3 className="font-medium md:text-xl text-black dark:text-white mb-4">
              {product.name}
            </h3>

            <div className="py-3 border-t border-gray-300 dark:border-neutral-900">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="font-medium text-black dark:text-white">Envelop SKU:</span>
                </div>
                <div className="flex justify-end">
                  <span className="text-black dark:text-white">{product.envelopeSKU}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="font-medium text-black dark:text-white">Postmark SKU:</span>
                </div>
                <div className="flex justify-end">
                  <span className="text-black dark:text-white">{product.postmarkSKU}</span>
                </div>
              </div>
            </div>

            <div className="py-3 border-t border-gray-300 dark:border-neutral-900">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="font-medium text-black dark:text-white">Designer:</span>
                </div>
                <div className="flex justify-end">
                  <span className="text-black dark:text-white">{product.designer}</span>
                </div>
              </div>
            </div>

            <div className="py-3 border-t border-gray-300 dark:border-neutral-900">
              <div className="flex justify-between items-center">
                <span className="font-medium text-black dark:text-white">Print Quantity:</span>
                <span className="text-black dark:text-white">{product.release.printQuantity.toLocaleString()}</span>
              </div>
            </div>

            <div className="py-3 border-t border-gray-300 dark:border-neutral-900">
              <div className="flex justify-between items-center">
                <span className="font-medium text-black dark:text-white">Date:</span>
                <span className="text-black dark:text-white">{new Date(product.release.date).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
