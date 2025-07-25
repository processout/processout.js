module ProcessOut {
  /**
   * Global State Manager for APM Components
   * 
   * Provides a centralized state management system for stateful components
   * that need to trigger re-renders when their state changes.
   * 
   * Features:
   * - IE 11 compatible (no modern ES6+ features)
   * - Unique IDs for component instances
   * - Integration with APMViewImpl for triggering re-renders
   * - Component lifecycle management
   * - State persistence across re-renders
   */
  
  // IE 11 compatible unique ID generator
  let componentIdCounter = 0;
  
  export function generateComponentId(prefix = 'comp'): string {
    return `${prefix}-${Date.now()}-${++componentIdCounter}`;
  }
  
  interface ComponentState {
    id: string;
    data: any;
    view: APMViewImpl | null;
    subscriptions: Array<(state: any) => void>;
  }
  
  interface StateManagerOptions {
    // Optional cleanup callback when component is removed
    onDestroy?: (id: string, state: any) => void;
  }
  
  export class StateManager {
    private static instance: StateManager | null = null;
    private componentStates: { [id: string]: ComponentState } = {};
    private viewComponents: { [viewId: string]: string[] } = {}; // Maps view to component IDs
    private options: StateManagerOptions;
    
    // Batching system for state updates (IE 11 compatible)
    private hasPendingUpdates: boolean = false;
    private activeView: APMViewImpl | null = null; // The single active view that needs re-rendering
    private isBatchScheduled: boolean = false;
    private pendingCallbacks: Array<() => void> = []; // Post-render callbacks
    
    private constructor(options: StateManagerOptions = {}) {
      this.options = options;
    }
    
    /**
     * Singleton instance for global state management
     */
    static getInstance(options?: StateManagerOptions): StateManager {
      if (!StateManager.instance) {
        StateManager.instance = new StateManager(options);
      }
      return StateManager.instance;
    }
    
    /**
     * Register a component with the state manager
     * @param id - Unique component ID
     * @param initialState - Initial state data
     * @param view - Parent view instance (optional)
     * @returns Component state object
     */
    registerComponent<T = any>(id: string, initialState: T, view?: APMViewImpl): ComponentState {
      // If component already exists, return existing state
      if (this.componentStates[id]) {
        // Update the view reference if provided
        if (view) {
          this.componentStates[id].view = view;
          this.linkComponentToView(id, view);
        }
        return this.componentStates[id];
      }
      
      // Create new component state
      const componentState: ComponentState = {
        id,
        data: initialState,
        view: view || null,
        subscriptions: []
      };
      
      this.componentStates[id] = componentState;
      
      // Link component to view if provided
      if (view) {
        this.linkComponentToView(id, view);
      }
      
      return componentState;
    }
    
    /**
     * Get component state by ID
     */
    getComponentState<T = any>(id: string): T | null {
      let component = this.componentStates[id] as T;

      if (!component) {
        component = null
      }

      return component;
    }
    
    /**
     * Update component state and schedule batched re-renders
     * @param id - Component ID
     * @param newState - New state data or updater function
     * @param forceUpdate - Whether to force update even if state hasn't changed
     */
    updateComponentState<T = any>(
      id: string, 
      newState: T | ((prevState: T) => T),
      forceUpdate = false
    ): void {
      const component = this.componentStates[id];
      if (!component) {
        console.warn(`Component with ID ${id} not found`);
        return;
      }
      
      // Calculate new state
      let updatedState = newState;

      if (typeof updatedState === 'function') {
        updatedState = (newState as (prevState: T) => T)(component.data)
      }
      
      // Check if state actually changed (shallow comparison)
      const stateChanged = forceUpdate || !this.shallowEqual(component.data, updatedState);
      
      if (stateChanged) {
        component.data = updatedState;
        
        // Queue subscription notifications for after DOM update
        this.pendingCallbacks.push(() => {
          for (let i = 0; i < component.subscriptions.length; i++) {
            try {
              component.subscriptions[i](updatedState);
            } catch (error) {
              console.error('Error in state subscription:', error);
            }
          }
        });
        
        // Add to batch for re-rendering
        this.hasPendingUpdates = true;
        if (component.view) {
          this.activeView = component.view;
        }
        
        // Schedule batch processing if not already scheduled
        this.scheduleBatchUpdate();
      }
    }
    
    /**
     * Schedule a batched update using requestAnimationFrame
     * This ensures all state updates in a single frame are batched together
     */
    private scheduleBatchUpdate(): void {
      if (this.isBatchScheduled) {
        return; // Already scheduled
      }
      
      this.isBatchScheduled = true;
      
      // Use requestAnimationFrame to batch updates, with fallback for IE 11
      let scheduleFunction = requestAnimationFrame;

      if (!scheduleFunction) {
        scheduleFunction = function(callback: FrameRequestCallback) { return setTimeout(() => callback(performance.now()), 16); };
      }

      scheduleFunction(() => {
        this.processBatchUpdate();
      });
    }
    
    /**
     * Process all pending state updates and trigger view re-render
     * Since there's only one active view, this is much simpler
     */
    private processBatchUpdate(): void {
      this.isBatchScheduled = false;
      
      // Check if there are any pending updates
      if (!this.hasPendingUpdates) {
        return; // Nothing to update
      }
      
      // Clear pending updates
      this.hasPendingUpdates = false;
      
      // Re-render the active view
      if (this.activeView && typeof this.activeView.forceUpdate === 'function') {
        try {
          this.activeView.forceUpdate();
        } catch (error) {
          console.error('Error during batched view update:', error);
        }
      }
      
      // Clear active view reference
      this.activeView = null;
      
      // Process callbacks after DOM update using requestAnimationFrame
      const callbacks = this.pendingCallbacks.slice();
      this.pendingCallbacks.length = 0;
      
      if (callbacks.length > 0) {
        let scheduleFunction = requestAnimationFrame

        if (!scheduleFunction) {
          scheduleFunction = function(callback: FrameRequestCallback) { return setTimeout(() => callback(performance.now()), 16); };
        }

        scheduleFunction(() => {
          for (let i = 0; i < callbacks.length; i++) {
            try {
              callbacks[i]();
            } catch (error) {
              console.error('Error in post-render callback:', error);
            }
          }
        });
      }
    }
    
    /**
     * Subscribe to component state changes
     * @param id - Component ID
     * @param callback - Callback function to call when state changes
     * @returns Unsubscribe function
     */
    subscribe<T = any>(id: string, callback: (state: T) => void): () => void {
      const component = this.componentStates[id];
      if (!component) {
        console.warn(`Component with ID ${id} not found`);
        return function() {};
      }
      
      component.subscriptions.push(callback);
      
      // Return unsubscribe function
      return function() {
        const index = component.subscriptions.indexOf(callback);
        if (index > -1) {
          component.subscriptions.splice(index, 1);
        }
      };
    }

    /**
     * Watch for state changes (overloaded method)
     * @param id - Component ID
     * @param fieldOrCallback - Field name or callback function
     * @param callback - Callback function (when watching a field)
     * @returns Unsubscribe function
     */
    watch<T>(id: string, callback: (state: T) => void): () => void;
    watch<T, K extends keyof T>(id: string, field: K, callback: (newValue: T[K]) => void): () => void;
    watch<T, K extends keyof T>(
      id: string, 
      fieldOrCallback: K | ((state: T) => void), 
      callback?: (newValue: T[K]) => void
    ): () => void {
      const component = this.componentStates[id];
      if (!component) {
        console.warn(`Component with ID ${id} not found`);
        return function() {};
      }
      
      // If callback is provided, we're watching a specific field
      if (callback && typeof fieldOrCallback === 'string') {
        const field = fieldOrCallback as K;
        let prevValue = component.data[field];
        
        const watcher = function(newState: T) {
          const newValue = newState[field];
          if (newValue !== prevValue) {
            callback(newValue);
            prevValue = newValue;
          }
        };
        
        component.subscriptions.push(watcher);
        
        // Return unsubscribe function
        return function() {
          const index = component.subscriptions.indexOf(watcher);
          if (index > -1) {
            component.subscriptions.splice(index, 1);
          }
        };
      } else {
        // We're watching the entire state
        const stateCallback = fieldOrCallback as (state: T) => void;
        component.subscriptions.push(stateCallback);
        
        // Return unsubscribe function
        return function() {
          const index = component.subscriptions.indexOf(stateCallback);
          if (index > -1) {
            component.subscriptions.splice(index, 1);
          }
        };
      }
    }
    
    /**
     * Remove component from state manager
     * @param id - Component ID
     */
    destroyComponent(id: string): void {
      const component = this.componentStates[id];
      if (!component) {
        return;
      }
      
      // Call destroy callback if provided
      if (this.options.onDestroy) {
        try {
          this.options.onDestroy(id, component.data);
        } catch (error) {
          console.error('Error in destroy callback:', error);
        }
      }
      
      // Remove from view mapping
      if (component.view) {
        this.unlinkComponentFromView(id, component.view);
      }
      
      // Clear subscriptions
      component.subscriptions.length = 0;
      
      // Remove from state
      delete this.componentStates[id];
    }
    
    /**
     * Clean up all components associated with a view
     * @param view - View instance
     */
    destroyViewComponents(view: APMViewImpl): void {
      const viewId = this.getViewId(view);
      const componentIds = this.viewComponents[viewId];
      
      if (componentIds) {
        // Create a copy of the array to avoid modification during iteration
        const idsToDestroy = componentIds.slice();
        for (let i = 0; i < idsToDestroy.length; i++) {
          this.destroyComponent(idsToDestroy[i]);
        }
      }
      
      // Clean up component ID tracking for this view
      delete viewComponentIds[viewId];
    }
    
    /**
     * Get all component IDs for a view
     * @param view - View instance
     */
    getViewComponentIds(view: APMViewImpl): string[] {
      const viewId = this.getViewId(view);
      return this.viewComponents[viewId] || [];
    }
    
    /**
     * Link a component to a view for lifecycle management
     */
    private linkComponentToView(componentId: string, view: APMViewImpl): void {
      const viewId = this.getViewId(view);
      
      if (!this.viewComponents[viewId]) {
        this.viewComponents[viewId] = [];
      }
      
      // Add component ID if not already present
      if (this.viewComponents[viewId].indexOf(componentId) === -1) {
        this.viewComponents[viewId].push(componentId);
      }
    }
    
    /**
     * Unlink a component from a view
     */
    private unlinkComponentFromView(componentId: string, view: APMViewImpl): void {
      const viewId = this.getViewId(view);
      const componentIds = this.viewComponents[viewId];
      
      if (componentIds) {
        const index = componentIds.indexOf(componentId);
        if (index > -1) {
          componentIds.splice(index, 1);
        }
        
        // Clean up empty view entry
        if (componentIds.length === 0) {
          delete this.viewComponents[viewId];
        }
      }
    }
    
    /**
     * Get a unique ID for a view instance
     */
    private getViewId(view: APMViewImpl): string {
      return getViewId(view);
    }
    
    /**
     * IE 11 compatible shallow equality check
     */
    private shallowEqual(obj1: any, obj2: any): boolean {
      if (obj1 === obj2) {
        return true;
      }
      
      if (obj1 == null || obj2 == null) {
        return false;
      }
      
      if (typeof obj1 !== 'object' || typeof obj2 !== 'object') {
        return false;
      }
      
      const keys1 = Object.keys(obj1);
      const keys2 = Object.keys(obj2);
      
      if (keys1.length !== keys2.length) {
        return false;
      }
      
      for (let i = 0; i < keys1.length; i++) {
        const key = keys1[i];
        if (obj1[key] !== obj2[key]) {
          return false;
        }
      }
      
      return true;
    }
  }
  
  /**
   * View Context for automatic view detection
   */
  interface ViewContext {
    currentView: APMViewImpl | null;
    componentCallOrder: number;
    isFirstRender: boolean;
  }
  
  let viewContext: ViewContext = {
    currentView: null,
    componentCallOrder: 0,
    isFirstRender: true
  };
  
  // Track component IDs by view to ensure stability across renders
  const viewComponentIds: { [viewId: string]: string[] } = {};
  
  /**
   * Set the current view context (called by views during render)
   * @param view - Current view instance
   */
  export function setCurrentViewContext(view: APMViewImpl | null): void {
    const prevView = viewContext.currentView;
    viewContext.currentView = view;
    viewContext.componentCallOrder = 0; // Reset call order for new render
    
    // Reset collision counters for every render cycle
    if (view) {
      const viewId = getViewId(view);
      viewCollisionCounters[viewId] = {};
      
      // Check if this is the first render of this view
      viewContext.isFirstRender = !viewComponentIds[viewId];
      if (viewContext.isFirstRender) {
        viewComponentIds[viewId] = [];
      }
    }
  }
  
  /**
   * Get the current view context
   */
  export function getCurrentViewContext(): ViewContext {
    return viewContext;
  }
  
  /**
   * Generate stable component ID based on call order within render
   * This ensures IDs remain stable across re-renders by using the same order
   */
  function generateAutoComponentId(): string {
    const context = getCurrentViewContext();
    
    if (!context.currentView) {
      // Fallback for components rendered outside of view context
      return generateUniqueId('no-view-comp');
    }
    
    const viewId = getViewId(context.currentView);
    const callPosition = context.componentCallOrder++;
    
    // On first render, generate and store new IDs
    if (context.isFirstRender) {
      const componentId = `${viewId}-comp-${callPosition}`;
      viewComponentIds[viewId][callPosition] = componentId;
      return componentId;
    }
    
    // On subsequent renders, reuse the same IDs from first render
    const existingComponentIds = viewComponentIds[viewId];
    if (existingComponentIds && existingComponentIds[callPosition]) {
      return existingComponentIds[callPosition];
    }
    
    // Fallback for unexpected call order changes (shouldn't happen in normal usage)
    console.warn(`Component call order changed in view ${viewId}. This may cause state loss.`);
    const fallbackId = `${viewId}-comp-${callPosition}-fallback`;
    existingComponentIds[callPosition] = fallbackId;
    return fallbackId;
  }
  
  /**
   * Get view ID helper function (moved up for reuse)
   */
  function getViewId(view: APMViewImpl): string {
    // Use the view's container element as a unique identifier
    if (view.container && view.container.id) {
      return view.container.id;
    }
    
    // Fallback: create a unique ID based on the view object
    if (!(view as any).__stateManagerId) {
      (view as any).__stateManagerId = generateComponentId('view');
    }
    
    return (view as any).__stateManagerId;
  }
  
  // Track which component instances have claimed which collision numbers
  const stableCollisionMap: { [baseHash: string]: Set<string> } = {};
  
  // Track collision counters per view for current render cycle
  const viewCollisionCounters: { [viewId: string]: { [baseHash: string]: number } } = {};

  /**
   * Generate content-based component ID using props signature with stable collision detection
   * @param signature - Component signature object
   * @returns Hashed component ID that's stable across position changes
   */
  function generateContentBasedComponentId(signature: Record<string, any>): string {
    const context = getCurrentViewContext();
    const viewId = getViewId(context.currentView);
    
    // Generate base hash from content only (position-independent)
    const baseHash = simpleHash(JSON.stringify({
      __view: viewId,
      ...signature
    }));
    
    // Initialize tracking if needed
    if (!viewCollisionCounters[viewId]) {
      viewCollisionCounters[viewId] = {};
    }
    if (!stableCollisionMap[baseHash]) {
      stableCollisionMap[baseHash] = new Set();
    }
    
    const viewCounters = viewCollisionCounters[viewId];
    const existingIds = stableCollisionMap[baseHash];
    
    // Check if this is the first occurrence in current render
    if (viewCounters[baseHash] === undefined) {
      viewCounters[baseHash] = 0;
      
      // If no collision numbers have been assigned yet, use base hash
      if (existingIds.size === 0) {
        existingIds.add(baseHash);
        return baseHash;
      }
      
      // Find the lowest available collision number
      let collisionNum = 1;
      while (existingIds.has(`${baseHash}-${collisionNum}`)) {
        collisionNum++;
      }
      
      const newId = `${baseHash}-${collisionNum}`;
      existingIds.add(newId);
      return newId;
    } else {
      // Subsequent occurrence in current render - increment counter
      viewCounters[baseHash]++;
      
      // Find the next available collision number
      let collisionNum = viewCounters[baseHash];
      let candidateId = `${baseHash}-${collisionNum}`;

      if (collisionNum === 0) {
        candidateId = baseHash;
      }
      
      // If this collision number is already taken, find next available
      while (existingIds.has(candidateId)) {
        collisionNum++;
        candidateId = `${baseHash}-${collisionNum}`;
      }
      
      existingIds.add(candidateId);
      return candidateId;
    }
  }

  /**
   * Hook for components to use stateful behavior (simplified API)
   * @param initialState - Initial state
   * @param signature - Optional component signature for content-based ID
   * @returns Object with state, setState, and watch functions
   */
  export function useComponentState<T = any>(
    initialState: T,
    signature?: Record<string, any>
  ): { 
    state: T; 
    setState: (newState: T | ((prevState: T) => T)) => void;
    watch: {
      (callback: (state: T) => void): () => void;
      <K extends keyof T>(field: K, callback: (newValue: T[K]) => void): () => void;
    };
  } {
    const stateManager = StateManager.getInstance();
    
    // Generate component ID - use content-based if signature provided, fallback to call order
    let componentId = generateAutoComponentId();

    if (signature) {
      componentId = generateContentBasedComponentId(signature);
    }
    
    // Get current view from context
    const currentView = getCurrentViewContext().currentView;
    
    // Register component if not already registered
    stateManager.registerComponent(componentId, initialState, currentView);
    
    // Get current state
    const currentState = stateManager.getComponentState<T>(componentId) || initialState;
    
    // Create setState function
    const setState = function(newState: T | ((prevState: T) => T)) {
      stateManager.updateComponentState(componentId, newState);
    };
    
    // Create watch function with overloads
    const watch = function<K extends keyof T>(
      fieldOrCallback: K | ((state: T) => void), 
      callback?: (newValue: T[K]) => void
    ): () => void {
      if (callback) {
        return stateManager.watch(componentId, fieldOrCallback as K, callback);
      } else {
        return stateManager.watch(componentId, fieldOrCallback as (state: T) => void);
      }
    };
    
    return {
      state: currentState,
      setState: setState,
      watch: watch
    };
  }
   
  /**
   * Hook for components to subscribe to state changes
   * @param id - Component ID
   * @param callback - Callback function
   * @returns Unsubscribe function
   */
  export function useStateSubscription<T = any>(
    id: string, 
    callback: (state: T) => void
  ): () => void {
    const stateManager = StateManager.getInstance();
    return stateManager.subscribe(id, callback);
  }
  
  /**
   * Utility to get the global state manager instance
   */
  export function getStateManager(): StateManager {
    return StateManager.getInstance();
  }
  
  /**
   * Utility to clean up component state
   * @param id - Component ID
   */
  export function cleanupComponentState(id: string): void {
    const stateManager = StateManager.getInstance();
    stateManager.destroyComponent(id);
  }
} 