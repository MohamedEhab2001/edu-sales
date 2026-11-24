"use client";

import { useCallback, useEffect, useState } from "react";
import { clientApi } from "@/lib/client-api";
import type { SavedOption } from "@/types/crm";

export function useOptions() {
  const [items, setItems] = useState<SavedOption[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await clientApi<{ items: SavedOption[] }>("/api/options");
      setItems(data.items);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    items,
    loading,
    refresh,
    fields: items.filter((item) => item.type === "field"),
    salespeople: items.filter((item) => item.type === "salesperson"),
    responses: items.filter((item) => item.type === "response"),
  };
}
