import { useState, useEffect, useMemo, useRef } from 'react';
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
  AlertCircle,
  Bell,
  X,
  Volume2,
  Plus,
  MessageSquare,
  Send,
  Sparkles,
  Camera,
  Image as ImageIcon,
  FileText,
  Book,
  Pen,
  Pencil,
  Ruler
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { TOPICS, MODEL_PAPERS } from './constants';
import { Topic, StudyMaterial, Question, Reminder, ModelPaper } from './types';
import { generateStudyMaterial, generateModelPaper, chatWithAI } from './services/geminiService';
import { cn } from './lib/utils';

export default function App() {
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [selectedPaper, setSelectedPaper] = useState<ModelPaper | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [studyMaterial, setStudyMaterial] = useState<StudyMaterial | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [showResults, setShowResults] = useState(false);

  // Reminders state
  const [reminders, setReminders] = useState<Reminder[]>(() => {
    const saved = localStorage.getItem('study_reminders');
    return saved ? JSON.parse(saved) : [];
  });
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [activeNotification, setActiveNotification] = useState<Reminder | null>(null);
  const [reminderMinutes, setReminderMinutes] = useState(30);

  // Chat state
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, chatLoading]);

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

  // Check reminders
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setReminders(prev => {
        let hasChanges = false;
        const updated = prev.map(r => {
          if (!r.triggered && r.time <= now) {
            setActiveNotification(r);
            hasChanges = true;
            return { ...r, triggered: true };
          }
          return r;
        });
        if (hasChanges) {
          localStorage.setItem('study_reminders', JSON.stringify(updated));
          return updated;
        }
        return prev;
      });
    }, 5000); // Check every 5s for performance
    return () => clearInterval(interval);
  }, []);

  const addReminder = (topic?: Topic) => {
    const newReminder: Reminder = {
      id: Math.random().toString(36).substr(2, 9),
      topicId: topic?.id,
      topicTitle: topic?.title || 'General Study Session',
      time: Date.now() + reminderMinutes * 60 * 1000,
      message: topic ? `महत्वपूर्ण: ${topic.title} को पढ़ने का समय हो गया है!` : 'पढ़ाई का समय! अपनी किताबों पर ध्यान दें।',
      triggered: false
    };
    const updated = [newReminder, ...reminders].slice(0, 50); // Limit to 50
    setReminders(updated);
    localStorage.setItem('study_reminders', JSON.stringify(updated));
    setShowReminderModal(false);
  };

  const removeReminder = (id: string) => {
    const updated = reminders.filter(r => r.id !== id);
    setReminders(updated);
    localStorage.setItem('study_reminders', JSON.stringify(updated));
  };

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
    setSelectedPaper(null);
    fetchMaterial(topic);
  };

  const handleSelectPaper = async (paper: ModelPaper) => {
    setSelectedPaper(paper);
    setSelectedTopic(null);
    setLoading(true);
    setError(null);
    setStudyMaterial(null);
    setUserAnswers({});
    setShowResults(false);
    try {
      const material = await generateModelPaper(paper.title, paper.id);
      setStudyMaterial(material);
    } catch (err) {
      setError('मॉडल पेपर प्राप्त करने में विफल।');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (questionId: string, answerIndex: number) => {
    if (showResults) return;
    setUserAnswers(prev => ({ ...prev, [questionId]: answerIndex }));
  };

  const handleSendMessage = async (customMessage?: string) => {
    const finalInput = customMessage || chatInput;
    if (!finalInput.trim() && !selectedImage) return;

    const userMessage = finalInput.trim() || (selectedImage ? "कृपया इस चित्र का विश्लेषण करें।" : "");
    setChatMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setChatInput('');
    const currentImage = selectedImage;
    setSelectedImage(null);
    setChatLoading(true);

    try {
      const history = chatMessages.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
      }));
      
      const cleanImageBase64 = currentImage?.split(',')[1];
      const response = await chatWithAI(userMessage, history, cleanImageBase64);
      setChatMessages(prev => [...prev, { role: 'model', text: response }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'model', text: "माफी चाहता हूँ, मैं अभी उत्तर नहीं दे पा रहा हूँ।" }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const calculateScore = () => {
    if (!studyMaterial) return 0;
    return studyMaterial.questions.reduce((acc, q) => {
      return acc + (userAnswers[q.id] === q.correctAnswer ? 1 : 0);
    }, 0);
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] font-sans text-stone-900 selection:bg-orange-100 selection:text-orange-900 overflow-x-hidden">
      {/* Colorful 3D Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-indigo-200/30 rounded-full blur-[120px]"
        />
        <motion.div 
          animate={{ 
            scale: [1.2, 1, 1.2],
            x: [0, -40, 0],
            y: [0, 60, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-[10%] -right-[10%] w-[60%] h-[60%] bg-orange-200/30 rounded-full blur-[120px]"
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.5, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40%] h-[40%] bg-pink-200/10 rounded-full blur-[100px]"
        />

        {/* Floating Icons */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={`book-${i}`}
            initial={{ 
              x: Math.random() * 100 + "%", 
              y: Math.random() * 100 + "%",
              rotate: Math.random() * 360,
              opacity: 0
            }}
            animate={{ 
              x: [null, (Math.random() - 0.5) * 200 + "px"],
              y: [null, (Math.random() - 0.5) * 200 + "px"],
              rotate: [null, Math.random() * 360],
              opacity: [0, 0.15, 0],
              scale: [0.8, 1.2, 0.8]
            }}
            transition={{ 
              duration: 15 + Math.random() * 10, 
              repeat: Infinity, 
              ease: "easeInOut",
              delay: i * 2
            }}
            className="absolute text-orange-600/20"
          >
            <Book size={40 + Math.random() * 40} />
          </motion.div>
        ))}

        {[...Array(6)].map((_, i) => (
          <motion.div
            key={`pen-${i}`}
            initial={{ 
              x: Math.random() * 100 + "%", 
              y: Math.random() * 100 + "%",
              rotate: Math.random() * 360,
              opacity: 0
            }}
            animate={{ 
              x: [null, (Math.random() - 0.5) * 300 + "px"],
              y: [null, (Math.random() - 0.5) * 300 + "px"],
              rotate: [null, Math.random() * 720],
              opacity: [0, 0.1, 0],
              scale: [0.5, 1, 0.5]
            }}
            transition={{ 
              duration: 12 + Math.random() * 8, 
              repeat: Infinity, 
              ease: "easeInOut",
              delay: i * 2.5
            }}
            className="absolute text-indigo-600/15"
          >
            <Pen size={30 + Math.random() * 30} />
          </motion.div>
        ))}

        {[...Array(4)].map((_, i) => (
          <motion.div
            key={`pencil-${i}`}
            initial={{ 
              x: Math.random() * 100 + "%", 
              y: Math.random() * 100 + "%",
              rotate: Math.random() * 360,
              opacity: 0
            }}
            animate={{ 
              x: [null, (Math.random() - 0.5) * 400 + "px"],
              y: [null, (Math.random() - 0.5) * 400 + "px"],
              rotate: [null, -Math.random() * 360],
              opacity: [0, 0.1, 0],
              scale: [0.7, 1.1, 0.7]
            }}
            transition={{ 
              duration: 20 + Math.random() * 5, 
              repeat: Infinity, 
              ease: "easeInOut",
              delay: i * 3
            }}
            className="absolute text-pink-600/10"
          >
            <Pencil size={25 + Math.random() * 25} />
          </motion.div>
        ))}
      </div>

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-stone-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-200">
              <GraduationCap size={28} />
            </div>
            <div>
              <div className="flex items-center gap-4">
                <motion.h1 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  whileHover={{ scale: 1.05 }}
                  className="font-display font-black text-2xl leading-tight tracking-tighter bg-gradient-to-r from-indigo-600 via-orange-600 to-pink-600 bg-clip-text text-transparent hover:drop-shadow-[0_0_15px_rgba(249,115,22,0.3)] transition-all cursor-default"
                >
                  LAB ASSISTANT
                </motion.h1>
                <div className="flex flex-col gap-1.5">
                  <a 
                    href="https://instagram.com/_rahul18x" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-tr from-[#FFB400] via-[#FF0054] to-[#9E00FF] hover:scale-105 transition-all text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg hover:shadow-[#FF0054]/20 group whitespace-nowrap"
                  >
                    <svg className="w-3 h-3 fill-current group-hover:rotate-12 transition-transform" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.266.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                    Insta _rahul18x
                  </a>
                </div>
              </div>
              <p className="text-[10px] text-stone-500 font-bold tracking-widest uppercase">Smart Revision Portal</p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <button 
              onClick={() => setShowReminderModal(true)}
              className="relative p-3 bg-stone-50 hover:bg-stone-100 rounded-2xl transition-colors border border-stone-100 text-stone-500 hover:text-orange-600"
            >
              <Bell size={20} />
              {reminders.filter(r => !r.triggered).length > 0 && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-orange-600 border-2 border-white rounded-full" />
              )}
            </button>

            <div className="flex flex-col items-end group">
              <motion.span 
                animate={{ opacity: [1, 0.5, 1], scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-[10px] font-black text-orange-600 uppercase tracking-tighter"
              >
                Exam Countdown
              </motion.span>
              <div className="flex items-center gap-2 text-stone-900 bg-stone-100/50 px-4 py-1.5 rounded-full border border-stone-200 group-hover:bg-orange-50 group-hover:border-orange-200 transition-all">
                <Clock size={16} className="text-stone-400 group-hover:text-orange-500" />
                <span className="text-sm font-black tabular-nums">
                  {timeLeft.days}D : {timeLeft.hours}H : {timeLeft.mins}M
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <motion.main 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-12 gap-10 relative z-10"
      >
        {/* Sidebar / Topic List */}
        <motion.aside 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="lg:col-span-4 space-y-6"
        >
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

          <motion.button 
            whileHover={{ scale: 1.02, y: -5 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowChat(true)}
            className="w-full p-8 bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-700 rounded-[2.5rem] text-white shadow-2xl shadow-indigo-200 relative overflow-hidden group text-left border-b-8 border-indigo-900/20 active:border-b-0 transition-all"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
              <Sparkles size={120} />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white/20 rounded-xl">
                  <MessageSquare size={20} />
                </div>
                <h4 className="text-2xl font-black">AI Assistant</h4>
              </div>
              <p className="text-indigo-100 text-sm font-medium leading-relaxed">
                अपने किसी भी सवाल का जवाब पाएं। यहाँ पूछें! (Chat with AI)
              </p>
            </div>
          </motion.button>
        </motion.aside>

        {/* Content Area */}
        <motion.section 
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="lg:col-span-8"
        >
          <AnimatePresence mode="wait">
            {!selectedTopic && !selectedPaper ? (
               <div className="space-y-10">
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  className="bg-white p-12 rounded-[3.5rem] border border-stone-200 flex flex-col items-center justify-center text-center space-y-8"
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

                {/* Model Papers Section */}
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between px-4">
                    <h3 className="text-2xl font-black flex items-center gap-3">
                      <Layout className="text-orange-600" />
                      मॉडल पेपर्स (Previous Papers)
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {MODEL_PAPERS.map((paper) => (
                      <button
                        key={paper.id}
                        onClick={() => handleSelectPaper(paper)}
                        className="p-8 bg-white border border-stone-200 rounded-[2.5rem] text-left hover:border-orange-500 hover:shadow-2xl hover:shadow-orange-100 transition-all group"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <span className="px-3 py-1 bg-stone-100 text-stone-500 rounded-lg text-[10px] font-black uppercase tracking-widest">{paper.year}</span>
                          <ChevronRight className="text-stone-300 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" size={20} />
                        </div>
                        <h4 className="text-xl font-black mb-2 text-stone-900 group-hover:text-orange-600 transition-colors">{paper.title}</h4>
                        <p className="text-stone-400 text-sm font-medium leading-relaxed">{paper.description}</p>
                      </button>
                    ))}
                  </div>
                </motion.div>
               </div>
            ) : (
              <motion.div 
                key={selectedTopic?.id || selectedPaper?.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                className="space-y-8 pb-20"
              >
                {/* Header for Topic/Paper */}
                <div className="bg-white p-10 rounded-[3.5rem] border border-stone-200 shadow-xl shadow-stone-100/50 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
                      <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest bg-orange-50 px-3 py-1.5 rounded-full border border-orange-100">
                        {selectedPaper ? 'Previous Paper Analysis' : 'Smart Study'}
                      </span>
                    </div>
                    <h2 className="text-4xl font-black text-stone-900 leading-none">{selectedTopic?.title || selectedPaper?.title}</h2>
                  </div>
                  <div className="flex flex-wrap items-center justify-center md:justify-end gap-3">
                    <button 
                      onClick={() => {
                        setSelectedTopic(null);
                        setSelectedPaper(null);
                        setStudyMaterial(null);
                      }}
                      className="px-6 py-3 bg-stone-50 text-stone-500 rounded-2xl font-bold flex items-center gap-3 hover:bg-stone-100 transition"
                    >
                      वापस जाएं
                    </button>
                    <button className="px-6 py-3 bg-stone-900 text-white rounded-2xl font-bold flex items-center gap-3 hover:bg-stone-800 transition shadow-lg shadow-stone-200">
                      <Download size={20} />
                      PDF डाउनलोड
                    </button>
                    {!selectedPaper && (
                      <button 
                        onClick={() => setShowReminderModal(true)}
                        className="px-6 py-3 bg-orange-600 text-white rounded-2xl font-bold flex items-center gap-3 hover:bg-orange-700 transition shadow-lg shadow-orange-200"
                      >
                        <Bell size={20} />
                        रिमाइंडर
                      </button>
                    )}
                  </div>
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
        </motion.section>
      </motion.main>

      <motion.footer 
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-white/40 backdrop-blur-xl border-t border-stone-200 py-16 mt-20 relative z-10"
      >
        <div className="max-w-7xl mx-auto px-4">
           <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-3 grayscale opacity-30 hover:grayscale-0 hover:opacity-100 transition-all">
                    <GraduationCap size={24} />
                    <span className="font-display font-black tracking-tighter">LAB ASSISTANT</span>
                </div>
                <div className="text-center flex flex-col items-center gap-4">
                  <p className="text-xs font-bold uppercase tracking-widest opacity-60">© 2026 Rajasthan Lab Assistant Exam Preparation</p>
                  <motion.div 
                    whileHover={{ scale: 1.05, y: -5 }}
                    className="flex flex-col items-center gap-3 cursor-default"
                  >
                    <p className="text-2xl italic font-serif text-stone-900 tracking-tighter">
                      Created by <span className="text-orange-600 font-black">_rahul18x</span>
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <a 
                        href="https://instagram.com/_rahul18x" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-tr from-[#FFB400] via-[#FF0054] to-[#9E00FF] hover:scale-105 transition-all text-white rounded-full text-xs font-black uppercase tracking-widest shadow-lg hover:shadow-[#FF0054]/30 group"
                      >
                        <svg className="w-4 h-4 fill-current group-hover:rotate-12 transition-transform" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.266.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                        Insta _rahul18x
                      </a>
                    </div>
                  </motion.div>
                </div>
                <div className="flex items-center gap-6">
                    <span className="w-1.5 h-1.5 bg-orange-600 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-orange-600 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-orange-600 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
           </div>
        </div>
      </motion.footer>

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

        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 24px;
          width: 24px;
          border-radius: 50%;
          background: #ea580c;
          cursor: pointer;
          border: 4px solid white;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        }
      `}</style>

      {/* Reminder Notification */}
      <AnimatePresence>
        {activeNotification && (
          <motion.div
            initial={{ opacity: 0, x: 100, y: 100 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed bottom-10 right-10 z-[100] w-96"
          >
            <div className="bg-stone-900 text-white p-8 rounded-[2.5rem] shadow-2xl border border-white/10 relative overflow-hidden">
               <div className="absolute -top-6 -right-6 text-orange-600/10">
                  <Bell size={120} />
               </div>
               <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center">
                        <Volume2 size={24} className="animate-pulse" />
                    </div>
                    <button 
                      onClick={() => setActiveNotification(null)}
                      className="p-2 hover:bg-white/10 rounded-full transition"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  <h4 className="text-xl font-black mb-2">स्टडी रिमाइंडर! 🔔</h4>
                  <p className="text-stone-400 font-medium text-sm leading-relaxed mb-6">{activeNotification.message}</p>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        if (activeNotification.topicId) {
                          const topic = TOPICS.find(t => t.id === activeNotification.topicId);
                          if (topic) handleSelectTopic(topic);
                        }
                        setActiveNotification(null);
                      }}
                      className="flex-1 py-3 bg-orange-600 hover:bg-orange-700 rounded-xl font-bold text-sm transition"
                    >
                      अभी पढ़ें
                    </button>
                    <button 
                      onClick={() => setActiveNotification(null)}
                      className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold text-xs text-stone-500 transition"
                    >
                      बाद में
                    </button>
                  </div>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generic Reminder Modal */}
      <AnimatePresence>
        {showReminderModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowReminderModal(false)}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[3rem] shadow-2xl overflow-hidden overflow-y-auto max-h-[90vh]"
            >
              <div className="p-10">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-black flex items-center gap-3">
                    <Clock className="text-orange-600" />
                    स्टडी टाइमर सेट करें
                  </h3>
                  <button onClick={() => setShowReminderModal(false)} className="p-3 hover:bg-stone-50 rounded-2xl">
                    <X size={24} />
                  </button>
                </div>

                <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="space-y-8"
          >
                  <div className="bg-stone-50 p-8 rounded-[2rem] border border-stone-100">
                    <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-4">Set Duration (Minutes)</label>
                    <div className="flex items-center gap-6">
                      <input 
                        type="range" 
                        min="5" 
                        max="120" 
                        step="5"
                        value={reminderMinutes}
                        onChange={(e) => setReminderMinutes(parseInt(e.target.value))}
                        className="flex-1 h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
                      />
                      <span className="w-20 text-center font-black text-2xl text-stone-900 border-b-2 border-orange-200 pb-1">
                        {reminderMinutes}m
                      </span>
                    </div>
                    <div className="flex justify-between mt-4">
                      { [15, 30, 45, 60].map(m => (
                        <button 
                          key={m}
                          onClick={() => setReminderMinutes(m)}
                          className={cn(
                            "px-4 py-2 rounded-xl text-xs font-bold transition",
                            reminderMinutes === m ? "bg-orange-600 text-white" : "bg-white text-stone-400 border border-stone-100 hover:border-orange-200"
                          )}
                        >
                          {m}m
                        </button>
                      ))}
                    </div>
                  </div>

                  <button 
                    onClick={() => addReminder(selectedTopic || undefined)}
                    className="w-full py-5 bg-stone-900 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:bg-orange-600 transition-all shadow-xl shadow-stone-200"
                  >
                    <Plus size={24} />
                    {selectedTopic ? `${selectedTopic.title} के लिए रिमाइंडर जोड़ें` : 'सामान्य अध्ययन रिमाइंडर जोड़ें'}
                  </button>

                  <div className="pt-6 border-t border-stone-100">
                    <h4 className="text-stone-400 text-[10px] font-black uppercase tracking-widest mb-4">Active & Past Reminders</h4>
                    <div className="space-y-3">
                      {reminders.length === 0 ? (
                        <p className="text-center py-6 text-stone-300 font-medium italic text-sm">कोई रिमाइंडर सक्रिय नहीं है</p>
                      ) : (
                        reminders.map(r => (
                          <div key={r.id} className={cn(
                            "p-4 rounded-2xl border flex items-center justify-between",
                            r.triggered ? "bg-stone-50 border-stone-100 opacity-50" : "bg-white border-orange-100 shadow-sm"
                          )}>
                            <div className="flex items-center gap-3">
                              <Bell size={16} className={r.triggered ? "text-stone-300" : "text-orange-500"} />
                              <div>
                                <p className="text-sm font-bold text-stone-900">{r.topicTitle}</p>
                                <p className="text-[10px] text-stone-400 font-medium">
                                  {new Date(r.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            </div>
                            <button onClick={() => removeReminder(r.id)} className="p-2 hover:text-red-500 text-stone-300">
                              <X size={16} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AI Chat Modal */}
      <AnimatePresence>
        {showChat && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowChat(false)}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.9 }}
              className="relative w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col h-[80vh]"
            >
              <div className="p-8 border-b border-stone-100 flex items-center justify-between bg-stone-50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white">
                    <Sparkles size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black">AI Study Assistant</h3>
                    <p className="text-stone-400 text-[10px] font-black uppercase tracking-widest">Ask anything about Lab Assistant Exam</p>
                  </div>
                </div>
                <button onClick={() => setShowChat(false)} className="p-3 hover:bg-stone-200 rounded-2xl transition-colors">
                  <X size={24} />
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-white">
                {chatMessages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30">
                    <MessageSquare size={64} />
                    <p className="font-bold max-w-xs">नमस्ते! मैं आपका AI अध्ययन सहायक हूँ। आप मुझसे परीक्षा से संबंधित कुछ भी पूछ सकते हैं।</p>
                  </div>
                )}
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={cn(
                    "flex flex-col max-w-[85%]",
                    msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                  )}>
                    <div className={cn(
                      "p-5 rounded-[2rem]",
                      msg.role === 'user' 
                        ? "bg-indigo-600 text-white rounded-tr-none" 
                        : "bg-stone-50 text-stone-800 rounded-tl-none border border-stone-100"
                    )}>
                      <div className="markdown-body text-inherit font-medium text-sm">
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                      </div>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-stone-300 mt-2">
                      {msg.role === 'user' ? 'You' : 'Assistant'}
                    </span>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex items-center gap-2 text-stone-300 ml-2">
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-6 bg-stone-50 border-t border-stone-100 space-y-4">
                {/* Image Preview */}
                {selectedImage && (
                  <div className="relative inline-block">
                    <img 
                      src={selectedImage} 
                      alt="Selected" 
                      className="w-20 h-20 object-cover rounded-xl border-2 border-indigo-500 shadow-lg" 
                    />
                    <button 
                      onClick={() => setSelectedImage(null)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-md hover:bg-red-600 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2 pb-2">
                  <button 
                    onClick={() => handleSendMessage("कृपया मेरे लिए एक महत्वपूर्ण टॉपिक का मॉडल पेपर तैयार करें।")}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 rounded-full text-[10px] font-black uppercase tracking-widest text-stone-500 hover:border-indigo-500 hover:text-indigo-600 transition-all shadow-sm"
                  >
                    <FileText size={14} />
                    Generate Paper
                  </button>
                  <button 
                    onClick={() => handleSendMessage("आज के लिए 5 महत्वपूर्ण राजस्थान GK के सवाल बताएं।")}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 rounded-full text-[10px] font-black uppercase tracking-widest text-stone-500 hover:border-indigo-500 hover:text-indigo-600 transition-all shadow-sm"
                  >
                    <Sparkles size={14} />
                    GK Quiz
                  </button>
                  <button 
                    onClick={() => handleSendMessage("बायोलॉजी (Biology) के सबसे महत्वपूर्ण टॉपिक्स की लिस्ट बताएं।")}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 rounded-full text-[10px] font-black uppercase tracking-widest text-stone-500 hover:border-indigo-500 hover:text-indigo-600 transition-all shadow-sm"
                  >
                    <BookOpen size={14} />
                    Bio Tips
                  </button>
                </div>

                <div className="flex gap-4">
                  <input 
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-14 h-14 bg-white border border-stone-200 text-stone-400 hover:text-indigo-600 hover:border-indigo-500 rounded-2xl flex items-center justify-center transition-all shadow-sm"
                  >
                    <Camera size={24} />
                  </button>
                  <input 
                    type="text" 
                    placeholder="अपना सवाल यहाँ लिखें या फोटो अपलोड करें..."
                    className="flex-1 px-6 py-4 bg-white border border-stone-200 rounded-[1.5rem] outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium text-sm"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <button 
                    onClick={() => handleSendMessage()}
                    disabled={chatLoading || (!chatInput.trim() && !selectedImage)}
                    className="w-14 h-14 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100 transition-all"
                  >
                    <Send size={24} />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
