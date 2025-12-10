import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log("React app mounted successfully");
} catch (error) {
  console.error("Mount Error:", error);
  rootElement.innerHTML = `<div style="color:red; padding: 20px;">
    <h1>Application Error</h1>
    <p>Failed to mount React application.</p>
    <pre>${error instanceof Error ? error.message : JSON.stringify(error)}</pre>
  </div>`;
}
