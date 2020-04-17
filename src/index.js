import "console.tap/dist-src/polyfill.js";
import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import { devToolsEnhancer } from "redux-devtools-extension";
import { createStore } from "redux";
import { Provider } from "react-redux";
import directorReducer from "./state/director";
import * as serviceWorker from "./serviceWorker";

const store = createStore(directorReducer, devToolsEnhancer());

ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
