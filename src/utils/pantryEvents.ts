type Listener = () => void;

const listeners = new Set<Listener>();

export const pantryEvents = {
  subscribe(l: Listener): () => void {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
  emit() {
    listeners.forEach((l) => l());
  },
};
