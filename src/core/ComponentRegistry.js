import { useSyncExternalStore } from 'react';

let registry = new Map();
let listeners = new Set();

const emitChange = () => {
    for (let listener of listeners) {
        listener();
    }
};

export const ComponentRegistry = {
    register(name, component) {
        registry.set(name, component);
        console.log(`[Registry] Component registered/replaced: ${name}`);
        emitChange();
    },
    
    get(name) {
        return registry.get(name);
    },
    
    clear() {
        registry.clear();
        emitChange();
    },
    
    subscribe(listener) {
        listeners.add(listener);
        return () => listeners.delete(listener);
    },
    
    getSnapshot() {
        return registry; 
    }
};

export const useComponent = (name, FallbackComponent) => {
    const store = useSyncExternalStore(
        ComponentRegistry.subscribe,
        ComponentRegistry.getSnapshot
    );
    return store.get(name) || FallbackComponent;
};

export const DynamicComponent = ({ name, fallback: Fallback, children, ...props }) => {
    const TargetComponent = useComponent(name, Fallback);
    
    if (!TargetComponent) {
        return null;
    }
    
    return <TargetComponent {...props}>{children}</TargetComponent>;
};