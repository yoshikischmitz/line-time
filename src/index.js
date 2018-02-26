import React from 'react'
import { render } from 'react-dom'
import { Provider } from 'react-redux'
import { createStore, applyMiddleware, compose } from 'redux'
import thunk from 'redux-thunk'
import lineTimeApp from './reducers'
import App from './components/App'
import {tick} from  './actions'
import {serializeChunks} from './utils'
import throttle from 'lodash/throttle'

const composeEnhancers =
  typeof window === 'object' &&
  window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ ?
    window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({
			  actionsBlacklist: ['TICK']
    }) : compose;


const store = createStore(lineTimeApp, composeEnhancers(applyMiddleware(thunk)))

const storage = window.localStorage

const persist = throttle(() => {
	const state = store.getState()
	const readyForJson = {...state, chunks: serializeChunks(state.chunks)}
	storage.setItem("line-time-state", JSON.stringify(readyForJson))
}, 3000)

store.subscribe(persist)

setInterval(() => { store.dispatch(tick())}, 1000)

render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root')
)
