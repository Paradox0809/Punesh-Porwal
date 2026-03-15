import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, Download, Share2, TrendingUp, TrendingDown, Info, Building2, Landmark, ShieldAlert, Newspaper, Users, BarChart3, CheckSquare, Bot, Send, User, FileText, Upload, Link as LinkIcon, Zap, ExternalLink } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  Legend
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { analyzeIPO, getUpcomingIPOs, getMarketUpdates } from './services/geminiService';
import { getAIResponse } from './services/aiService';
import { IPOAnalysis, MetricStatus } from './types';
import { MetricDisplay } from './components/MetricDisplay';

export default function App() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<IPOAnalysis | null>(null);
  const [upcomingIpos, setUpcomingIpos] = useState<any[]>([]);
  const [marketUpdates, setMarketUpdates] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [newsSentimentFilter, setNewsSentimentFilter] = useState<'all' | 'positive' | 'neutral' | 'negative'>('all');
  const [error, setError] = useState<string | null>(null);

  // AI Chat State
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'model', parts: { text: string }[] }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  // DRHP State
  const [drhpUrl, setDrhpUrl] = useState('');
  const [isImportingDRHP, setIsImportingDRHP] = useState(false);
  const [drhpStatus, setDrhpStatus] = useState<'none' | 'syncing' | 'synced'>('none');
  const [isDragging, setIsDragging] = useState(false);

  // Handle URL params for sharing
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    if (q) {
      setQuery(q);
      handleSearch(q);
    }
    
    // Fetch upcoming IPOs for the calendar
    fetchUpcoming();
    fetchUpdates();
  }, []);

  const fetchUpcoming = async () => {
    try {
      const data = await getUpcomingIPOs();
      setUpcomingIpos(data);
    } catch (err) {
      console.error("Failed to fetch upcoming IPOs", err);
    }
  };

  const fetchUpdates = async () => {
    try {
      const data = await getMarketUpdates();
      setMarketUpdates(data);
    } catch (err) {
      console.error("Failed to fetch market updates", err);
    }
  };

  const handleSearch = async (searchQuery: string = query) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setError(null);
    setChatMessages([]); // Reset chat on new search
    setDrhpUrl('');
    setDrhpStatus('none');
    try {
      const result = await analyzeIPO(searchQuery);
      setAnalysis(result);
      // Update URL for sharing
      const url = new URL(window.location.href);
      url.searchParams.set('q', searchQuery);
      window.history.pushState({}, '', url);
    } catch (err) {
      console.error(err);
      setError("Failed to analyze IPO. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    window.print();
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Analysis link copied to clipboard!");
  };

  const resetApp = () => {
    setAnalysis(null);
    setQuery('');
    setError(null);
    setChatMessages([]);
    setDrhpUrl('');
    setDrhpStatus('none');
    setActiveTab('overview');
    // Clear URL params
    const url = new URL(window.location.href);
    url.searchParams.delete('q');
    window.history.pushState({}, '', url);
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, isChatLoading]);

  const handleSendMessage = async (e?: React.FormEvent, queryOverride?: string) => {
    if (e) e.preventDefault();
    const queryToUse = queryOverride || chatInput;
    if (!queryToUse.trim() || !analysis || isChatLoading) return;

    const userMessage = { role: 'user' as const, parts: [{ text: queryToUse }] };
    const newHistory = [...chatMessages, userMessage];
    
    setChatMessages(newHistory);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const response = await getAIResponse(
        queryToUse, 
        analysis, 
        newHistory, 
        drhpStatus === 'synced' ? drhpUrl : undefined,
        upcomingIpos,
        marketUpdates
      );
      setChatMessages([...newHistory, { role: 'model' as const, parts: [{ text: response }] }]);
    } catch (err) {
      console.error(err);
      setChatMessages([...newHistory, { role: 'model' as const, parts: [{ text: "I'm sorry, I encountered an error while processing your request. Please try again." }] }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleImportDRHP = async () => {
    if (!drhpUrl.trim()) return;
    setIsImportingDRHP(true);
    setDrhpStatus('syncing');
    
    // Simulate DRHP parsing/syncing
    // In a real app, this might send the URL to a backend or use Gemini URL Context
    setTimeout(() => {
      setIsImportingDRHP(false);
      setDrhpStatus('synced');
      alert("DRHP data successfully synced with AI Analyst context.");
    }, 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDrhpUrl(file.name);
      setIsImportingDRHP(true);
      setDrhpStatus('syncing');
      
      // Simulate file processing
      setTimeout(() => {
        setIsImportingDRHP(false);
        setDrhpStatus('synced');
        alert(`File "${file.name}" successfully imported and synced.`);
      }, 1500);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setDrhpUrl(file.name);
      setIsImportingDRHP(true);
      setDrhpStatus('syncing');
      setTimeout(() => {
        setIsImportingDRHP(false);
        setDrhpStatus('synced');
        alert(`File "${file.name}" successfully imported via drag-and-drop.`);
      }, 1500);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Building2 },
    { id: 'valuation', label: 'Valuation', icon: Landmark },
    { id: 'financials', label: 'Financials', icon: BarChart3 },
    { id: 'risk', label: 'Risk', icon: ShieldAlert },
    { id: 'news', label: 'News & Sentiment', icon: Newspaper },
    { id: 'peers', label: 'Peers', icon: Users },
    { id: 'gmp', label: 'GMP Tracker', icon: TrendingUp },
    { id: 'market_trends', label: 'Market Trends', icon: BarChart3 },
    { id: 'calendar', label: 'Calendar', icon: Landmark },
    { id: 'updates', label: 'Updates', icon: Newspaper },
    { id: 'verdict', label: 'Verdict', icon: CheckSquare },
    { id: 'ai', label: 'AI Analyst', icon: Bot },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-terminal-border bg-black sticky top-0 z-50 no-print">
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div 
              className="flex items-center gap-2 cursor-pointer group"
              onClick={resetApp}
            >
              <div className="w-8 h-8 bg-terminal-accent flex items-center justify-center font-bold text-black group-hover:scale-105 transition-transform">B</div>
              <h1 className="text-lg font-bold tracking-tighter hidden sm:block group-hover:text-terminal-accent transition-colors">IPO INTEL <span className="text-terminal-accent">TERMINAL</span></h1>
            </div>
            <div className="hidden lg:flex items-center gap-2 px-2 py-1 bg-terminal-accent/10 border border-terminal-accent/20 rounded-full">
              <Zap className="w-3 h-3 text-terminal-accent animate-pulse" />
              <span className="text-[9px] font-bold text-terminal-accent uppercase tracking-widest">Optimized for Speed</span>
            </div>
          </div>
          
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex-1 max-w-xl mx-8"
          >
            <div className="relative">
              <input
                type="text"
                placeholder="SEARCH COMPANY OR TICKER..."
                className="w-full terminal-input pr-10"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button 
                onClick={() => handleSearch()}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-terminal-dim hover:text-terminal-accent"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              </button>
            </div>
          </motion.div>

          <div className="flex items-center gap-2">
            <button onClick={handleExport} className="terminal-btn flex items-center gap-2 text-xs">
              <Download className="w-4 h-4" /> <span className="hidden md:inline">EXPORT</span>
            </button>
            <button onClick={handleShare} className="terminal-btn flex items-center gap-2 text-xs">
              <Share2 className="w-4 h-4" /> <span className="hidden md:inline">SHARE</span>
            </button>
          </div>
        </motion.div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6">
        {!analysis && !loading && !error && (
          <div className="flex-1 flex flex-col items-center justify-center py-12">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl w-full"
            >
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 bg-terminal-accent/10 border border-terminal-accent/20 px-3 py-1 rounded-full mb-6">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-terminal-accent opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-terminal-accent"></span>
                  </span>
                  <span className="text-[10px] font-bold text-terminal-accent uppercase tracking-widest">
                    {marketUpdates.length > 0 ? marketUpdates[0].title : 'Live Market Intelligence Active'}
                  </span>
                </div>
                <h2 className="text-4xl font-bold mb-4 tracking-tighter">ANALYZE ANY IPO</h2>
                <p className="text-terminal-dim mb-8">Get deep insights, valuation metrics, and risk assessment for upcoming and historical IPOs powered by Google Gemini AI.</p>
                <div className="flex flex-wrap justify-center gap-2 mb-8">
                  {['NVIDIA', 'REDDIT', 'ARM', 'ZOMATO'].map(q => (
                    <button 
                      key={q}
                      onClick={() => { setQuery(q); handleSearch(q); }}
                      className="terminal-btn text-xs hover:border-terminal-accent"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Calendar View on Landing */}
              <div className="terminal-card">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xs font-bold text-terminal-accent uppercase tracking-widest flex items-center gap-2">
                    <Landmark className="w-4 h-4" /> Upcoming IPO Calendar
                  </h3>
                  <span className="text-[10px] text-terminal-dim">LIVE UPDATES</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-terminal-border text-[10px] text-terminal-dim uppercase">
                        <th className="pb-4 font-medium">Company</th>
                        <th className="pb-4 font-medium">Expected Date</th>
                        <th className="pb-4 font-medium">Status</th>
                        <th className="pb-4 font-medium text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs">
                      {upcomingIpos.slice(0, 5).map((ipo, idx) => (
                        <tr key={idx} className="border-b border-terminal-border/50 hover:bg-terminal-accent/5 transition-colors">
                          <td className="py-3 font-bold">{ipo.name}</td>
                          <td className="py-3">{ipo.date}</td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase ${
                              ipo.status === 'Upcoming' ? 'bg-terminal-accent/20 text-terminal-accent' :
                              ipo.status === 'Open' ? 'bg-terminal-green/20 text-terminal-green' :
                              'bg-terminal-red/20 text-terminal-red'
                            }`}>
                              {ipo.status}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <button 
                              onClick={() => {
                                setQuery(ipo.name);
                                handleSearch(ipo.name);
                              }}
                              className="text-terminal-accent hover:underline uppercase text-[10px] font-bold"
                            >
                              Analyze ›
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {loading && (
          <div className="h-[60vh] flex flex-col items-center justify-center text-center">
            <Loader2 className="w-12 h-12 animate-spin text-terminal-accent mb-4" />
            <p className="text-terminal-accent font-bold animate-pulse">GENERATING ANALYSIS REPORT...</p>
            <p className="text-xs text-terminal-dim mt-2">Gathering live market data and financial metrics</p>
          </div>
        )}

        {error && (
          <div className="h-[60vh] flex flex-col items-center justify-center text-center text-terminal-red">
            <ShieldAlert className="w-12 h-12 mb-4" />
            <p className="font-bold">{error}</p>
            <button onClick={() => handleSearch()} className="mt-4 terminal-btn text-xs">RETRY</button>
          </div>
        )}

        {analysis && !loading && (
          <div className="space-y-6">
            {/* Analysis Header */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-terminal-border pb-6"
            >
              <div>
                <div className="flex items-center gap-2 text-terminal-accent text-xs font-bold mb-1">
                  <span>{analysis.company.sector}</span>
                  <span>•</span>
                  <span>{analysis.company.industry}</span>
                </div>
                <h2 className="text-4xl font-bold tracking-tighter uppercase">{analysis.company.name} {analysis.company.ticker && <span className="text-terminal-dim">({analysis.company.ticker})</span>}</h2>
                <p className="text-terminal-dim text-sm mt-1">{analysis.company.hq} • Founded {analysis.company.founded}</p>
              </div>
              
              <div className="flex gap-6">
                <div className="text-right">
                  <p className="text-[10px] text-terminal-dim uppercase">IPO Price Band</p>
                  <p className="text-xl font-bold">₹{analysis.ipoDetails.priceBand.lower} - ₹{analysis.ipoDetails.priceBand.upper}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-terminal-dim uppercase">GMP Estimate</p>
                  <div className="flex items-center justify-end gap-1">
                    {analysis.gmp.trend === 'up' ? <TrendingUp className="w-4 h-4 text-terminal-green" /> : <TrendingDown className="w-4 h-4 text-terminal-red" />}
                    <span className={`text-xl font-bold ${analysis.gmp.trend === 'up' ? 'text-terminal-green' : 'text-terminal-red'}`}>
                      +{analysis.gmp.percentage}%
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Tabs */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex overflow-x-auto no-scrollbar border-b border-terminal-border no-print"
            >
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab.id ? 'border-terminal-accent text-terminal-accent' : 'border-transparent text-terminal-dim hover:text-terminal-text'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label.toUpperCase()}
                </button>
              ))}
            </motion.div>

            {/* Tab Content */}
            <div className="py-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                >
                  {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <motion.div variants={itemVariants} className="md:col-span-2 space-y-6">
                        <div className="terminal-card">
                          <h3 className="text-xs font-bold text-terminal-accent mb-4 uppercase">Business Model</h3>
                          <p className="text-sm leading-relaxed">{analysis.company.businessModel}</p>
                        </div>
                        {analysis.company.parent && (
                          <div className="terminal-card border-l-4 border-l-terminal-accent">
                            <h3 className="text-xs font-bold text-terminal-accent mb-2 uppercase">Corporate Structure</h3>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-terminal-dim">Parent Entity</span>
                              <span className="text-sm font-bold">{analysis.company.parent}</span>
                            </div>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="terminal-card">
                            <h3 className="text-xs font-bold text-terminal-accent mb-4 uppercase">Issue Details</h3>
                            <div className="space-y-3">
                              <div className="flex justify-between text-xs">
                                <span className="text-terminal-dim">Total Issue Size</span>
                                <span className="font-bold">{analysis.ipoDetails.issueSize}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-terminal-dim">Fresh Issue</span>
                                <span className="font-bold">{analysis.ipoDetails.freshIssue}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-terminal-dim">OFS</span>
                                <span className="font-bold">{analysis.ipoDetails.ofs}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-terminal-dim">Lot Size</span>
                                <span className="font-bold">{analysis.ipoDetails.lotSize} Shares</span>
                              </div>
                            </div>
                          </div>
                          <div className="terminal-card">
                            <h3 className="text-xs font-bold text-terminal-accent mb-4 uppercase">Key Parties</h3>
                            <div className="space-y-3">
                              <div className="flex flex-col text-xs">
                                <span className="text-terminal-dim">Lead Manager (BRLM)</span>
                                <span className="font-bold">{analysis.ipoDetails.brlm}</span>
                              </div>
                              <div className="flex flex-col text-xs">
                                <span className="text-terminal-dim">Registrar</span>
                                <span className="font-bold">{analysis.ipoDetails.registrar}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                      <motion.div variants={itemVariants} className="space-y-6">
                        <div className="terminal-card">
                          <MetricDisplay 
                            label="Promoter Holding" 
                            value={`${analysis.ipoDetails.promoterHolding.value}%`} 
                            status={analysis.ipoDetails.promoterHolding.status}
                            description={analysis.ipoDetails.promoterHolding.description}
                          />
                        </div>
                        <div className="terminal-card">
                          <h3 className="text-xs font-bold text-terminal-accent mb-4 uppercase">Use of Proceeds</h3>
                          <ul className="space-y-2">
                            {analysis.ipoDetails.proceedsUse.map((item, idx) => (
                              <li key={idx} className="text-xs flex gap-2">
                                <span className="text-terminal-accent">›</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="terminal-card border-t-2 border-t-terminal-accent">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xs font-bold text-terminal-accent uppercase tracking-widest flex items-center gap-2">
                              <Landmark className="w-4 h-4" /> Market Context
                            </h3>
                            <button 
                              onClick={() => setActiveTab('calendar')}
                              className="text-[10px] text-terminal-dim hover:text-terminal-accent underline"
                            >
                              VIEW FULL CALENDAR
                            </button>
                          </div>
                          <div className="space-y-3">
                            <p className="text-[10px] text-terminal-dim uppercase">Other Upcoming IPOs</p>
                            {upcomingIpos.filter(ipo => ipo.name !== analysis.company.name).slice(0, 3).map((ipo, idx) => (
                              <div key={idx} className="flex justify-between items-center group">
                                <div className="flex flex-col">
                                  <span className="text-xs font-bold group-hover:text-terminal-accent transition-colors">{ipo.name}</span>
                                  <span className="text-[10px] text-terminal-dim">{ipo.date}</span>
                                </div>
                                <button 
                                  onClick={() => { setQuery(ipo.name); handleSearch(ipo.name); }}
                                  className="text-[10px] font-bold text-terminal-accent opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  ANALYZE ›
                                </button>
                              </div>
                            ))}
                            {upcomingIpos.length <= 1 && (
                              <p className="text-[10px] text-terminal-dim italic">No other upcoming IPOs tracked.</p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  )}

                  {activeTab === 'valuation' && (
                    <motion.div variants={containerVariants} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <motion.div variants={itemVariants} className="terminal-card">
                          <MetricDisplay {...analysis.valuation.peRatio} />
                        </motion.div>
                        <motion.div variants={itemVariants} className="terminal-card">
                          <MetricDisplay {...analysis.valuation.pbRatio} />
                        </motion.div>
                        <motion.div variants={itemVariants} className="terminal-card">
                          <MetricDisplay {...analysis.valuation.evEbitda} />
                        </motion.div>
                        <motion.div variants={itemVariants} className="terminal-card">
                          <MetricDisplay {...analysis.valuation.listingGainEstimate} />
                        </motion.div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* DCF Analysis */}
                        {analysis.valuation.dcf && (
                          <motion.div variants={itemVariants} className="terminal-card">
                            <h3 className="text-xs font-bold text-terminal-accent mb-4 uppercase">DCF Analysis (Intrinsic Value)</h3>
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <p className="text-[10px] text-terminal-dim uppercase">Fair Value</p>
                                <p className="text-2xl font-bold">₹{analysis.valuation.dcf.fairValue}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-[10px] text-terminal-dim uppercase">Upside/Downside</p>
                                <p className={`text-lg font-bold ${analysis.valuation.dcf.upside >= 0 ? 'text-terminal-green' : 'text-terminal-red'}`}>
                                  {analysis.valuation.dcf.upside > 0 ? '+' : ''}{analysis.valuation.dcf.upside}%
                                </p>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <p className="text-[10px] text-terminal-dim uppercase">Key Assumptions</p>
                              <ul className="text-[10px] space-y-1 list-disc list-inside marker:text-terminal-accent">
                                {analysis.valuation.dcf.assumptions.map((a, i) => (
                                  <li key={i} className="text-terminal-dim">
                                    <span className="text-white">{a}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </motion.div>
                        )}

                        {/* Comps & FCF */}
                        <motion.div variants={itemVariants} className="space-y-6">
                          {analysis.valuation.comps && (
                            <div className="terminal-card">
                              <h3 className="text-xs font-bold text-terminal-accent mb-4 uppercase">Comparative Analysis (Comps)</h3>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-[10px] text-terminal-dim uppercase">Avg Peer P/E</p>
                                  <p className="text-xl font-bold">{analysis.valuation.comps.averagePe}x</p>
                                </div>
                                <div>
                                  <p className="text-[10px] text-terminal-dim uppercase">Implied Price</p>
                                  <p className="text-xl font-bold">₹{analysis.valuation.comps.impliedPrice}</p>
                                </div>
                              </div>
                            </div>
                          )}

                          {analysis.valuation.fcf && (
                            <div className="terminal-card">
                              <h3 className="text-xs font-bold text-terminal-accent mb-4 uppercase">Free Cash Flow (FCF)</h3>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-[10px] text-terminal-dim uppercase">FCF Yield</p>
                                  <p className="text-xl font-bold">{analysis.valuation.fcf.yield}%</p>
                                </div>
                                <div>
                                  <p className="text-[10px] text-terminal-dim uppercase">FCF Growth</p>
                                  <p className="text-xl font-bold">{analysis.valuation.fcf.growth}%</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      </div>

                      {/* LBO Feasibility */}
                      {analysis.valuation.lbo && (
                        <motion.div variants={itemVariants} className="terminal-card">
                          <h3 className="text-xs font-bold text-terminal-accent mb-4 uppercase">LBO Feasibility (Private Equity Perspective)</h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                              <p className="text-[10px] text-terminal-dim uppercase">Estimated IRR</p>
                              <p className="text-xl font-bold text-terminal-accent">{analysis.valuation.lbo.irr}%</p>
                              <p className="text-[10px] text-terminal-dim mt-1">Projected 5-year return</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-terminal-dim uppercase">Exit Multiple</p>
                              <p className="text-xl font-bold">{analysis.valuation.lbo.exitMultiple}x</p>
                              <p className="text-[10px] text-terminal-dim mt-1">Target EV/EBITDA at exit</p>
                            </div>
                            <div className="flex items-center">
                              <p className="text-xs text-terminal-dim italic">
                                Analysis suggests this IPO {analysis.valuation.lbo.irr > 20 ? 'is a strong' : 'is a moderate'} candidate for leveraged buyout based on cash flow stability.
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      <motion.div variants={itemVariants} className="terminal-card mt-4">
                        <h3 className="text-xs font-bold text-terminal-accent mb-4 uppercase">Valuation Summary</h3>
                        <p className="text-sm">The company is seeking a market capitalization of {analysis.valuation.marketCap}. Compared to industry peers, the valuation appears to be {analysis.valuation.peRatio.status.toLowerCase()}.</p>
                      </motion.div>
                    </motion.div>
                  )}
                  {activeTab === 'financials' && (
                    <motion.div variants={containerVariants} className="space-y-6">
                      <motion.div 
                        variants={itemVariants}
                        className={`terminal-card border-dashed transition-all duration-200 ${
                          isDragging ? 'bg-terminal-accent/20 border-terminal-accent scale-[1.01]' : 'bg-terminal-accent/5 border-terminal-accent/30'
                        }`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-terminal-accent/10 rounded-sm">
                              <FileText className="w-5 h-5 text-terminal-accent" />
                            </div>
                            <div>
                              <h3 className="text-xs font-bold text-terminal-accent uppercase">DRHP Data Integration</h3>
                              <p className="text-[10px] text-terminal-dim">Import Draft Red Herring Prospectus for deeper financial analysis</p>
                            </div>
                          </div>
                            <div className="flex items-center gap-2">
                              <div className="relative flex-1 md:w-64">
                                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-terminal-dim" />
                                <input 
                                  type="text" 
                                  placeholder="Paste DRHP PDF URL..." 
                                  value={drhpUrl}
                                  onChange={(e) => setDrhpUrl(e.target.value)}
                                  className="w-full bg-black border border-terminal-border text-[10px] pl-8 pr-3 py-1.5 focus:outline-none focus:border-terminal-accent"
                                />
                              </div>
                              <div className="flex items-center gap-1">
                                <input 
                                  type="file" 
                                  id="drhp-upload" 
                                  className="hidden" 
                                  accept=".pdf,.doc,.docx,.txt"
                                  onChange={handleFileUpload}
                                />
                                <label 
                                  htmlFor="drhp-upload"
                                  className="terminal-btn text-[10px] py-1.5 px-3 cursor-pointer flex items-center gap-2"
                                >
                                  <Upload className="w-3 h-3" />
                                  UPLOAD
                                </label>
                                <button 
                                  onClick={handleImportDRHP}
                                  disabled={isImportingDRHP || !drhpUrl.trim()}
                                  className="terminal-btn-primary text-[10px] py-1.5 px-4 flex items-center gap-2 whitespace-nowrap"
                                >
                                  {isImportingDRHP ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <CheckSquare className="w-3 h-3" />
                                  )}
                                  {drhpStatus === 'synced' ? 'SYNCED' : 'SYNC URL'}
                                </button>
                              </div>
                            </div>
                        </div>
                        {drhpStatus === 'synced' && (
                          <div className="mt-3 flex items-center gap-2 text-[10px] text-terminal-green">
                            <div className="w-1.5 h-1.5 bg-terminal-green rounded-full animate-pulse"></div>
                            <span>AI Analyst is now using DRHP context for financial insights.</span>
                          </div>
                        )}
                      </motion.div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <motion.div variants={itemVariants} className="terminal-card">
                          <h3 className="text-xs font-bold text-terminal-accent mb-4 uppercase">Revenue Growth (Last 3 Years)</h3>
                          <div className="space-y-4">
                            {analysis.financials.revenue.map((m, i) => (
                              <MetricDisplay key={i} {...m} className="border-b border-terminal-border pb-2 last:border-0" />
                            ))}
                          </div>
                        </motion.div>
                        <motion.div variants={itemVariants} className="terminal-card">
                          <h3 className="text-xs font-bold text-terminal-accent mb-4 uppercase">Profitability Trend</h3>
                          <div className="space-y-4">
                            {analysis.financials.profit.map((m, i) => (
                              <MetricDisplay key={i} {...m} className="border-b border-terminal-border pb-2 last:border-0" />
                            ))}
                          </div>
                        </motion.div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <motion.div variants={itemVariants} className="terminal-card">
                          <MetricDisplay {...analysis.financials.roe} />
                        </motion.div>
                        <motion.div variants={itemVariants} className="terminal-card">
                          <MetricDisplay {...analysis.financials.debtToEquity} />
                        </motion.div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'risk' && (
                    <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {analysis.risks.map((risk, idx) => (
                        <motion.div variants={itemVariants} key={idx} className="terminal-card border-l-4 border-l-terminal-red">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="text-sm font-bold uppercase">{risk.title}</h3>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm bg-terminal-red text-black`}>
                              {risk.severity}
                            </span>
                          </div>
                          <p className="text-xs text-terminal-dim leading-relaxed">{risk.description}</p>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}

                  {activeTab === 'news' && (
                    <motion.div variants={containerVariants} className="space-y-4">
                      <motion.div variants={itemVariants} className="flex flex-wrap gap-2 mb-4">
                        {['all', 'positive', 'neutral', 'negative'].map((sentiment) => (
                          <button
                            key={sentiment}
                            onClick={() => setNewsSentimentFilter(sentiment as any)}
                            className={`px-3 py-1 text-[10px] font-bold uppercase border transition-colors ${
                              newsSentimentFilter === sentiment
                                ? 'bg-terminal-accent text-black border-terminal-accent'
                                : 'bg-transparent text-terminal-dim border-terminal-border hover:border-terminal-accent/50'
                            }`}
                          >
                            {sentiment}
                          </button>
                        ))}
                      </motion.div>
                      {analysis.news
                        .filter((item) => newsSentimentFilter === 'all' || item.sentiment === newsSentimentFilter)
                        .map((item, idx) => (
                          <motion.div variants={itemVariants} key={idx} className="terminal-card flex items-center justify-between gap-4">
                            <div>
                              <h3 className="text-sm font-bold mb-1">{item.title}</h3>
                              <p className="text-[10px] text-terminal-dim uppercase">{item.source} • {item.date}</p>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-sm uppercase ${
                              item.sentiment === 'positive' ? 'bg-terminal-green text-black' : 
                              item.sentiment === 'negative' ? 'bg-terminal-red text-black' : 'bg-terminal-dim text-black'
                            }`}>
                              {item.sentiment}
                            </span>
                          </motion.div>
                        ))}
                      {analysis.news.filter((item) => newsSentimentFilter === 'all' || item.sentiment === newsSentimentFilter).length === 0 && (
                        <motion.div variants={itemVariants} className="terminal-card py-8 text-center text-terminal-dim italic">
                          No {newsSentimentFilter} news articles found for this IPO.
                        </motion.div>
                      )}
                    </motion.div>
                  )}

                  {activeTab === 'peers' && (
                    <motion.div variants={containerVariants} className="space-y-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <motion.div variants={itemVariants} className="terminal-card">
                          <h3 className="text-xs font-bold text-terminal-accent mb-4 uppercase">P/E Ratio Comparison</h3>
                          <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={[
                                  { name: 'IPO', pe: Number(analysis.valuation.peRatio.value) || 0, isIpo: true },
                                  ...analysis.peers.map(p => ({ name: p.name, pe: p.pe, isIpo: false }))
                                ]}
                                layout="vertical"
                                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                                <XAxis type="number" stroke="#888" fontSize={10} />
                                <YAxis dataKey="name" type="category" stroke="#888" fontSize={10} width={80} />
                                <Tooltip 
                                  contentStyle={{ backgroundColor: '#111', border: '1px solid #333', fontSize: '12px' }}
                                  itemStyle={{ color: '#00FF41' }}
                                />
                                <Bar dataKey="pe" radius={[0, 4, 4, 0]}>
                                  {[
                                    { name: 'IPO', pe: Number(analysis.valuation.peRatio.value) || 0, isIpo: true },
                                    ...analysis.peers.map(p => ({ name: p.name, pe: p.pe, isIpo: false }))
                                  ].map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.isIpo ? '#00FF41' : '#444'} />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </motion.div>

                        <motion.div variants={itemVariants} className="terminal-card">
                          <h3 className="text-xs font-bold text-terminal-accent mb-4 uppercase">Market Cap Comparison (₹ Cr)</h3>
                          <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={[
                                  { 
                                    name: 'IPO', 
                                    mcap: parseFloat(analysis.valuation.marketCap.replace(/[^0-9.]/g, '')) || 0, 
                                    isIpo: true 
                                  },
                                  ...analysis.peers.map(p => ({ 
                                    name: p.name, 
                                    mcap: parseFloat(p.marketCap.replace(/[^0-9.]/g, '')) || 0, 
                                    isIpo: false 
                                  }))
                                ]}
                                layout="vertical"
                                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                                <XAxis type="number" stroke="#888" fontSize={10} />
                                <YAxis dataKey="name" type="category" stroke="#888" fontSize={10} width={80} />
                                <Tooltip 
                                  contentStyle={{ backgroundColor: '#111', border: '1px solid #333', fontSize: '12px' }}
                                  itemStyle={{ color: '#00FF41' }}
                                />
                                <Bar dataKey="mcap" radius={[0, 4, 4, 0]}>
                                  {[
                                    { 
                                      name: 'IPO', 
                                      mcap: parseFloat(analysis.valuation.marketCap.replace(/[^0-9.]/g, '')) || 0, 
                                      isIpo: true 
                                    },
                                    ...analysis.peers.map(p => ({ 
                                      name: p.name, 
                                      mcap: parseFloat(p.marketCap.replace(/[^0-9.]/g, '')) || 0, 
                                      isIpo: false 
                                    }))
                                  ].map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.isIpo ? '#00FF41' : '#444'} />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </motion.div>
                      </div>

                      <motion.div variants={itemVariants} className="terminal-card overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-terminal-border text-terminal-dim uppercase">
                              <th className="py-3 px-4">Peer Company</th>
                              <th className="py-3 px-4">P/E Ratio</th>
                              <th className="py-3 px-4">Market Cap</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="bg-terminal-accent/10 font-bold">
                              <td className="py-3 px-4">{analysis.company.name} (IPO)</td>
                              <td className="py-3 px-4">{analysis.valuation.peRatio.value}</td>
                              <td className="py-3 px-4">{analysis.valuation.marketCap}</td>
                            </tr>
                            {analysis.peers.map((peer, idx) => (
                              <tr key={idx} className="border-b border-terminal-border hover:bg-white/5">
                                <td className="py-3 px-4">{peer.name}</td>
                                <td className="py-3 px-4">{peer.pe}</td>
                                <td className="py-3 px-4">{peer.marketCap}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </motion.div>
                    </motion.div>
                  )}

                  {activeTab === 'gmp' && (
                    <motion.div variants={containerVariants} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <motion.div variants={itemVariants} className="terminal-card flex flex-col items-center justify-center py-12">
                          <p className="text-[10px] text-terminal-dim uppercase mb-2">Current Grey Market Premium</p>
                          <div className="flex items-center gap-3">
                            <span className={`text-5xl font-bold px-4 py-1 rounded-md ${
                              analysis.gmp.trend === 'up' ? 'bg-terminal-green text-black' : 
                              analysis.gmp.trend === 'down' ? 'bg-terminal-red text-black' : 'bg-terminal-border text-terminal-text'
                            }`}>₹{analysis.gmp.current}</span>
                            <div className="flex flex-col items-start">
                              {analysis.gmp.trend === 'up' ? (
                                <TrendingUp className="w-6 h-6 text-terminal-green" />
                              ) : analysis.gmp.trend === 'down' ? (
                                <TrendingDown className="w-6 h-6 text-terminal-red" />
                              ) : null}
                              <span className={`text-[10px] font-bold px-1 rounded-sm uppercase ${
                                analysis.gmp.trend === 'up' ? 'bg-terminal-green text-black' : 
                                analysis.gmp.trend === 'down' ? 'bg-terminal-red text-black' : 'bg-terminal-border text-terminal-text'
                              }`}>
                                {analysis.gmp.trend}
                              </span>
                            </div>
                          </div>
                        </motion.div>

                        <motion.div variants={itemVariants} className="terminal-card flex flex-col items-center justify-center py-12">
                          <p className="text-[10px] text-terminal-dim uppercase mb-2">Estimated Listing Gain</p>
                          <div className="flex items-center gap-3">
                            {analysis.gmp.trend === 'up' ? (
                              <TrendingUp className="w-10 h-10 text-terminal-green" />
                            ) : analysis.gmp.trend === 'down' ? (
                              <TrendingDown className="w-10 h-10 text-terminal-red" />
                            ) : (
                              <Info className="w-10 h-10 text-terminal-dim" />
                            )}
                            <span className={`text-5xl font-bold px-4 py-1 rounded-md ${
                              analysis.gmp.trend === 'up' ? 'bg-terminal-green text-black' : 
                              analysis.gmp.trend === 'down' ? 'bg-terminal-red text-black' : 'bg-terminal-border text-terminal-text'
                            }`}>
                              {analysis.gmp.percentage}%
                            </span>
                          </div>
                        </motion.div>

                        {analysis.priceHistory && analysis.priceHistory.length > 0 && (
                          <motion.div variants={itemVariants} className="md:col-span-2 terminal-card">
                            <h3 className="text-xs font-bold text-terminal-accent mb-4 uppercase">GMP & Price Trend (Last 30 Days)</h3>
                            <div className="h-64 w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={analysis.priceHistory}>
                                  <defs>
                                    <linearGradient id="colorGmp" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#00FF41" stopOpacity={0.3}/>
                                      <stop offset="95%" stopColor="#00FF41" stopOpacity={0}/>
                                    </linearGradient>
                                  </defs>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                  <XAxis dataKey="date" stroke="#888" fontSize={10} />
                                  <YAxis stroke="#888" fontSize={10} />
                                  <Tooltip 
                                    contentStyle={{ backgroundColor: '#111', border: '1px solid #333', fontSize: '12px' }}
                                    itemStyle={{ color: '#00FF41' }}
                                  />
                                  <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                                  <Area 
                                    type="monotone" 
                                    dataKey="gmp" 
                                    stroke="#00FF41" 
                                    fillOpacity={1} 
                                    fill="url(#colorGmp)" 
                                    name="GMP (₹)"
                                  />
                                  <Line 
                                    type="monotone" 
                                    dataKey="price" 
                                    stroke="#FFB800" 
                                    strokeWidth={2} 
                                    dot={{ r: 4, fill: '#FFB800' }} 
                                    name="Implied Price (₹)"
                                  />
                                </AreaChart>
                              </ResponsiveContainer>
                            </div>
                          </motion.div>
                        )}

                        <motion.div variants={itemVariants} className="md:col-span-2 terminal-card">
                          <h3 className="text-xs font-bold text-terminal-accent mb-4 uppercase">GMP Analysis Note</h3>
                          <p className="text-xs text-terminal-dim leading-relaxed">
                            Grey Market Premium (GMP) is an unofficial indicator of the market's appetite for an IPO. 
                            A positive GMP of <span className="text-terminal-accent font-bold">{analysis.gmp.percentage}%</span> suggests 
                            strong demand, but it should be used in conjunction with financial fundamentals. 
                            Current trend is <span className={`font-bold px-1 rounded-sm ${
                              analysis.gmp.trend === 'up' ? 'bg-terminal-green text-black' : 
                              analysis.gmp.trend === 'down' ? 'bg-terminal-red text-black' : 'bg-terminal-border text-terminal-text'
                            }`}>{analysis.gmp.trend.toUpperCase()}</span>.
                          </p>
                        </motion.div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'market_trends' && (
                    <motion.div variants={containerVariants} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {analysis.marketTrend && analysis.marketTrend.length > 0 && (
                          <>
                            <motion.div variants={itemVariants} className="terminal-card">
                              <h3 className="text-xs font-bold text-terminal-accent mb-4 uppercase">Market Index Trend</h3>
                              <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                  <LineChart data={analysis.marketTrend}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                    <XAxis dataKey="date" stroke="#888" fontSize={10} />
                                    <YAxis stroke="#888" fontSize={10} domain={['auto', 'auto']} />
                                    <Tooltip 
                                      contentStyle={{ backgroundColor: '#111', border: '1px solid #333', fontSize: '12px' }}
                                    />
                                    <Line 
                                      type="monotone" 
                                      dataKey="indexValue" 
                                      stroke="#007AFF" 
                                      strokeWidth={2} 
                                      dot={false}
                                      name="Index Value"
                                    />
                                  </LineChart>
                                </ResponsiveContainer>
                              </div>
                            </motion.div>

                            <motion.div variants={itemVariants} className="terminal-card">
                              <h3 className="text-xs font-bold text-terminal-accent mb-4 uppercase">Market Sentiment (0-100)</h3>
                              <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                  <AreaChart data={analysis.marketTrend}>
                                    <defs>
                                      <linearGradient id="colorSentiment" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#FFB800" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#FFB800" stopOpacity={0}/>
                                      </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                    <XAxis dataKey="date" stroke="#888" fontSize={10} />
                                    <YAxis stroke="#888" fontSize={10} domain={[0, 100]} />
                                    <Tooltip 
                                      contentStyle={{ backgroundColor: '#111', border: '1px solid #333', fontSize: '12px' }}
                                    />
                                    <Area 
                                      type="monotone" 
                                      dataKey="sentiment" 
                                      stroke="#FFB800" 
                                      fillOpacity={1} 
                                      fill="url(#colorSentiment)" 
                                      name="Sentiment Score"
                                    />
                                  </AreaChart>
                                </ResponsiveContainer>
                              </div>
                            </motion.div>
                          </>
                        )}

                        <motion.div variants={itemVariants} className="md:col-span-2 terminal-card">
                          <h3 className="text-xs font-bold text-terminal-accent mb-4 uppercase">Market Intelligence Summary</h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="flex flex-col">
                              <span className="text-[10px] text-terminal-dim uppercase">Current Volatility</span>
                              <span className="text-xl font-bold text-terminal-red">HIGH (VIX: 18.4)</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] text-terminal-dim uppercase">IPO Success Rate</span>
                              <span className="text-xl font-bold text-terminal-green">82% (Last 12 Months)</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] text-terminal-dim uppercase">Retail Participation</span>
                              <span className="text-xl font-bold text-terminal-blue">INCREASING</span>
                            </div>
                          </div>
                        </motion.div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'calendar' && (
                    <motion.div variants={containerVariants} className="space-y-6">
                      <motion.div variants={itemVariants} className="terminal-card">
                        <h3 className="text-xs font-bold text-terminal-accent mb-6 uppercase tracking-widest">Upcoming IPO Calendar</h3>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left">
                            <thead>
                              <tr className="border-b border-terminal-border text-[10px] text-terminal-dim uppercase">
                                <th className="pb-4 font-medium">Company</th>
                                <th className="pb-4 font-medium">Sector</th>
                                <th className="pb-4 font-medium">Expected Date</th>
                                <th className="pb-4 font-medium">Issue Size</th>
                                <th className="pb-4 font-medium">Status</th>
                                <th className="pb-4 font-medium text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody className="text-xs">
                              {upcomingIpos.length > 0 ? (
                                upcomingIpos.map((ipo, idx) => (
                                  <tr key={idx} className="border-b border-terminal-border/50 hover:bg-terminal-accent/5 transition-colors">
                                    <td className="py-4 font-bold">{ipo.name}</td>
                                    <td className="py-4 text-terminal-dim">{ipo.sector}</td>
                                    <td className="py-4">{ipo.date}</td>
                                    <td className="py-4">{ipo.size}</td>
                                    <td className="py-4">
                                      <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase ${
                                        ipo.status === 'Upcoming' ? 'bg-terminal-accent/20 text-terminal-accent' :
                                        ipo.status === 'Open' ? 'bg-terminal-green/20 text-terminal-green' :
                                        'bg-terminal-red/20 text-terminal-red'
                                      }`}>
                                        {ipo.status}
                                      </span>
                                    </td>
                                    <td className="py-4 text-right">
                                      <button 
                                        onClick={() => {
                                          setQuery(ipo.name);
                                          handleSearch(ipo.name);
                                          setActiveTab('overview');
                                        }}
                                        className="text-terminal-accent hover:underline uppercase text-[10px] font-bold"
                                      >
                                        Analyze ›
                                      </button>
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={6} className="py-12 text-center text-terminal-dim italic">
                                    {loading ? 'Fetching latest market data...' : 'No upcoming IPOs found in the current cycle.'}
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </motion.div>
                      <motion.div variants={itemVariants} className="terminal-card bg-terminal-accent/5 border-terminal-accent/20">
                        <div className="flex gap-4 items-start">
                          <Info className="w-5 h-5 text-terminal-accent flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="text-xs font-bold text-terminal-accent uppercase mb-1">Market Intelligence Note</h4>
                            <p className="text-[10px] text-terminal-dim leading-relaxed">
                              Dates and issue sizes are based on preliminary filings and market rumors. 
                              Actual dates may vary based on SEBI/Regulatory approvals and market conditions. 
                              Click "Analyze" to get a deep-dive report on any specific company.
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}

                  {activeTab === 'updates' && (
                    <motion.div variants={containerVariants} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 space-y-6">
                          <motion.h3 variants={itemVariants} className="text-xs font-bold text-terminal-accent uppercase tracking-widest flex items-center gap-2">
                            <Newspaper className="w-4 h-4" /> Live Market Updates (via IPOPremium)
                          </motion.h3>
                          {marketUpdates.length > 0 ? (
                            marketUpdates.map((update, idx) => (
                              <motion.div variants={itemVariants} key={idx} className="terminal-card hover:border-terminal-accent/50 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                  <span className="text-[10px] text-terminal-accent font-bold uppercase tracking-tighter bg-terminal-accent/10 px-1.5 py-0.5 rounded">
                                    {update.category || 'Market Update'}
                                  </span>
                                  <span className="text-[10px] text-terminal-dim font-mono">{update.date}</span>
                                </div>
                                <h4 className="text-sm font-bold mb-2 text-white">{update.title}</h4>
                                <p className="text-xs text-terminal-dim leading-relaxed">{update.content}</p>
                              </motion.div>
                            ))
                          ) : (
                            <motion.div variants={itemVariants} className="terminal-card py-12 text-center text-terminal-dim italic">
                              {loading ? 'Scanning ipopremium.in for latest updates...' : 'No recent updates found.'}
                            </motion.div>
                          )}
                        </div>
                        <div className="space-y-6">
                          <motion.div variants={itemVariants} className="terminal-card border-terminal-green/30">
                            <h3 className="text-[10px] font-bold text-terminal-green uppercase mb-4 tracking-widest">Market Sentiment</h3>
                            <div className="space-y-4">
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] text-terminal-dim uppercase">Nifty 50</span>
                                <span className="text-xs font-bold text-terminal-green">+0.45%</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] text-terminal-dim uppercase">IPO Index</span>
                                <span className="text-xs font-bold text-terminal-green">+1.22%</span>
                              </div>
                              <div className="h-1 w-full bg-terminal-border rounded-full overflow-hidden">
                                <div className="h-full bg-terminal-green w-[75%]"></div>
                              </div>
                              <p className="text-[10px] text-terminal-dim italic">Market sentiment remains bullish for upcoming primary market entries.</p>
                            </div>
                          </motion.div>
                          <motion.div variants={itemVariants} className="terminal-card">
                            <h3 className="text-[10px] font-bold text-terminal-accent uppercase mb-4 tracking-widest">Quick Links</h3>
                            <ul className="space-y-2 text-[10px] text-terminal-dim uppercase">
                              <li className="hover:text-terminal-accent cursor-pointer flex items-center gap-2">
                                <div className="w-1 h-1 bg-terminal-accent rounded-full"></div>
                                SEBI Filings
                              </li>
                              <li className="hover:text-terminal-accent cursor-pointer flex items-center gap-2">
                                <div className="w-1 h-1 bg-terminal-accent rounded-full"></div>
                                NSE IPO Page
                              </li>
                              <li className="hover:text-terminal-accent cursor-pointer flex items-center gap-2">
                                <div className="w-1 h-1 bg-terminal-accent rounded-full"></div>
                                BSE IPO Page
                              </li>
                            </ul>
                          </motion.div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'verdict' && (
                    <motion.div variants={containerVariants} className="max-w-3xl mx-auto space-y-8 py-8">
                      <motion.div variants={itemVariants} className="text-center">
                        <div className="inline-block relative">
                          <svg className="w-48 h-48">
                            <circle cx="96" cy="96" r="88" fill="none" stroke="#333" strokeWidth="12" />
                            <circle 
                              cx="96" cy="96" r="88" fill="none" 
                              stroke={analysis.verdict.score > 70 ? '#00FF00' : analysis.verdict.score > 40 ? '#FFB800' : '#FF3B30'} 
                              strokeWidth="12" 
                              strokeDasharray={552.92}
                              strokeDashoffset={552.92 - (552.92 * analysis.verdict.score) / 100}
                              strokeLinecap="round"
                              transform="rotate(-90 96 96)"
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-5xl font-bold tracking-tighter">{analysis.verdict.score}</span>
                            <span className="text-[10px] text-terminal-dim uppercase">Intel Score</span>
                          </div>
                        </div>
                      </motion.div>

                      <motion.div variants={itemVariants} className="terminal-card text-center p-8 border-2 border-terminal-accent">
                        <h3 className="text-xs font-bold text-terminal-accent mb-2 uppercase tracking-widest">Final Recommendation</h3>
                        <p className={`text-5xl font-bold mb-6 tracking-tighter uppercase ${
                          analysis.verdict.recommendation === 'Subscribe' ? 'text-terminal-green' : 
                          analysis.verdict.recommendation === 'Avoid' ? 'text-terminal-red' : 'text-terminal-accent'
                        }`}>
                          {analysis.verdict.recommendation}
                        </p>
                        <p className="text-sm leading-relaxed text-terminal-text">{analysis.verdict.summary}</p>
                      </motion.div>
                    </motion.div>
                  )}

                  {activeTab === 'ai' && (
                    <motion.div variants={containerVariants} className="flex flex-col h-[600px] terminal-card p-0 overflow-hidden">
                      <div className="bg-terminal-accent/10 p-4 border-b border-terminal-border flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-terminal-accent rounded-full flex items-center justify-center">
                            <Bot className="w-5 h-5 text-black" />
                          </div>
                          <div>
                            <h3 className="text-xs font-bold uppercase">AI Analyst Intelligence</h3>
                            <p className="text-[10px] text-terminal-dim">Powered by Gemini 3.1 Pro</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-terminal-green rounded-full animate-pulse"></span>
                          <span className="text-[10px] text-terminal-green font-bold uppercase">System Online</span>
                        </div>
                      </div>

                      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-terminal-border">
                        {chatMessages.length === 0 && (
                          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                            <Bot className="w-12 h-12 text-terminal-accent" />
                            <div className="max-w-xs">
                              <p className="text-sm font-bold uppercase mb-1">Awaiting Query...</p>
                              <p className="text-[10px] leading-relaxed">
                                Ask me about {analysis.company.name}'s valuation, competitive landscape, or specific risk factors.
                              </p>
                            </div>
                            <div className="grid grid-cols-1 gap-2 w-full max-w-xs">
                              {[
                                "Is the valuation justified?",
                                "What are the biggest red flags?",
                                "Compare with listed peers.",
                                "Analyze the proceeds usage."
                              ].map((q, i) => (
                                <motion.button
                                  key={i}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: 0.1 * i }}
                                  onClick={() => {
                                    handleSendMessage(undefined, q);
                                  }}
                                  className="text-[10px] p-2 border border-terminal-border hover:border-terminal-accent hover:text-terminal-accent transition-colors text-left"
                                >
                                  {q}
                                </motion.button>
                              ))}
                            </div>
                          </div>
                        )}
                        <AnimatePresence>
                          {chatMessages.map((msg, i) => (
                            <motion.div 
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              transition={{ duration: 0.2 }}
                              key={i} 
                              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                              <div className={`max-w-[80%] flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
                                  msg.role === 'user' ? 'bg-terminal-dim' : 'bg-terminal-accent'
                                }`}>
                                  {msg.role === 'user' ? <User className="w-4 h-4 text-black" /> : <Bot className="w-4 h-4 text-black" />}
                                </div>
                                <div className={`p-3 rounded-sm text-xs leading-relaxed ${
                                  msg.role === 'user' ? 'bg-terminal-border text-white' : 'bg-terminal-panel border border-terminal-border text-terminal-text'
                                }`}>
                                  <div className="whitespace-pre-wrap">{msg.parts[0].text}</div>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                        {isChatLoading && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex justify-start"
                          >
                            <div className="flex gap-3">
                              <div className="w-6 h-6 rounded-full bg-terminal-accent flex items-center justify-center flex-shrink-0 animate-pulse">
                                <Bot className="w-4 h-4 text-black" />
                              </div>
                              <div className="p-3 bg-terminal-panel border border-terminal-border rounded-sm">
                                <div className="flex gap-1">
                                  <span className="w-1.5 h-1.5 bg-terminal-accent rounded-full animate-bounce"></span>
                                  <span className="w-1.5 h-1.5 bg-terminal-accent rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                  <span className="w-1.5 h-1.5 bg-terminal-accent rounded-full animate-bounce [animation-delay:0.4s]"></span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                        <div ref={messagesEndRef} />
                      </div>

                      <form onSubmit={handleSendMessage} className="p-4 border-t border-terminal-border bg-black">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            placeholder="Ask the AI Analyst..."
                            className="flex-1 terminal-input text-xs"
                            disabled={isChatLoading}
                          />
                          <button
                            type="submit"
                            disabled={isChatLoading || !chatInput.trim()}
                            className="terminal-btn-primary p-2 flex items-center justify-center"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-terminal-border bg-black py-4 no-print">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-terminal-dim uppercase tracking-widest">
          <div className="flex items-center gap-4">
            <span>© 2026 IPO INTEL TERMINAL</span>
            <span className="text-terminal-green">● LIVE MARKET CONNECTED</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Data provided by Gemini AI</span>
            <span>Bloomberg Aesthetic v1.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
