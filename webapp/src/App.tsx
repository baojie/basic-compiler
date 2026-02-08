import { useState, useRef, useEffect, useCallback } from 'react';
import { run, LexerError, ParseError } from './compiler';
import { highlightBasic } from './highlight';
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

type Lang = 'en' | 'zh';

function App() {
  const [source, setSource] = useState(DEFAULT_SOURCE);
  const [output, setOutput] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [waitingForInput, setWaitingForInput] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [lang, setLang] = useState<Lang>('en');
  const inputResolveRef = useRef<(value: string) => void>(null);
  const outputEndRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLPreElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const [splitPercent, setSplitPercent] = useState(50);
  const draggingRef = useRef(false);
  const [isMobile, setIsMobile] = useState(
    () => window.matchMedia('(max-width: 768px)').matches,
  );

  const syncScroll = useCallback(() => {
    if (editorRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = editorRef.current.scrollTop;
      highlightRef.current.scrollLeft = editorRef.current.scrollLeft;
    }
  }, []);

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 768px)');
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    outputEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [output, waitingForInput]);

  const onDividerMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    draggingRef.current = true;
    const onMove = (ev: MouseEvent) => {
      if (!draggingRef.current || !mainRef.current) return;
      const rect = mainRef.current.getBoundingClientRect();
      const pct = ((ev.clientX - rect.left) / rect.width) * 100;
      setSplitPercent(Math.min(80, Math.max(20, pct)));
    };
    const onUp = () => {
      draggingRef.current = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, []);

  const loadCityGame = async () => {
    const file = lang === 'zh' ? 'city_game_cn.bas' : 'city_game.bas';
    try {
      const res = await fetch(import.meta.env.BASE_URL + file);
      const text = await res.text();
      setSource(text);
      setError(null);
      setOutput([]);
    } catch (e) {
      setError(`Failed to load ${file}`);
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
        <a href="https://github.com/baojie/basic-compiler" target="_blank" rel="noopener noreferrer" className="header-link">
          BASIC Compiler · Web
        </a>
        <div className="toolbar">
          <button
            type="button"
            className="lang-toggle"
            onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}
          >
            {lang === 'en' ? '中文' : 'EN'}
          </button>
          <button type="button" onClick={loadCityGame} disabled={running}>
            {lang === 'zh' ? '加载城市游戏' : 'Load City Game'}
          </button>
          <button type="button" onClick={handleRun} disabled={running}>
            {running && !waitingForInput
              ? lang === 'zh' ? '运行中...' : 'Running...'
              : lang === 'zh' ? '运行' : 'Run'}
          </button>
        </div>
      </header>
      <div
        className="main"
        ref={mainRef}
        style={isMobile ? undefined : { gridTemplateColumns: `${splitPercent}% 6px 1fr` }}
      >
        <section className="editor-section">
          <label>{lang === 'zh' ? '源代码' : 'Source'}</label>
          <div className="editor-wrap">
            <pre
              ref={highlightRef}
              className="editor-highlight"
              aria-hidden="true"
              dangerouslySetInnerHTML={{ __html: highlightBasic(source) + '\n' }}
            />
            <textarea
              ref={editorRef}
              className="editor"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              onScroll={syncScroll}
              spellCheck={false}
              disabled={running}
            />
          </div>
        </section>
        <div className="divider" onMouseDown={onDividerMouseDown} />
        <section className="output-section">
          <label>{lang === 'zh' ? '输出' : 'Output'}</label>
          <div className="output-box">
            <pre className="output-pre">
              {output.map((line, i) => (
                <span key={i}>{line}</span>
              ))}
            </pre>
            <div ref={outputEndRef} />
          </div>
          {waitingForInput && (
            <div className="input-row">
              <input
                type="text"
                className="input-field"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmitInput()}
                placeholder={lang === 'zh' ? '输入后按回车或点击提交' : 'Type and press Enter or click Submit'}
                autoFocus
              />
              <button type="button" onClick={handleSubmitInput}>
                {lang === 'zh' ? '提交' : 'Submit'}
              </button>
            </div>
          )}
          {error && <div className="error">{error}</div>}
        </section>
      </div>
    </div>
  );
}

export default App;
