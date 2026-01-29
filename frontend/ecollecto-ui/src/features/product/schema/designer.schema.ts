import { Schema, model, models } from "mongoose";

export interface Designer {
  _id: string;
  name: string;
}

const designerSchema = new Schema<Designer>(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
  },
  { versionKey: false }
);

export const DesignerModel =
  models.Designer || model<Designer>("Designer", designerSchema);
