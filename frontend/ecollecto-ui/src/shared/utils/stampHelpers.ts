import {useEffect, useState} from "react";

type TariffMap = Record<string, number>;
type TariffsData = {
  UAH: TariffMap;
  USD: TariffMap;
};

type TariffsResponseItem = {
  year?: number;
  currencies?: Record<string, TariffMap>;
};

let cachedTariffs: TariffsData | null = null;
let inFlight: Promise<TariffsData | null> | null = null;

async function fetchTariffs(signal: AbortSignal): Promise<TariffsData | null> {
  const response = await fetch("/api/tariffs", {signal});
  if (!response.ok) {
    throw new Error(`Failed to load tariffs (${response.status})`);
  }
  const data = await response.json() as TariffsResponseItem[];
  if (!Array.isArray(data) || data.length === 0) {
    return null;
  }

  const latest = data.reduce<TariffsResponseItem>((acc, item) => {
    if (typeof item.year !== "number") {
      return acc;
    }
    if (!acc || typeof acc.year !== "number" || item.year > acc.year) {
      return item;
    }
    return acc;
  }, data[0]);

  const currencies = latest?.currencies ?? {};
  const normalized = Object.fromEntries(
    Object.entries(currencies).map(([key, value]) => [key.toUpperCase(), value ?? {}])
  );

  return {
    UAH: normalized.UAH ?? {},
    USD: normalized.USD ?? {},
  };
}

async function getTariffs(signal: AbortSignal): Promise<TariffsData | null> {
  if (cachedTariffs) {
    return cachedTariffs;
  }
  if (!inFlight) {
    inFlight = fetchTariffs(signal).then((result) => {
      cachedTariffs = result;
      return result;
    }).finally(() => {
      inFlight = null;
    });
  }
  return inFlight;
}

export function useStampTariffs() {
  const [tariffs, setTariffs] = useState<TariffsData | null>(cachedTariffs);
  const [isLoading, setIsLoading] = useState(!cachedTariffs);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cachedTariffs) {
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    let isMounted = true;

    const loadTariffs = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await getTariffs(controller.signal);
        if (isMounted) {
          setTariffs(result);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load tariffs");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadTariffs();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  return {tariffs, isLoading, error};
}

export function formatStampValue(
  denomination: string | number | null | undefined,
  tariffs: TariffsData | null = cachedTariffs
): string {
  if (!denomination) return "N/A";

  const str = String(denomination).trim();
  const stampTariffs = tariffs;
  if (!stampTariffs) return "N/A";

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
