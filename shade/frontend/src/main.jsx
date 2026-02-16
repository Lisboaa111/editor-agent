import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { NearWalletProvider } from "./wallet.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <NearWalletProvider>
      <App />
    </NearWalletProvider>
  </React.StrictMode>,
);
