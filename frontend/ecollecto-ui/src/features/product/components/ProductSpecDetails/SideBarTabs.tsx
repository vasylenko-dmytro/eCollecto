import React from "react";
import type { Tab } from '../../types/tab';
import TabLink from '../ui/TabLink';     // Update path as needed

export default function SideBarTabs({activeTab, setActiveTab}:
{ activeTab: Tab, setActiveTab: React.Dispatch<React.SetStateAction<Tab>>}) {
  return(
    <div className="flex flex-col w-full md:w-72 gap-2">
      <TabLink
        label="Description"
        active={activeTab === 'desc'}
        onClick={() => setActiveTab('desc')}
      />
      <TabLink
        label="Product Specs"
        active={activeTab === 'specs'}
        onClick={() => setActiveTab('specs')}
      />
      <TabLink
        label="Shipping Info"
        active={activeTab === 'ship'}
        onClick={() => setActiveTab('ship')}
      />
    </div>
  )
}