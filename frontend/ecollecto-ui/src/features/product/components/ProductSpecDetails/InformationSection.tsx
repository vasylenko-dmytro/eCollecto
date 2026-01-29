import React, {useState} from "react";
import {Product} from "../../types/product";
import ContentPanel from "./ContentPanel";
import SideBarTabs from "./SideBarTabs";
import type { Tab } from '../../types/tab';

export default function InformationSection({product}: { product: Product }) {
  const [activeTab, setActiveTab] = useState<Tab>('desc');

  return (
    <section className="border-t border-gray-200 dark:border-neutral-800 pt-12">
      <h2 className="text-2xl font-bold mb-10 text-gray-900 dark:text-white">
        More Information
      </h2>

      <div className="flex flex-col md:flex-row gap-12">
        {/* Vertical Sidebar Tabs */}
        <SideBarTabs activeTab={activeTab} setActiveTab={setActiveTab} />

        <ContentPanel product={product} activeTab={activeTab}/>
      </div>
    </section>
  )
}


