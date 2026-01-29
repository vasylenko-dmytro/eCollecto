import tariffsData from '../../features/product/data/tariffsData.json';

export function formatStampValue(denomination: string | number | null | undefined): string {
  if (!denomination) return "N/A";

  const str = String(denomination).trim();
  const stampTariffs = tariffsData;

  // Case 1: exact tariff letter (H, F, G, etc.)
  if (stampTariffs.UAH[str as keyof typeof stampTariffs.UAH] !== undefined) {
    return `${stampTariffs.UAH[str as keyof typeof stampTariffs.UAH].toFixed(2)} UAH`;
  }
  if (stampTariffs.USD[str as keyof typeof stampTariffs.USD] !== undefined) {
    return `${stampTariffs.USD[str as keyof typeof stampTariffs.USD].toFixed(2)} USD`;
  }

  // Case 2: letter + surcharge (e.g., "F+8.00")
  const letterPlus = str.match(/^([A-ZА-ЯЄЖ]+)\+([\d.]+)$/i);
  if (letterPlus) {
    const [, letter, extra] = letterPlus;
    let base = 0;
    let currency = "UAH";

    if (stampTariffs.UAH[letter as keyof typeof stampTariffs.UAH] !== undefined) {
      base = stampTariffs.UAH[letter as keyof typeof stampTariffs.UAH];
      currency = "UAH";
    } else if (stampTariffs.USD[letter as keyof typeof stampTariffs.USD] !== undefined) {
      base = stampTariffs.USD[letter as keyof typeof stampTariffs.USD];
      currency = "USD";
    } else {
      return "N/A";
    }

    const total = base + parseFloat(extra);
    return `${total.toFixed(2)} ${currency}`;
  }

  // Case 3: number with currency in UAH (e.g., "60.00 грн")
  const uahMatch = str.match(/^([\d.]+)\s*(грн|UAH)?$/i);
  if (uahMatch) {
    const value = parseFloat(uahMatch[1]);
    return `${value.toFixed(2)} UAH`;
  }

  // Case 4: just a number (assume UAH)
  const num = parseFloat(str);
  if (!isNaN(num)) {
    return `${num.toFixed(2)} UAH`;
  }

  // fallback
  return "N/A";
}