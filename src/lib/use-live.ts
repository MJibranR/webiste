import { useCallback, useEffect, useState } from "react";
import { ensureSeed, getProducts, getPurchases, getUsers, type Product, type Purchase, type User } from "./spiderhex";

export function useLive() {
  const [products, setProductsState] = useState<Product[]>([]);
  const [purchases, setPurchasesState] = useState<Purchase[]>([]);
  const [users, setUsersState] = useState<User[]>([]);
  const [ready, setReady] = useState(false);

  const sync = useCallback(() => {
    setProductsState(getProducts());
    setPurchasesState(getPurchases());
    setUsersState(getUsers());
  }, []);

  useEffect(() => {
    ensureSeed();
    sync();
    setReady(true);
    const handler = () => sync();
    window.addEventListener("sh:update", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("sh:update", handler);
      window.removeEventListener("storage", handler);
    };
  }, [sync]);

  return { products, purchases, users, ready, sync };
}
