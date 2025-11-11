import React from "react";
import GenericMode from "../src/Components/GenericMode";
import { ToastProvider } from "../src/Components/Toast";
import "../styles/App.css";

function App() {
  return (
    <ToastProvider>
      <div className="App">
        <GenericMode />
      </div>
    </ToastProvider>
  );
}

export default App;
