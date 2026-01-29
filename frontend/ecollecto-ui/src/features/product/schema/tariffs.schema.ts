import { Schema, model, models } from "mongoose";

export interface Tariffs {
  _id: string;
  year: number;
  updatedAt: Date;
  currencies: Map<string, Map<string, number>>;
}

const tariffsSchema = new Schema<Tariffs>(
  {
    _id: { type: String, required: true },
    year: { type: Number, required: true },
    updatedAt: { type: Date, required: true },
    currencies: {
      type: Map,
      of: {
        type: Map,
        of: Number,
      },
      required: true,
    },
  },
  { versionKey: false }
);

export const TariffsModel =
  models.Tariffs || model<Tariffs>("Tariffs", tariffsSchema);
