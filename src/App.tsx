/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Header, Footer } from './components/Layout';
import { SwaggerAutomation } from './components/SwaggerAutomation';
import { JSONPathEvaluator } from './components/JSONPathEvaluator';

export default function App() {
  return (
    <Router>
      <div className="flex min-h-screen flex-col bg-black text-zinc-100 selection:bg-emerald-500 selection:text-black">
        <Header />
        
        <main className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<SwaggerAutomation />} />
            <Route path="/jsonpath" element={<JSONPathEvaluator />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </Router>
  );
}
