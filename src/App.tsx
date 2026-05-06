import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  ChevronRight, 
  Clock, 
  Download, 
  GraduationCap, 
  Layout, 
  ListChecks, 
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { TOPICS } from './constants';
import { Topic, StudyMaterial, Question } from './types';
import { generateStudyMaterial } from './services/geminiService';
import { cn } from './lib/utils';

export default function App() {
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [studyMaterial, setStudyMaterial] = useState<StudyMaterial | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [showResults, setShowResults] = useState(false);

  // Set the exam date relative to current time for demo, but user said 9th May.
  // Today is May 6th, 2026.
  const examDate = new Date('2026-05-09T09:00:00');
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0 });

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const diff = examDate.getTime() - now.getTime();
      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          mins: Math.floor((diff / (1000 * 60)) % 60),
        });
      }
    };
    updateCountdown();
    const timer = setInterval(updateCountdown, 60000);
    return () => clearInterval(timer);
  }, []);

  const filteredTopics = useMemo(() => 
    TOPICS.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase())),
    [searchQuery]
  );

  const fetchMaterial = async (topic: Topic) => {
    setLoading(true);
    setError(null);
    setStudyMaterial(null);
    setUserAnswers({});
    setShowResults(false);
    try {
      const material = await generateStudyMaterial(topic.title, topic.id);
      setStudyMaterial(material);
    } catch (err) {
      setError('अध्ययन सामग्री प्राप्त करने में विफल। कृपया पुन: प्रयास करें।');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTopic = (topic: Topic) => {
    setSelectedTopic(topic);
    fetchMaterial(topic);
  };

  const handleAnswer = (questionId: string, answerIndex: number) => {
    if (showResults) return;
    setUserAnswers(prev => ({ ...prev, [questionId]: answerIndex }));
  };

  const calculateScore = () => {
    if (!studyMaterial) return 0;
    return studyMaterial.questions.reduce((acc, q) => {
      return acc + (userAnswers[q.id] === q.correctAnswer ? 1 : 0);
    }, 0);
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] font-sans text-stone-900 selection:bg-orange-100 selection:text-orange-900">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-stone-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-200">
              <GraduationCap size={28} />
            </div>
            <div>
              <h1 className="font-black text-xl leading-tight tracking-tight">RAJ LAB ASSISTANT</h1>
              <p className="text-[10px] text-stone-500 font-bold tracking-widest uppercase">Smart Revision Portal</p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold text-orange-600 uppercase tracking-tighter">Exam Countdown</span>
              <div className="flex items-center gap-2 text-stone-900">
                <Clock size={16} className="text-stone-400" />
                <span className="text-sm font-black tabular-nums">
                  {timeLeft.days}D : {timeLeft.hours}H : {timeLeft.mins}M
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Sidebar / Topic List */}
        <aside className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-[2.5rem] border border-stone-200 shadow-xl shadow-stone-100/50">
            <h3 className="text-lg font-black mb-4 flex items-center gap-2">
              <ListChecks className="text-orange-600" size={20} />
              विषय सूची (Index)
            </h3>
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
              <input 
                type="text" 
                placeholder="विषय खोजें (e.g. जलवायु)..."
                className="w-full pl-12 pr-4 py-3 bg-stone-50 border border-stone-100 rounded-2xl focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all placeholder:text-stone-400 placeholder:font-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="space-y-2 max-h-[calc(100vh-420px)] overflow-y-auto pr-2 custom-scrollbar">
              {filteredTopics.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => handleSelectTopic(topic)}
                  className={cn(
                    "w-full text-left p-4 rounded-2xl flex items-center justify-between group transition-all duration-300",
                    selectedTopic?.id === topic.id 
                      ? "bg-stone-900 text-white shadow-xl shadow-stone-900/20 translate-x-1" 
                      : "hover:bg-stone-100 text-stone-600"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black",
                      selectedTopic?.id === topic.id ? "bg-orange-600" : "bg-stone-50 border border-stone-100"
                    )}>
                      {topic.pageRange.split('-')[0].trim()}
                    </div>
                    <span className="text-sm font-bold tracking-tight">{topic.title}</span>
                  </div>
                  <ChevronRight size={18} className={cn(
                    "transition-transform duration-300",
                    selectedTopic?.id === topic.id ? "translate-x-1 text-orange-500" : "group-hover:translate-x-1 opacity-20"
                  )} />
                </button>
              ))}
            </div>
          </div>

          <div className="p-8 bg-gradient-to-br from-orange-600 to-orange-700 rounded-[2.5rem] text-white shadow-2xl shadow-orange-200 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
              <GraduationCap size={120} />
            </div>
            <div className="relative z-10">
              <h4 className="text-2xl font-black mb-2">9 मई की तैयारी!</h4>
              <p className="text-orange-100 text-sm font-medium leading-relaxed">
                समय कम है, इसलिए हमने केवल सबसे महत्वपूर्ण टॉपिक्स को यहाँ संकलित किया है। शुभकामनाएँ!
              </p>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <section className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {!selectedTopic ? (
               <motion.div 
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="bg-white h-full min-h-[600px] p-12 rounded-[3.5rem] border border-stone-200 flex flex-col items-center justify-center text-center space-y-8"
               >
                 <div className="relative">
                    <div className="w-32 h-32 bg-orange-50 rounded-full flex items-center justify-center text-orange-200">
                        <BookOpen size={64} />
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-white rounded-full border border-stone-100 shadow-lg flex items-center justify-center text-orange-600">
                       <CheckCircle2 size={24} />
                    </div>
                 </div>
                 
                 <div className="space-y-3">
                    <h2 className="text-3xl font-black text-stone-900 tracking-tight">अपनी रिवीजन यात्रा शुरू करें</h2>
                    <p className="text-stone-400 font-medium max-w-sm mx-auto leading-relaxed">
                      बाईं ओर सूची से किसी भी विषय का चयन करें। AI आपके लिए महत्वपूर्ण नोट्स और अभ्यास प्रश्न तैयार करेगा।
                    </p>
                 </div>

                 <div className="flex flex-wrap justify-center gap-3">
                    {['नदी तंत्र', 'जनगणना 2011', 'वन नीति', 'खनिज संसाधन'].map(tag => (
                      <span key={tag} className="px-4 py-2 bg-stone-50 border border-stone-100 rounded-full text-xs font-bold text-stone-400">#{tag}</span>
                    ))}
                 </div>
               </motion.div>
            ) : (
              <motion.div 
                key={selectedTopic.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                className="space-y-8 pb-20"
              >
                {/* Header for Topic */}
                <div className="bg-white p-10 rounded-[3.5rem] border border-stone-200 shadow-xl shadow-stone-100/50 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
                      <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest bg-orange-50 px-3 py-1.5 rounded-full border border-orange-100">Smart Study</span>
                    </div>
                    <h2 className="text-4xl font-black text-stone-900 leading-none">{selectedTopic.title}</h2>
                  </div>
                  <button className="px-6 py-3 bg-stone-900 text-white rounded-2xl font-bold flex items-center gap-3 hover:bg-stone-800 transition shadow-lg shadow-stone-200">
                    <Download size={20} />
                    PDF डाउनलोड
                  </button>
                </div>

                {loading ? (
                  <div className="bg-white p-24 rounded-[3.5rem] border border-stone-200 flex flex-col items-center justify-center space-y-6 text-center">
                    <div className="w-16 h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin shadow-2xl shadow-orange-100" />
                    <div>
                        <p className="text-xl font-black text-stone-900">अध्ययन सामग्री तैयार हो रही है...</p>
                        <p className="text-stone-400 font-medium mt-1 italic">Gemini आपके लिए नोट्स संकलित कर रहा है</p>
                    </div>
                  </div>
                ) : error ? (
                  <div className="bg-red-50 p-12 rounded-[3.5rem] border border-red-100 text-center space-y-6">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center text-red-500 mx-auto">
                        <AlertCircle size={40} />
                    </div>
                    <div className="space-y-2">
                        <p className="text-xl font-bold text-red-900">{error}</p>
                        <p className="text-red-600/70 text-sm font-medium">हो सकता है सर्वर में कुछ समस्या हो, कृपया फिर से कोशिश करें।</p>
                    </div>
                    <button 
                      onClick={() => fetchMaterial(selectedTopic)}
                      className="px-8 py-3 bg-red-600 text-white rounded-2xl font-black hover:bg-red-700 transition shadow-xl shadow-red-200"
                    >
                      पुनः प्रयास करें
                    </button>
                  </div>
                ) : studyMaterial && (
                  <>
                    {/* Notes Section */}
                    <div className="bg-white p-12 rounded-[3.5rem] border border-stone-200 shadow-xl shadow-stone-100/50 prose prose-stone max-w-none">
                      <div className="flex items-center gap-3 mb-10 border-b border-stone-100 pb-6">
                        <div className="w-10 h-10 bg-stone-900 rounded-xl flex items-center justify-center text-white">
                           <BookOpen size={20} />
                        </div>
                        <h3 className="m-0 text-xl font-black tracking-tight">प्रमुख तथ्य और नोट्स</h3>
                      </div>
                      <div className="markdown-body text-stone-700 leading-relaxed font-medium">
                        <ReactMarkdown>{studyMaterial.notes}</ReactMarkdown>
                      </div>
                    </div>

                    {/* Quiz Section */}
                    <div className="bg-stone-900 text-white p-12 rounded-[3.5rem] shadow-2xl shadow-stone-200 overflow-hidden relative">
                      <div className="absolute -top-10 -right-10 opacity-5 pointer-events-none">
                        <ListChecks size={300} />
                      </div>
                      
                      <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-12">
                          <div className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-orange-900/50">
                             <CheckCircle2 size={24} />
                          </div>
                          <div>
                            <h3 className="text-2xl font-black italic uppercase tracking-wider leading-none">अभ्यास प्रश्न (MCQs)</h3>
                            <p className="text-stone-400 text-xs font-bold uppercase tracking-tighter mt-1">Check your knowledge</p>
                          </div>
                        </div>

                        <div className="space-y-16">
                          {studyMaterial.questions.map((q, idx) => (
                            <div key={q.id} className="space-y-6">
                              <p className="text-xl font-black leading-tight text-stone-100">
                                <span className="text-orange-500 mr-3 text-2xl">0{idx + 1}.</span>
                                {q.text}
                              </p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {q.options.map((option, optIdx) => (
                                  <button
                                    key={optIdx}
                                    onClick={() => handleAnswer(q.id, optIdx)}
                                    disabled={showResults}
                                    className={cn(
                                      "p-5 rounded-3xl text-left font-bold transition-all border-2 group",
                                      userAnswers[q.id] === optIdx 
                                        ? "bg-orange-600/30 border-orange-500 text-orange-200 shadow-xl shadow-orange-900/40" 
                                        : "bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10 text-stone-400",
                                      showResults && optIdx === q.correctAnswer && "border-green-500 bg-green-500/20 text-green-200",
                                      showResults && userAnswers[q.id] === optIdx && optIdx !== q.correctAnswer && "border-red-500 bg-red-500/20 text-red-200"
                                    )}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span>{option}</span>
                                      {showResults && optIdx === q.correctAnswer && <CheckCircle2 size={20} className="text-green-500" />}
                                    </div>
                                  </button>
                                ))}
                              </div>
                              {showResults && (
                                <motion.div 
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="p-6 bg-white/5 rounded-3xl border border-white/10 text-stone-400"
                                >
                                  <div className="flex items-start gap-3">
                                      <Layout size={18} className="text-orange-500 mt-1 flex-shrink-0" />
                                      <div>
                                          <p className="font-black text-orange-400 text-sm uppercase mb-1">सही उत्तर और व्याख्या:</p>
                                          <p className="text-sm font-medium leading-relaxed">{q.explanation}</p>
                                      </div>
                                  </div>
                                </motion.div>
                              )}
                            </div>
                          ))}
                        </div>

                        {!showResults ? (
                          <div className="mt-20 pt-10 border-t border-white/10">
                            <button 
                                onClick={() => setShowResults(true)}
                                disabled={Object.keys(userAnswers).length < studyMaterial.questions.length}
                                className="w-full py-6 bg-white hover:bg-stone-100 disabled:bg-stone-800 disabled:opacity-20 text-stone-900 rounded-[2rem] font-black text-xl transition-all shadow-2xl flex items-center justify-center gap-4 group"
                            >
                                <ListChecks size={28} className="group-hover:rotate-12 transition-transform" />
                                परिणाम देखें (View Results)
                            </button>
                          </div>
                        ) : (
                          <div className="mt-20 flex flex-col md:flex-row gap-6">
                            <div className="flex-1 p-8 bg-gradient-to-br from-orange-600 to-orange-700 rounded-[2.5rem] shadow-2xl shadow-orange-900/50 flex items-center justify-between">
                                <div>
                                    <p className="text-orange-100 font-bold uppercase text-[10px] tracking-widest mb-1">Final Score</p>
                                    <h4 className="text-5xl font-black text-white">{calculateScore()} <span className="text-2xl text-orange-200">/ {studyMaterial.questions.length}</span></h4>
                                </div>
                                <div className="p-4 bg-white/20 rounded-2xl">
                                    <GraduationCap size={44} />
                                </div>
                            </div>
                            <button 
                              onClick={() => fetchMaterial(selectedTopic)}
                              className="px-10 py-8 bg-white/5 border border-white/10 rounded-[2.5rem] font-black text-xl hover:bg-white/10 transition flex items-center justify-center gap-4"
                            >
                              <RefreshCw size={24} className="text-orange-500" />
                              अभ्यास फिर से करें
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>

      <footer className="bg-white border-t border-stone-200 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4">
           <div className="flex flex-col md:flex-row items-center justify-between gap-8 opacity-40">
                <div className="flex items-center gap-3">
                    <GraduationCap size={24} />
                    <span className="font-black">STUDY ASSISTANT</span>
                </div>
                <p className="text-xs font-bold uppercase tracking-widest">© 2026 Rajasthan Lab Assistant Exam Preparation • All Rights Reserved</p>
                <div className="flex items-center gap-6">
                    <span className="w-1.5 h-1.5 bg-orange-600 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-orange-600 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-orange-600 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
           </div>
        </div>
      </footer>

      {/* Global CSS for markdown fixes */}
      <style>{`
        .markdown-body { font-family: inherit; }
        .markdown-body h1 { font-size: 2.25rem; font-weight: 900; margin-bottom: 2rem; color: #1c1917; line-height: 1.1; letter-spacing: -0.05em; }
        .markdown-body h2 { font-size: 1.75rem; font-weight: 800; margin-top: 3rem; margin-bottom: 1.25rem; color: #44403c; letter-spacing: -0.02em; }
        .markdown-body h3 { font-size: 1.25rem; font-weight: 800; margin-top: 2rem; }
        .markdown-body p { margin-bottom: 1.5rem; font-size: 1.15rem; color: #57534e; line-height: 1.8; }
        .markdown-body ul, .markdown-body ol { margin-bottom: 2rem; padding-left: 2rem; }
        .markdown-body li { margin-bottom: 1rem; color: #57534e; padding-left: 0.5rem; font-size: 1.1rem; }
        .markdown-body li::marker { color: #f97316; font-weight: 900; }
        .markdown-body strong { color: #1c1917; font-weight: 900; }
        .markdown-body blockquote { border-left: 8px solid #f97316; background: #fff7ed; padding: 2rem 2.5rem; margin: 2.5rem 0; font-style: italic; border-radius: 0 2rem 2rem 0; font-size: 1.2rem; box-shadow: inset 0 1px 4px rgba(0,0,0,0.02); }
        .markdown-body table { width: 100%; border-collapse: separate; border-spacing: 0; margin: 2rem 0; overflow: hidden; border-radius: 1.5rem; border: 1px solid #e7e5e4; }
        .markdown-body th { background: #fdfdfd; padding: 1rem; font-weight: 900; text-align: left; border-bottom: 2px solid #f97316; }
        .markdown-body td { padding: 1rem; border-bottom: 1px solid #f5f5f4; }
        
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e7e5e4; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #d6d3d1; }
      `}</style>
    </div>
  );
}
