type TariffsByCurrency = Record<string, Record<string, number>>;

type TariffsDto = {
  year: number;
  currencies: TariffsByCurrency;
};

let tariffsCache: TariffsByCurrency | null = null;
let tariffsPromise: Promise<TariffsByCurrency | null> | null = null;

async function loadTariffs(): Promise<TariffsByCurrency | null> {
  if (tariffsCache) {
    return tariffsCache;
  }

  if (!tariffsPromise) {
    tariffsPromise = fetch("/api/tariffs")
      .then((response) => (response.ok ? response.json() : null))
      .then((data: TariffsDto[] | null) => {
        if (!data || data.length === 0) {
          return null;
        }

        const latest = data.reduce<TariffsDto | null>((current, item) => {
          if (!current || item.year > current.year) {
            return item;
          }
          return current;
        }, null);

        return latest?.currencies ?? null;
      })
      .catch(() => null)
      .then((currencies) => {
        tariffsCache = currencies;
        return currencies;
      });
  }

  return tariffsPromise;
}

function formatStampValueWithTariffs(
  denomination: string | number | null | undefined,
  stampTariffs: TariffsByCurrency | null
): string {
  if (!denomination) return "N/A";

  const str = String(denomination).trim();
  const letterKey = str.toUpperCase();

  // Case 1: exact tariff letter (H, F, G, etc.)
  if (stampTariffs?.UAH?.[letterKey] !== undefined) {
    return `${stampTariffs.UAH[letterKey].toFixed(2)} UAH`;
  }
  if (stampTariffs?.USD?.[letterKey] !== undefined) {
    return `${stampTariffs.USD[letterKey].toFixed(2)} USD`;
  }

  // Case 2: letter + surcharge (e.g., "F+8.00")
  const letterPlus = str.match(/^([A-ZА-ЯЄЖ]+)\+([\d.]+)$/i);
  if (letterPlus) {
    const [, letter, extra] = letterPlus;
    const key = letter.toUpperCase();
    let base = 0;
    let currency = "UAH";

    if (stampTariffs?.UAH?.[key] !== undefined) {
      base = stampTariffs.UAH[key];
      currency = "UAH";
    } else if (stampTariffs?.USD?.[key] !== undefined) {
      base = stampTariffs.USD[key];
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

export async function formatStampValue(
  denomination: string | number | null | undefined
): Promise<string> {
  const tariffs = await loadTariffs();
  return formatStampValueWithTariffs(denomination, tariffs);
}
