import { useState, useRef, useEffect } from 'react';
import { run, LexerError, ParseError } from './compiler';
import './App.css';

const DEFAULT_SOURCE = `REM === BASIC Compiler - Quick Start ===
REM
REM 1. Edit code here, click [Run] to execute
REM 2. Click [Load City Game] to try a demo
REM
REM --- Language Examples ---

PRINT "Hello, World!"

LET A = 3
LET B = 4
PRINT "3 + 4 =", A + B

FOR I = 1 TO 5
  PRINT "count:", I
NEXT I

INPUT X
PRINT "You entered:", X

END
`;

function App() {
  const [source, setSource] = useState(DEFAULT_SOURCE);
  const [output, setOutput] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [waitingForInput, setWaitingForInput] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const inputResolveRef = useRef<(value: string) => void>(null);
  const outputEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    outputEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [output, waitingForInput]);

  const loadCityGame = async () => {
    try {
      const res = await fetch(import.meta.env.BASE_URL + 'city_game.bas');
      const text = await res.text();
      setSource(text);
      setError(null);
      setOutput([]);
    } catch (e) {
      setError('Failed to load city_game.bas');
    }
  };

  const handleRun = async () => {
    setError(null);
    setOutput([]);
    setRunning(true);
    setWaitingForInput(false);

    const print = (s: string) => {
      setOutput((prev) => [...prev, s]);
    };
    const input = (): Promise<string> => {
      return new Promise((resolve) => {
        inputResolveRef.current = resolve;
        setWaitingForInput(true);
      });
    };

    try {
      await run(source, print, input);
    } catch (e) {
      if (e instanceof LexerError) setError(`Lexer: ${e.message}`);
      else if (e instanceof ParseError) setError(`Parse: ${e.message}`);
      else setError(String(e));
    } finally {
      setRunning(false);
      setWaitingForInput(false);
      inputResolveRef.current = null;
    }
  };

  const handleSubmitInput = () => {
    if (inputResolveRef.current) {
      inputResolveRef.current(inputValue);
      setInputValue('');
      setWaitingForInput(false);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>BASIC Compiler · Web</h1>
        <div className="toolbar">
          <button type="button" onClick={loadCityGame} disabled={running}>
            Load City Game
          </button>
          <button type="button" onClick={handleRun} disabled={running}>
            {running && !waitingForInput ? 'Running...' : 'Run'}
          </button>
        </div>
      </header>
      <div className="main">
        <section className="editor-section">
          <label>Source</label>
          <textarea
            className="editor"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            spellCheck={false}
            disabled={running}
          />
        </section>
        <section className="output-section">
          <label>Output</label>
          <div className="output-box">
            <pre className="output-pre">
              {output.map((line, i) => (
                <span key={i}>{line}</span>
              ))}
            </pre>
            {waitingForInput && (
              <div className="input-row">
                <input
                  type="text"
                  className="input-field"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmitInput()}
                  placeholder="Type and press Enter or click Submit"
                  autoFocus
                />
                <button type="button" onClick={handleSubmitInput}>
                  Submit
                </button>
              </div>
            )}
            <div ref={outputEndRef} />
          </div>
          {error && <div className="error">{error}</div>}
        </section>
      </div>
    </div>
  );
}

export default App;
