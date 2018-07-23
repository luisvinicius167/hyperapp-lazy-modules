# <img height=24 src=https://cdn.rawgit.com/jorgebucaran/f53d2c00bafcf36e84ffd862f0dc2950/raw/882f20c970ff7d61aa04d44b92fc3530fa758bc0/Hyperapp.svg> hyperapp-lazy-modules


Lazyload your hyperapp modules with their own view, actions and state.

## The Gist

```jsx
import { h, app } from "hyperapp"
import { Route, location, Switch } from "@hyperapp/router"
import { Lazy, createLazy } from 'hyperapp-lazy-modules'

// Module signature
const modules = {
  count: {
    view: import('./modules/count/index.js'),
    actions: import('./modules/countactions.js'),
    state: import('./modules/state.js')
  },
  add: {
    view: import('/add.js'),
    actions: import('./add-actions.js'),
    state: import('./add-state.js')
  },
}

const { actions, state } = createLazy(app, container)(modules, fetching => <h1>Fetching...</h1>)

const container = document.querySelector('#app')

const appstate = {
  count: 0,
  ...state
}

const appActions = {
  someAction: () => () => {},
  ...actions
}

const view = (state, actions) => (
  <div>
    <Switch>
      <Route path="/" render={(router) => <Lazy props={router} module='home'/> }/>
      <Route path="/about" render={() => <Lazy module='about' /> }/>
    </Switch>
  </div>
)

const main = app(appstate, appActions, view, container);
location.subscribe(main.location);
```

Your application state will be your root state and the loaded module state. The same to actions.

The Lazy Module State is a plain object with the `lazy` key, and it is avaiable in your app state:
```js
  appState.lazy = { fetching: true|false, props }

```

Hyperapp Lazy Modules consists of a two-function API. <samp>createLazy</samp> to create the container that will mount your lazy modules and the <samp>Lazy</samp> that you will be load your lazy modules.


## Installation

Install with npm or Yarn.

<pre>
npm i <a href=https://www.npmjs.com/package/hyperapp-lazy-modules>hyperapp-lazy-modules</a>
</pre>

## Overview

Your application module consist of three interconnected parts: the [state](#state), [view](#view), and [actions](#actions).

Your modules with their own actions and state will be loaded dynamiclly. The state and actions will be merged into your root state.


### Module State
The signature is the same as hyperapp. 

The state is a plain JavaScript object that describes your entire program. It consists of all the dynamic data that is moved around in the application during its execution. The state cannot be mutated once it is created. We must use actions to update it.

```js
export const state = {
  count: 0
}
// will be available as rootState.state

// or
export default {
  count: 0
}

// will be avaiable as rootState.count
```

### Module Actions
The signature is the same as hyperapp. 

The only way to change the state is via actions. An action is a unary function (accepts a single argument) expecting a payload. The payload can be anything you want to pass into the action.

To update the state, an action must return a partial state object. The new state will be the result of a shallow merge between this object and the current state. Under the hood, Hyperapp wires every function from your actions to schedule a view redraw whenever the state changes.

```js
export const actions = {
  setValue: value => ({ value })
}
// will be available as rootActions.actions.setValue

export default {
  setValue: value => state => ({ count: state.count + value })
}

// will be avaiable as rootActions.setValue
```

### API

`createLazy` are a HOC thar you need to pass the `hyperapp.app` function and the element that your modules are be mounted.

You need to pass your modules and the fetching handler that will be called when your module are fetching and not cached.

Your modules are cached once its loaded.

```js
/**
 * @name createLazy
 * @description The container that will create the lazy modules
 * @param {Function} app The hyperapp app function
 * @param {Element} container The Element that your app will be mounted
 * 
 * @example
 * 
 * const { actions, state } = createLazy(app, container)(modules, fetching => <Loading fetching={fetching}/>)
 * 
 * @returns {Function}
 * @param {Object} modules Your appliaction modules
 * @param {Function} isFetchingHandle Handle when fetching new module
 */

import { createLazy } from 'hyperapp-lazy-modules'

const modules = {
  count: {
    component: import('./modules/count/index.js'),
    actions: import('./modules/count/actions.js'),
    state: import('./modules/state.js')
  },
  add: {
    component: import('./modules/add/index.js'),
    actions: import('./modules/add/actions.js'),
    state: import('./modules/add/state.js')
  }
}

// When your component are fetching, the fetching function will be called.
const { actions, state } = createLazy(app, container)(modules, fetching => <h1>Fetching...</h1>)
```

`Lazy` is your component that will render your module and merge the module actions and the module state to your app state and actions.

You can only return one Lazy Module inside your view and your views cannot have two Lazy Modules loaded at the same time.

```js
/**
 * 
 * @param {String} module The object module key 
 * @param {Any} props The props that will be available as rootstate.lazy.props
 *
 * @return {Function}
 */

  import { Lazy } from 'hyperapp-lazy-modules'

  const view = (appState, appActions) =>
    <Lazy module='count' />


  // appState.lazy.props = { text: 'Lazy modules.' }
  const view = (appState, appActions) => 
    <div>
      <Lazy module='count' props={ text: 'Lazy modules.' } />
    </div>

```

## License
MIT licensed. See [LICENSE](LICENSE.md).
