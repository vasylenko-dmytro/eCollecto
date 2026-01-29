import { Schema, model, models } from "mongoose";

export interface FirstDayCover {
  _id: string;
  name: string;
  description: string;
  stampId: string;
  designerId: string;
  postmark: {
    id: string;
    sku: number;
    image: string | null;
  };
  envelope: {
    id: string;
    sku: number;
    image: string;
  };
  release: {
    year: number;
    date: string;
    printQuantity: number;
  };
}

const firstDayCoverSchema = new Schema<FirstDayCover>(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true, default: "" },
    stampId: { type: String, required: true },
    designerId: { type: String, required: true },
    postmark: {
      id: { type: String, required: true },
      sku: { type: Number, required: true },
      image: { type: String, default: null },
    },
    envelope: {
      id: { type: String, required: true },
      sku: { type: Number, required: true },
      image: { type: String, required: true },
    },
    release: {
      year: { type: Number, required: true },
      date: { type: String, required: true },
      printQuantity: { type: Number, required: true },
    },
  },
  { versionKey: false }
);

export const FirstDayCoverModel =
  models.FirstDayCover ||
  model<FirstDayCover>("FirstDayCover", firstDayCoverSchema);
