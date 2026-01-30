import {useParams} from 'react-router-dom';

import type {Product} from '../../features/product/types/product';
import NotFoundPage from "../NotFound/NotFoundPage";
import StampContainer from "../../features/product/components/StampContainer";
import InformationSection from "../../features/product/components/ProductSpecDetails/InformationSection";
import React, {useEffect, useState} from "react";

export default function ProductPage() {

  const {id} = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNotFound, setIsNotFound] = useState(false);

  useEffect(() => {
    if (!id) {
      setIsNotFound(true);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    let isMounted = true;

    const loadProduct = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setIsNotFound(false);
        const response = await fetch(`/api/stamp/${id}`, {signal: controller.signal});
        if (response.status === 404) {
          if (isMounted) {
            setIsNotFound(true);
          }
          return;
        }
        if (!response.ok) {
          throw new Error(`Failed to load product (${response.status})`);
        }
        const data = await response.json() as Product;
        if (isMounted) {
          setProduct(data);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load product");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadProduct();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-sm text-gray-500">Loading product...</div>
        </div>
      </div>
    );
  }

  if (isNotFound) {
    return (
      <NotFoundPage></NotFoundPage>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-sm text-red-600">{error}</div>
        </div>
      </div>
    );
  }

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
