import { StrictMode, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { initializeContracts } from './services/initialization';

/**
 * A wrapper component that handles the asynchronous initialization of contracts.
 * It shows a loading state during initialization and an error state on failure.
 * The main App is only rendered upon successful initialization.
 */
function AppInitializer() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // This function will be called once when the component mounts.
    async function init() {
      try {
        // We await the initialization function to complete.
        await initializeContracts();
        setIsInitialized(true);
      } catch (e: any) {
        const errorMessage = e.message || '';
        
        // This is the key change: We check for the specific "already set" message.
        // This is not a critical failure; it means the setup is already done.
        if (errorMessage.includes("VaultManager already set")) {
          console.log("Initialization check confirmed: VaultManager was already set.");
          setIsInitialized(true); // Treat as a success.
        } else {
          // For any other error, we show the error screen.
          console.error("Caught a critical initialization error in AppInitializer:", e);
          setError(errorMessage || 'An unknown error occurred during initialization.');
        }
      }
    }
    
    init();
  }, []); // The empty dependency array [] ensures this effect runs only once.

  // Render an error state if initialization failed.
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Initialization Failed</h2>
          <p className="text-gray-700">{error}</p>
          <p className="text-gray-500 mt-4">Please check the console for details and ensure your wallet is connected to the correct network.</p>
        </div>
      </div>
    );
  }

  // Render a loading state while waiting for initialization.
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-800">Initializing Contracts...</h2>
          <p className="text-gray-600">Please wait, connecting to the blockchain.</p>
        </div>
      </div>
    );
  }

  // Once initialized, render the main application.
  return <App />;
}

// Get the root element from the DOM.
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find the root element to mount the application.");
}

// Create a root and render the AppInitializer.
const root = createRoot(rootElement);
root.render(
  <StrictMode>
    <AppInitializer />
  </StrictMode>
);
