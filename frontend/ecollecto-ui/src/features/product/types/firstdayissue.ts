export interface FirstDayIssue {
  postmark_id: string;
  envelope_id: string;
  name: string;
  description: string;
  postmarkSKU: number;
  envelopeSKU: number;
  designer: string | null;
  release: {
    year: number;
    date: string;
    printQuantity: number;
  },
  images: {
    envelope: string;
    postmark: string | null;
  }
}