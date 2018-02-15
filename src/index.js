import React from 'react'
import { render } from 'react-dom'
import { Provider } from 'react-redux'
import { createStore, applyMiddleware } from 'redux'
import thunk from 'redux-thunk'
import lineTimeApp from './reducers'
import App from './components/App'
import {tick} from  './actions'

const store = createStore(
   lineTimeApp, /* preloadedState, */
	 applyMiddleware(thunk)
	//window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
 );

setInterval(() => { store.dispatch(tick())}, 1000)

render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root')
)
