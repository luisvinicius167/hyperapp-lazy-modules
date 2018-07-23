/**
 * @name CACHED_VIEWS
 * @description The views that was load before
 */
const CACHED_VIEWS = {}

/**
 * @name createLazy
 * @description The container that will create the lazy modules
 * @param {Function} app The hyperapp app function
 * @param {Element} container The Element that your app will be mounted
 * 
 * @example
 * const modules = {
 *  home: {
 *     view: import('./myModule'),
 *     actions: import('./myModule/actions.js'),
 *     state: import('./myModule/state.js')
 *   }
 * }
 * const { actions, state } = createLazy(app, container)(modules, fetching => <Loading fetching={fetching}/>)
 * 
 * @returns {Function}
 * @param {Object} modules 
 */
export function createLazy(app, container) {
  return (modules, isFetching) => {
    createLazy.modules = modules
    createLazy.isFetching = isFetching
    createLazy.app = app
    createLazy.container = container
    
    /**
     * @description Pass these props to your app function
     * @returns {Object} 
     * 
     * @example
     * const { actions, state } = createLazy(app, container)(modules, fetching => <Loading fetching={fetching}/>)
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
          fetching: () => () => ({ lazy: { fetching: true, props: undefined } }), 
          loaded: (view) => () => ({ lazy: { view, fetching: false, props: undefined } })
        }
      },
      state: {
      fetching: false,
        lazy: {
          view: null,
          fetching: true,
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
const render = ({ view, state, actions, props }) => {
  const container = createLazy.container
  const appstate = assign(state, { lazy: { props, fetching: false } })
  createLazy.app(appstate, actions, view, container)
  state.fetching && actions.fetching(false)
}

const renderComponent = (data) => {
  const parentState = data.state
  const parentActions = data.actions
    const cacheModule = CACHED_VIEWS[data.module]
    
    return render({
      view: cacheModule.view,
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
    createLazy.modules[data.module].view,
    createLazy.modules[data.module].actions,
    createLazy.modules[data.module].state
  ]).then(module => {
    const [view, actions, state] = module
    const lazyComponent = getModule(view)
    CACHED_VIEWS[data.module] = {
      view: lazyComponent,
      state: getModule(state || {}),
      actions: getModule(actions),
    }
    data.state.fetching && data.actions.lazy.loaded(lazyComponent, false)
  })
  
  !data.state.fetching && data.actions.fetching(true)
  return data.state.fetching && createLazy.app(true, {}, createLazy.isFetching(true), createLazy.container.children[0])
}

/**
 * 
 * @param {String} component The component name
 * @param {Any} props The lazyProps state 
 * 
 * @returns {Function}
 */
export const Lazy = ({ module, props }) =>
  (state, actions) => {
    return CACHED_VIEWS[module] ? renderComponent({ module, state, actions, props }) : loadModule({ module, state, actions, props })
  }