import {Product} from "../../types/product";
import InfoBlock from '../ui/InfoBlock';

export default function ContentPanel({product, activeTab}: { product: Product, activeTab: "desc" | "specs" | "ship"}) {

  return(
    <div className="flex-1 bg-gray-50/50 dark:bg-neutral-800/50 p-8 rounded-3xl min-h-75">
      {activeTab === 'desc' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <p className="text-gray-700 dark:text-neutral-300 leading-relaxed mb-6">
            {product.description}
          </p>
          <div
            className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm border-t border-gray-200 dark:border-neutral-700 pt-6">
            <div>
              <span className="text-gray-500 block">Stamp Issuance:</span>
              <span className="font-semibold dark:text-white">
                        {new Date(product.release.date).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
            </div>
            <div>
              <span className="text-gray-500 block">Designer:</span>
              <span className="font-semibold dark:text-white">
                        {product.meta.designer || 'N/A'}
                      </span>
            </div>
          </div>
        </div>
      )}
      {activeTab === 'specs' && (
        <div className="flex flex-col gap-3 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
          <InfoBlock label="Issue:" value={product.name}/>
          <InfoBlock label="Item Number:" value={product.stampSKU}/>
          <InfoBlock label="Denomination:" value={product.meta.denomination}/>

          <div className="pt-4 pb-1">
                    <span className="text-[12px] font-black uppercase tracking-widest text-gray-400">
                      Type of Issue
                    </span>
          </div>

          <InfoBlock label="Format:" value={`Pane of ${product.meta.stampsPerPane}`}/>
          <InfoBlock label="Series:" value={product.meta.series}/>
          <InfoBlock label="Issue Date:" value={product.release.date}/>
          <InfoBlock label="Designer:" value={product.meta.designer}/>
          <InfoBlock label="Stamps per Pane:" value={product.meta.stampsPerPane}/>
          <InfoBlock label="Print Quantity:" value={product.release.printQuantity}/>
          <InfoBlock label="Perforation:" value={product.meta.designer ? 'Yes' : 'No'}/>
          <InfoBlock label="Europa:" value={product.meta.europa ? 'Yes' : 'No'}/>
        </div>
      )}
      {activeTab === 'ship' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-gray-700 dark:text-neutral-300">
          <p className="mb-4">
            Standard delivery for philatelic items typically takes 5-7 business days.
          </p>
          <ul className="list-disc ps-5 space-y-2 text-sm text-gray-600 dark:text-neutral-400">
            <li>Philatelic products are non-refundable.</li>
            <li>
              Items are shipped in protective packaging to prevent bending.
            </li>
            <li>Tracking is available for all domestic orders.</li>
          </ul>
        </div>
      )}
    </div>
  )
}