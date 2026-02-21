import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  FileJson, 
  Link as LinkIcon, 
  Download, 
  Table, 
  FileCode, 
  Zap, 
  ShieldCheck,
  AlertCircle,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { 
  parseSwagger, 
  generateTestCases, 
  generateExcel, 
  generatePostman, 
  generateSoapUIXML, 
  generatePythonScripts,
  Endpoint,
  TestCase
} from '@/src/services/swaggerService';
import { cn } from '@/src/lib/utils';

export const SwaggerAutomation = () => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [success, setSuccess] = useState<string | null>(null);

  const handleProcess = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      let swaggerData;
      if (input.trim().startsWith('http')) {
        const response = await fetch(input);
        swaggerData = await response.json();
      } else {
        swaggerData = JSON.parse(input);
      }

      const parsedEndpoints = parseSwagger(swaggerData);
      const generatedTests = generateTestCases(parsedEndpoints, swaggerData);
      
      setEndpoints(parsedEndpoints);
      setTestCases(generatedTests);
      setSuccess(`Successfully parsed ${parsedEndpoints.length} endpoints and generated ${generatedTests.length} test cases.`);
    } catch (err) {
      setError('Failed to parse Swagger. Please ensure it is a valid JSON or URL.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const downloadActions = [
    { name: 'Excel Test Cases', icon: Table, action: () => generateExcel(testCases), color: 'bg-green-500/10 text-green-500' },
    { name: 'Postman Collection', icon: FileJson, action: () => generatePostman(endpoints), color: 'bg-orange-500/10 text-orange-500' },
    { name: 'SoapUI Project', icon: ShieldCheck, action: () => generateSoapUIXML(endpoints), color: 'bg-blue-500/10 text-blue-500' },
    { name: 'Python Scripts', icon: FileCode, action: () => generatePythonScripts(endpoints), color: 'bg-yellow-500/10 text-yellow-500' },
  ];

  return (
    <div className="space-y-8">
      <section className="text-center">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl"
        >
          Swagger <span className="text-emerald-500">Automation</span> Tool
        </motion.h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-400">
          Transform your Swagger/OpenAPI definitions into comprehensive test suites, 
          Postman collections, and automation scripts in seconds.
        </p>
      </section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Input Section */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6 backdrop-blur-sm"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <LinkIcon size={20} className="text-emerald-500" />
              Input Source
            </h2>
            <div className="flex gap-2">
              <span className="rounded-full bg-white/5 px-2 py-1 text-[10px] uppercase tracking-wider text-zinc-500">JSON</span>
              <span className="rounded-full bg-white/5 px-2 py-1 text-[10px] uppercase tracking-wider text-zinc-500">URL</span>
            </div>
          </div>
          
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste Swagger JSON here or enter URL (e.g., https://petstore.swagger.io/v2/swagger.json)"
            className="h-64 w-full rounded-xl border border-white/10 bg-black/50 p-4 font-mono text-sm text-zinc-300 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />

          <button
            onClick={handleProcess}
            disabled={loading || !input.trim()}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 font-bold text-black transition-all hover:bg-emerald-400 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Zap size={20} />}
            {loading ? 'Processing...' : 'Generate Automation Suite'}
          </button>

          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {success && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-400">
              <CheckCircle2 size={16} />
              {success}
            </div>
          )}
        </motion.div>

        {/* Results Section */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6 backdrop-blur-sm"
        >
          <h2 className="mb-6 text-lg font-semibold text-white flex items-center gap-2">
            <Download size={20} className="text-emerald-500" />
            Generated Assets
          </h2>

          {endpoints.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {downloadActions.map((item) => (
                <button
                  key={item.name}
                  onClick={item.action}
                  className={cn(
                    "flex flex-col items-center justify-center gap-3 rounded-xl border border-white/5 p-6 transition-all hover:scale-105 hover:border-white/20",
                    item.color
                  )}
                >
                  <item.icon size={32} />
                  <span className="text-sm font-medium">{item.name}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex h-64 flex-col items-center justify-center text-center text-zinc-500">
              <FileJson size={48} className="mb-4 opacity-20" />
              <p>Process a Swagger file to see download options</p>
            </div>
          )}

          {endpoints.length > 0 && (
            <div className="mt-8 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Endpoints Found:</span>
                <span className="font-bold text-white">{endpoints.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Test Cases Generated:</span>
                <span className="font-bold text-white">{testCases.length}</span>
              </div>
              <div className="h-1 w-full overflow-hidden rounded-full bg-white/5">
                <div className="h-full bg-emerald-500" style={{ width: '100%' }} />
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Stats / Info Section */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {[
          { title: '100% Client-Side', desc: 'Your API keys and Swagger files never leave your browser.', icon: ShieldCheck },
          { title: 'Multi-Format', desc: 'Export to Excel, Postman, SoapUI, and Python scripts.', icon: FileCode },
          { title: 'Instant Results', desc: 'Parse large Swagger files and generate thousands of tests in milliseconds.', icon: Zap },
        ].map((feature, i) => (
          <div key={i} className="rounded-xl border border-white/5 bg-white/5 p-6">
            <feature.icon className="mb-4 text-emerald-500" size={24} />
            <h3 className="mb-2 font-semibold text-white">{feature.title}</h3>
            <p className="text-sm text-zinc-400">{feature.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
};
