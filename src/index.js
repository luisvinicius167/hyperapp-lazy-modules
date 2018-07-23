/**
 * @name CACHED_VIEWS
 * @description The views that was load before
 */
const CACHED_VIEWS = {}

/**
 * @name createLazy
 * @description The container that will create the lazy components
 * @param {Function} app Hyperapp app
 * @param {Element} container The Element that the lazy component
 * will be loaded 
 * 
 * @example
 * const modules = {
 *  home: {
 *     component: import('./myModule'),
 *     actions: import('./myModule/actions.js'),
 *     state: import('./myModule/state.js')
 *   }
 * }
 * const { actions, state } = createLazy(app, container)(modules, { loading: <Component /> })
 * 
 * @returns {Function} A lazy function to set the modules and
 * the loading component
 */
export function createLazy(app, container) {
  return (modules, loading) => {
    createLazy.modules = modules
    createLazy.loading = loading
    createLazy.app = app
    createLazy.container = container
    
    /**
     * @description Pass these props to your app function
     * @returns {Object} 
     * 
     * @example
     * const { actions, state } = createLazy(app, container)(modules, { loading: <Component /> })
     * 
     * const appState = {
     *   ...state,
     *   ...lazyState
     * }
     * 
     * const appActions = {
     *   ...actions,
     *   ...appActions  
     * }
     * 
     * const main = app(appState, appActions, view, document.body)
     */
    return {
      actions: {
        fetching: (fetching) => () => ({ fetching }),
        lazy: {
          fetching: () => () => ({ lazy: { loading: true, props: undefined } }), 
          loaded: (view) => () => ({ lazy: { view, loading: false, props: undefined } })
        }
      },
      state: {
      fetching: false,
        lazy: {
          view: null,
          loading: true,
          props: undefined
        }
      }
    }
  }
}

/**
 * @name assign
 * @description Object.assign
 */
const assign = Object.assign

/**
 * @name getModule
 * @description Get the module 
 */
const getModule = module => module.default ? module.default : module

/**
 * @name render
 * @description Render the component providing the props or not.
 * If props are provided, it will be available as state.lazyProps
 *
 *  @param {Object} The data to mount the lazy component on
 * the page.
 *  
 */
const render = ({ component, state, actions, props }) => {
  const container = createLazy.container
  const appstate = assign(state, { lazy: { props, loading: false } })
  createLazy.app(appstate, actions, component, container)
  state.fetching && actions.fetching(false)
}

const renderComponent = (data) => {
  const parentState = data.state
  const parentActions = data.actions
    const cacheModule = CACHED_VIEWS[data.component]
    
    return render({
      component: cacheModule.component,
      actions: assign({}, parentActions, cacheModule.actions),
      state: assign({}, parentState, cacheModule.state),
      props: data.props
    })
}


/**
 * @description Fully load the lazy component with their state and actions.
 * 
 * @param {Object} props The props to render the lazy component
 */
const loadModule = data => {
  Promise.all([
    createLazy.modules[data.component].component,
    createLazy.modules[data.component].actions,
    createLazy.modules[data.component].state
  ]).then(module => {
    const [component, actions, state] = module
    const lazyComponent = getModule(component)
    CACHED_VIEWS[data.component] = {
      component: lazyComponent,
      state: getModule(state),
      actions: getModule(actions),
    }
    data.state.fetching && data.actions.lazy.loaded(lazyComponent, false)
  })
  
  !data.state.fetching && data.actions.fetching(true)
  return data.state.fetching && createLazy.app(true, {}, createLazy.loading(true), createLazy.container.children[0])
}

/**
 * 
 * @param {String} component The component name
 * @param {Any} props The lazyProps state 
 * 
 * @returns {Function}
 */
export const Lazy = ({ component, props }) =>
  (state, actions) => {
    return CACHED_VIEWS[component] ? renderComponent({ component, state, actions, props }) : loadModule({ component, state, actions, props })
  }