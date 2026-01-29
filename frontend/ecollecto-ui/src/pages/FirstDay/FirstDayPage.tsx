import type {FirstDayIssue} from "../../features/product/types/firstdayissue";
import firstDayIssueData from "../../features/product/data/firstDayIssueData.json";
import {Link} from "react-router-dom";
import FirstDayCollection
  from "../../features/product/components/FirstDayIssue/FirstDayCollection";
import NoSearchResults from "../../features/product/components/NoSearchResults";
import React from "react";

export default function FirstDayPage({searchTerm}: { searchTerm: string }) {
  const collectionProducts: FirstDayIssue[] = firstDayIssueData;
  const filteredProducts = collectionProducts.filter((product) => {
    const term = searchTerm.toLowerCase();
    return (
      product.name.toLowerCase().includes(term) ||
      product.release.year.toString().includes(term)
    );
  });

  return (
    <div className="max-w-340 px-4 sm:px-6 lg:px-8 py-6 lg:py-12 mx-auto">
      {filteredProducts.length > 0 ? (
        <div className="flex flex-col gap-8 md:gap-12">
          {filteredProducts.map((product) => (
            <div key={product.postmark_id}>
              <Link to={`/firstday`}>
                <FirstDayCollection product={product}/>
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <NoSearchResults searchTerm={searchTerm}/>
      )}
    </div>
  )
}