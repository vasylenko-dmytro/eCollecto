import { Schema, model, models } from "mongoose";

export interface Stamp {
  _id: string;
  name: string;
  description: string;
  stampSKU: number;
  meta: {
    denomination: {
      currency: string;
      code: string;
    };
    series: string | null;
    designerIds: string[];
    perforation: boolean;
    stampsPerPane: number | null;
    themes: string[];
    europa: boolean;
  };
  release: {
    date: string;
    year: number;
    printQuantity: number;
    isMassIssue: boolean;
    isAvailable: boolean;
  };
  images: {
    original: string;
    small: string;
    pane: string | null;
  };
}

const stampSchema = new Schema<Stamp>(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    stampSKU: { type: Number, required: true },
    meta: {
      denomination: {
        currency: { type: String, required: true },
        code: { type: String, required: true },
      },
      series: { type: String, default: null },
      designerIds: { type: [String], required: true },
      perforation: { type: Boolean, required: true },
      stampsPerPane: { type: Number, default: null },
      themes: { type: [String], default: [] },
      europa: { type: Boolean, required: true },
    },
    release: {
      date: { type: String, required: true },
      year: { type: Number, required: true },
      printQuantity: { type: Number, required: true },
      isMassIssue: { type: Boolean, required: true },
      isAvailable: { type: Boolean, required: true },
    },
    images: {
      original: { type: String, required: true },
      small: { type: String, required: true },
      pane: { type: String, default: null },
    },
  },
  { versionKey: false }
);

export const StampModel = models.Stamp || model<Stamp>("Stamp", stampSchema);
