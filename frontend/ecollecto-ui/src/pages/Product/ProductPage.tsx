import {useParams} from 'react-router-dom';

import productData from '../../features/product/data/productData.json';
import type {Product} from '../../features/product/types/product';
import NotFoundPage from "../NotFound/NotFoundPage";
import StampContainer from "../../features/product/components/StampContainer";
import InformationSection from "../../features/product/components/ProductSpecDetails/InformationSection";

export default function ProductPage() {

  const {id} = useParams<{ id: string }>();
  const product = (productData as Product[]).find((p) => p.stamp_id === id);

  if (!product) {
    return (
      <NotFoundPage></NotFoundPage>
    );
  }

  // Main Presentation
  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <StampContainer product={product}/>
        <InformationSection product={product}/>
      </div>
    </div>
  );
}
