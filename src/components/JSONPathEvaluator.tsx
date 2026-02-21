import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Search, 
  Copy, 
  Check, 
  AlertCircle, 
  ChevronRight, 
  Database,
  Code
} from 'lucide-react';
import { 
  parseJSONInput, 
  evaluateJSONPath, 
  getKeysFromJSON 
} from '@/src/services/jsonPathService';
import { cn } from '@/src/lib/utils';

export const JSONPathEvaluator = () => {
  const [jsonInput, setJsonInput] = useState('{\n  "store": {\n    "book": [\n      { "category": "reference", "author": "Nigel Rees", "title": "Sayings of the Century", "price": 8.95 },\n      { "category": "fiction", "author": "Evelyn Waugh", "title": "Sword of Honour", "price": 12.99 }\n    ]\n  }\n}');
  const [path, setPath] = useState('$.store.book[*].author');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [availableKeys, setAvailableKeys] = useState<{ label: string; value: string }[]>([]);
  const [copiedPath, setCopiedPath] = useState(false);
  const [copiedResult, setCopiedResult] = useState(false);

  useEffect(() => {
    handleEvaluate();
  }, [jsonInput, path]);

  const handleEvaluate = () => {
    setError(null);
    try {
      const json = parseJSONInput(jsonInput);
      const keys = getKeysFromJSON(json);
      setAvailableKeys(keys);
      
      const evalResult = evaluateJSONPath(json, path);
      setResult(evalResult);
    } catch (err: any) {
      setError(err.message);
      setResult(null);
    }
  };

  const copyToClipboard = (text: string, setter: (v: boolean) => void) => {
    navigator.clipboard.writeText(typeof text === 'string' ? text : JSON.stringify(text, null, 2));
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  return (
    <div className="space-y-8">
      <section className="text-center">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl"
        >
          JSON Path <span className="text-emerald-500">Evaluator</span>
        </motion.h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-400">
          Extract data from complex JSON structures with real-time JSONPath evaluation and path generation.
        </p>
      </section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Input Section */}
        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6 backdrop-blur-sm"
          >
            <h2 className="mb-4 text-lg font-semibold text-white flex items-center gap-2">
              <Database size={20} className="text-emerald-500" />
              JSON Input
            </h2>
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              className="h-80 w-full rounded-xl border border-white/10 bg-black/50 p-4 font-mono text-sm text-zinc-300 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="Paste your JSON here..."
            />
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6 backdrop-blur-sm"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Search size={20} className="text-emerald-500" />
                JSONPath Expression
              </h2>
              <button
                onClick={() => copyToClipboard(path, setCopiedPath)}
                className="text-zinc-400 hover:text-white"
                title="Copy Path"
              >
                {copiedPath ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
              </button>
            </div>
            
            <input
              type="text"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              className="mb-4 w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 font-mono text-sm text-zinc-300 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="e.g. $.store.book[*].author"
            />

            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wider text-zinc-500">Quick Select Path</label>
              <select
                onChange={(e) => setPath(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-zinc-300 focus:border-emerald-500 focus:outline-none"
              >
                <option value="">Select an attribute...</option>
                {availableKeys.map((key, i) => (
                  <option key={i} value={key.value}>{key.label}</option>
                ))}
              </select>
            </div>
          </motion.div>
        </div>

        {/* Output Section */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col rounded-2xl border border-white/10 bg-zinc-900/50 p-6 backdrop-blur-sm"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Code size={20} className="text-emerald-500" />
              Evaluation Result
            </h2>
            {result !== null && (
              <button
                onClick={() => copyToClipboard(result, setCopiedResult)}
                className="text-zinc-400 hover:text-white"
                title="Copy Result"
              >
                {copiedResult ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
              </button>
            )}
          </div>

          <div className="flex-1 overflow-auto rounded-xl border border-white/10 bg-black/50 p-4">
            {error ? (
              <div className="flex items-center gap-2 text-red-400">
                <AlertCircle size={16} />
                <span className="text-sm">{error}</span>
              </div>
            ) : result !== null ? (
              <pre className="font-mono text-sm text-emerald-400">
                {JSON.stringify(result, null, 2)}
              </pre>
            ) : (
              <div className="flex h-full items-center justify-center text-zinc-500">
                <p>Results will appear here</p>
              </div>
            )}
          </div>

          <div className="mt-6 space-y-4">
            <div className="rounded-lg bg-white/5 p-4">
              <h4 className="mb-2 text-xs font-bold uppercase text-zinc-500">Pro Tip</h4>
              <p className="text-xs text-zinc-400">
                Use <code className="text-emerald-500">$..author</code> to find all authors anywhere in the JSON structure.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
