import React from "react";

export default function NoSearchResults({searchTerm}: { searchTerm: string }) {
  return(
    <div className="text-center py-20">
      <p className="text-gray-500 dark:text-neutral-400 text-lg">
        No stamps match "{searchTerm}"
      </p>
    </div>
  )
}