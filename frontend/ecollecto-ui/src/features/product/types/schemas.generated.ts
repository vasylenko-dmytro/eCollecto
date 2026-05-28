import { z } from "zod";

const AddWishlistItemRequest = z
  .object({ stampId: z.string().min(1) })
  .passthrough();
const AddFavoriteItemRequest = z
  .object({ stampId: z.string().min(1) })
  .passthrough();
const AddCollectionItemRequest = z
  .object({ stampId: z.string().min(1) })
  .passthrough();
const ErrorResponse = z
  .object({ message: z.string(), code: z.string(), status: z.number().int() })
  .partial()
  .passthrough();
const WishlistItemDto = z
  .object({
    stampId: z.string(),
    addedAt: z.string().datetime({ offset: true }),
  })
  .partial()
  .passthrough();
const FavoriteItemDto = z
  .object({
    stampId: z.string(),
    addedAt: z.string().datetime({ offset: true }),
  })
  .partial()
  .passthrough();
const CollectionItemDto = z
  .object({
    stampId: z.string(),
    addedAt: z.string().datetime({ offset: true }),
  })
  .partial()
  .passthrough();
const TariffsDto = z
  .object({
    id: z.string(),
    year: z.number().int(),
    updatedAt: z.string().datetime({ offset: true }),
    currencies: z.record(z.record(z.number())),
  })
  .passthrough();
const StampMeta = z
  .object({
    denomination: z.string(),
    series: z.union([z.string(), z.null()]),
    designer: z.union([z.string(), z.null()]),
    perforation: z.boolean(),
    themes: z.union([z.string(), z.null()]),
    europa: z.boolean(),
    stampsPerPane: z.union([z.number(), z.null()]),
  })
  .passthrough();
const StampRelease = z
  .object({
    year: z.number().int(),
    date: z.string(),
    printQuantity: z.number().int(),
    isMassIssue: z.boolean(),
    isAvailable: z.boolean(),
  })
  .passthrough();
const StampImages = z
  .object({
    original: z.string(),
    small: z.string(),
    pane: z.union([z.string(), z.null()]),
  })
  .passthrough();
const StampDto = z
  .object({
    name: z.string(),
    description: z.string(),
    meta: StampMeta,
    release: StampRelease,
    images: StampImages,
    stamp_id: z.string(),
    stampSKU: z.number().int(),
  })
  .passthrough();
const YearSummaryDto = z
  .object({ year: z.number().int(), count: z.number().int() })
  .passthrough();
const UserDto = z
  .object({ id: z.string(), email: z.string(), name: z.string() })
  .partial()
  .passthrough();
const FirstDayCoverRelease = z
  .object({
    year: z.number().int(),
    date: z.string(),
    printQuantity: z.number().int(),
  })
  .passthrough();
const FirstDayCoverImages = z
  .object({
    envelope: z.union([z.string(), z.null()]),
    postmark: z.union([z.string(), z.null()]),
  })
  .passthrough();
const FirstDayCoverDto = z
  .object({
    name: z.string(),
    description: z.string(),
    designer: z.union([z.string(), z.null()]),
    release: FirstDayCoverRelease,
    images: FirstDayCoverImages,
    postmark_id: z.union([z.string(), z.null()]),
    envelope_id: z.union([z.string(), z.null()]),
    postmarkSKU: z.union([z.number(), z.null()]),
    envelopeSKU: z.union([z.number(), z.null()]),
  })
  .passthrough();
const DesignerDto = z
  .object({ name: z.string(), designer_id: z.string() })
  .passthrough();

export const schemas = {
  AddWishlistItemRequest,
  AddFavoriteItemRequest,
  AddCollectionItemRequest,
  ErrorResponse,
  WishlistItemDto,
  FavoriteItemDto,
  CollectionItemDto,
  TariffsDto,
  StampMeta,
  StampRelease,
  StampImages,
  StampDto,
  YearSummaryDto,
  UserDto,
  FirstDayCoverRelease,
  FirstDayCoverImages,
  FirstDayCoverDto,
  DesignerDto,
};
