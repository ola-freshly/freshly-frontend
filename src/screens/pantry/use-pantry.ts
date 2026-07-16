import { useCallback, useEffect, useState } from 'react';
import { pantryApi } from '@/api/pantry';
import type { CreatePantryItemDto, PantryItem, UpdatePantryItemDto } from '@/api/types';
import { pantryCache } from '@/utils/pantryCache';

export function usePantry() {
  const [items, setItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showingCached,setShowingCached] = useState(false);

  const load = useCallback(async (isRefresh=false) => {
    try {
      if(isRefresh){
        setRefreshing(true);
      }else{
        setLoading(true);
      }
      const data=await pantryApi.getAll();
      setItems(data);
      await pantryCache.set(data);
      setError(null);
      setShowingCached(false);
      // If do not have callBack->this will trigger infinite rerender
      setItems(await pantryApi.getAll());
    } catch (e) {
      const cached=await pantryCache.get();
      if (cached){
        setItems(cached);
        setShowingCached(true);
      }else{
        setError(e instanceof Error ? e.message : 'Failed to load pantry Items');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    },[load]);

  const addItem=useCallback(async (dto:CreatePantryItemDto) => {
    const created=await pantryApi.create(dto);
    setItems((prev)=>[created,...prev]);
  },[]);

  const editItem=useCallback(async(id:string,dto:UpdatePantryItemDto) => {
    const updated=await pantryApi.update(id,dto);
    setItems((prev)=>prev.map((i)=>(i.id===updated.id?updated:i)));
  },[])

  const deleteItem=useCallback(async (id:string) => {
    await pantryApi.remove(id);
    setItems((prev)=>prev.filter((i)=>i.id!==id));
  },[])

  return {
    items,
    loading,
    refreshing,
    error,
    showingCached,
    reload: () => load(false),
    refresh: () => load(true),
    addItem,
    editItem,
    deleteItem,
  };
}