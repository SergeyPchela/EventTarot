/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, RefreshCw, Info, MessageSquare, Moon, Star, Users, Mic2, Settings, Wallet, LayoutGrid, X, Languages } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import { TAROT_CARDS, TarotCard } from './cards';
import { UI_TRANSLATIONS, Language } from './translations';

// Initialize Gemini safely
const getApiKey = () => {
  try {
    // Check for process.env (AI Studio environment)
    if (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY) {
      return process.env.GEMINI_API_KEY;
    }
  } catch (e) {
    // Ignore process errors
  }
  // Check for import.meta.env (Vite/Vercel environment)
  return import.meta.env.VITE_GEMINI_API_KEY || "";
};

const apiKey = getApiKey();
const genAI = new GoogleGenAI({ apiKey });

interface SpreadItem {
  card: TarotCard;
  isReversed: boolean;
}

export default function App() {
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('tarot-lang');
    return (saved as Language) || 'ru';
  });

  const t = UI_TRANSLATIONS[lang];

  const categories = [
    { id: 'guests', label: t.categories.guests, icon: Users, color: 'text-pink-300' },
    { id: 'show', label: t.categories.show, icon: Mic2, color: 'text-purple-300' },
    { id: 'tech', label: t.categories.tech, icon: Settings, color: 'text-blue-300' },
    { id: 'finance', label: t.categories.finance, icon: Wallet, color: 'text-emerald-300' },
  ];

  const [spread, setSpread] = useState<Record<string, SpreadItem | null>>({
    guests: null, show: null, tech: null, finance: null
  });

  useEffect(() => {
    localStorage.setItem('tarot-lang', lang);
  }, [lang]);

  const toggleLang = () => {
    setLang(prev => prev === 'en' ? 'ru' : 'en');
  };
  const [isShuffling, setIsShuffling] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [showGallery, setShowGallery] = useState(false);

  const performSpread = () => {
    setIsShuffling(true);
    setAiAnalysis('');
    
    setTimeout(() => {
      const newSpread: Record<string, SpreadItem> = {};
      const availableCards = [...TAROT_CARDS];
      
      categories.forEach(cat => {
        const randomIndex = Math.floor(Math.random() * availableCards.length);
        const card = availableCards.splice(randomIndex, 1)[0];
        const isReversed = Math.random() > 0.7; // 30% chance for reversed card
        newSpread[cat.id] = { card, isReversed };
      });
      
      setSpread(newSpread);
      setIsShuffling(false);
    }, 1500);
  };

  const getAiAnalysis = async () => {
    if (!spread.guests) return;
    setIsLoadingAi(true);
    try {
      const model = "gemini-3-flash-preview";
      const displayTitle = eventTitle.trim() || (lang === 'ru' ? "Таинственное событие" : "A Mysterious Event");
      const displayDate = eventDate.trim() || (lang === 'ru' ? "время скрыто завесой будущего" : "time hidden by the veil of the future");
      const displayLocation = eventLocation.trim() || (lang === 'ru' ? "место, где пересекаются судьбы" : "a place where destinies cross");

      const prompt = lang === 'ru' 
        ? `Ты - эксперт "Ивент Таро". Сделай магический расклад для мероприятия "${displayTitle}".
        Дата: ${displayDate}
        Место: ${displayLocation}
        
        Выпали следующие карты (обрати внимание на перевернутые значения):
        1. Атмосфера гостей: ${spread.guests?.card.nameRu} ${spread.guests?.isReversed ? '(ПЕРЕВЕРНУТАЯ)' : '(ПРЯМАЯ)'}
        2. Шоу на сцене: ${spread.show?.card.nameRu} ${spread.show?.isReversed ? '(ПЕРЕВЕРНУТАЯ)' : '(ПРЯМАЯ)'}
        3. Техника: ${spread.tech?.card.nameRu} ${spread.tech?.isReversed ? '(ПЕРЕВЕРНУТАЯ)' : '(ПРЯМАЯ)'}
        4. Финансы: ${spread.finance?.card.nameRu} ${spread.finance?.isReversed ? '(ПЕРЕВЕРНУТАЯ)' : '(ПРЯМАЯ)'}
        
        Дай краткий, профессиональный и мистический прогноз по каждому пункту. Если детали события (название, дата или место) не указаны или скрыты, интерпретируй это как "Слепой расклад", фокусируясь на общих энергиях и потенциале. Если карта перевернута, интерпретируй её значение как препятствие или скрытую проблему. Используй эмодзи.`
        : `You are an "Event Tarot" expert. Provide a magical spread for the event "${displayTitle}".
        Date: ${displayDate}
        Location: ${displayLocation}
        
        The following cards were drawn (note reversed meanings):
        1. Guest Atmosphere: ${spread.guests?.card.name} ${spread.guests?.isReversed ? '(REVERSED)' : '(UPRIGHT)'}
        2. Stage Show: ${spread.show?.card.name} ${spread.show?.isReversed ? '(REVERSED)' : '(UPRIGHT)'}
        3. Tech: ${spread.tech?.card.name} ${spread.tech?.isReversed ? '(REVERSED)' : '(UPRIGHT)'}
        4. Finance: ${spread.finance?.card.name} ${spread.finance?.isReversed ? '(REVERSED)' : '(UPRIGHT)'}
        
        Provide a brief, professional, and mystical forecast for each point. If the event details (title, date, or location) are not specified or hidden, interpret this as a "Blind Reading," focusing on general energies and potential. If a card is reversed, interpret it as an obstacle or hidden problem. Use emojis.`;

      const response = await genAI.models.generateContent({ model, contents: prompt });
      setAiAnalysis(response.text || (lang === 'ru' ? "Звезды сегодня туманны..." : "The stars are hazy today..."));
    } catch (error) {
      console.error("Gemini API Error:", error);
      setAiAnalysis(t.aiError);
    } finally {
      setIsLoadingAi(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-8 md:py-12">
      {/* Language Switcher */}
      <div className="fixed top-6 right-6 z-50">
        <button 
          onClick={toggleLang}
          className="glass p-3 rounded-2xl border-white/10 hover:bg-white/10 transition-all flex items-center gap-2 text-amber-100"
        >
          <Languages className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-widest">{lang === 'en' ? 'RU' : 'EN'}</span>
        </button>
      </div>

      {/* Header */}
      <header className="text-center mb-10 max-w-2xl">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 glass rounded-2xl border-amber-500/30">
            <Moon className="text-amber-200 w-8 h-8" />
          </div>
          <h1 className="text-4xl md:text-6xl font-serif italic text-amber-100">{t.title}</h1>
        </motion.div>
        <p className="text-stone-300 text-sm md:text-base font-light leading-relaxed glass p-4 rounded-2xl border-white/5">
          {t.description}
        </p>
      </header>

      <main className="w-full max-w-6xl space-y-12">
        {/* Input Section */}
        <div className="max-w-xl mx-auto space-y-4">
          <input
            type="text"
            value={eventTitle}
            onChange={(e) => setEventTitle(e.target.value)}
            placeholder={t.placeholder}
            className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-amber-100 focus:outline-none focus:border-amber-500/50 transition-all text-center text-lg"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              placeholder={t.datePlaceholder}
              className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-amber-100 focus:outline-none focus:border-amber-500/50 transition-all text-center"
            />
            <input
              type="text"
              value={eventLocation}
              onChange={(e) => setEventLocation(e.target.value)}
              placeholder={t.locationPlaceholder}
              className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-amber-100 focus:outline-none focus:border-amber-500/50 transition-all text-center"
            />
          </div>
          <button
            onClick={performSpread}
            disabled={isShuffling}
            className="w-full py-4 glass bg-amber-900/10 hover:bg-amber-900/30 border-amber-500/30 text-amber-100 rounded-2xl transition-all flex items-center justify-center gap-3 text-xl font-serif italic"
          >
            <RefreshCw className={`w-6 h-6 ${isShuffling ? 'animate-spin' : ''}`} />
            {isShuffling ? t.shuffling : t.shuffle}
          </button>
        </div>

        {/* Spread Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat) => (
            <div key={cat.id} className="flex flex-col items-center space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <cat.icon className={`w-4 h-4 ${cat.color}`} />
                <span className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">{cat.label}</span>
              </div>
              
              <div className="relative w-full aspect-[2/3.5] max-w-[280px] perspective-1000">
                <AnimatePresence mode="wait">
                  {!spread[cat.id] ? (
                    <motion.div
                      key="back"
                      initial={{ rotateY: 180, opacity: 0 }}
                      animate={{ rotateY: 0, opacity: 1 }}
                      className="w-full h-full glass rounded-2xl border-amber-900/40 flex items-center justify-center animate-float shadow-2xl"
                    >
                      <Star className="w-12 h-12 text-amber-200/20" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="front"
                      initial={{ rotateY: -180, opacity: 0 }}
                      animate={{ rotateY: 0, opacity: 1 }}
                      className="w-full h-full glass rounded-2xl overflow-hidden card-shadow border-amber-200/20 flex flex-col"
                    >
                      <div className={`relative flex-1 overflow-hidden transition-transform duration-700 ${spread[cat.id]?.isReversed ? 'rotate-180' : ''}`}>
                        {spread[cat.id]?.card?.image && (
                          <img 
                            src={spread[cat.id]?.card.image} 
                            alt={lang === 'ru' ? spread[cat.id]?.card.nameRu : spread[cat.id]?.card.name}
                            className="w-full h-full object-contain p-1"
                            referrerPolicy="no-referrer"
                          />
                        )}
                      </div>
                      <div className="p-4 text-center bg-black/60 backdrop-blur-md border-t border-white/10">
                        <h3 className="text-xl font-serif italic text-amber-100 leading-tight">
                          {(lang === 'ru' ? spread[cat.id]?.card?.nameRu : spread[cat.id]?.card?.name) || (lang === 'ru' ? 'Карта' : 'Card')}
                        </h3>
                        {spread[cat.id]?.isReversed && (
                          <span className="block text-[10px] text-amber-500 uppercase tracking-widest mt-1 font-bold">{t.reversed}</span>
                        )}
                        <p className="text-[11px] text-stone-300 mt-2 leading-relaxed font-light">
                          {spread[cat.id]?.isReversed 
                            ? (lang === 'ru' ? spread[cat.id]?.card?.reversedMeaningRu : spread[cat.id]?.card?.reversedMeaning) 
                            : (lang === 'ru' ? spread[cat.id]?.card?.meaningRu : spread[cat.id]?.card?.meaning)}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>

        {/* AI Analysis Section */}
        {spread.guests && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
            <button
              onClick={getAiAnalysis}
              disabled={isLoadingAi}
              className="w-full py-4 mb-6 glass bg-white/5 hover:bg-white/10 border-white/10 text-stone-200 rounded-2xl flex items-center justify-center gap-3 transition-all"
            >
              {isLoadingAi ? <RefreshCw className="animate-spin" /> : <MessageSquare className="w-5 h-5" />}
              {t.getAiAnalysis}
            </button>

            <div className="glass rounded-3xl p-8 border-white/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Sparkles className="w-24 h-24 text-amber-200" />
              </div>
              {aiAnalysis ? (
                <div className="markdown-body text-stone-300 leading-relaxed font-light text-lg">
                  <ReactMarkdown
                    components={{
                      p: ({ ...props }) => <p className="mb-4 last:mb-0" {...props} />,
                      strong: ({ ...props }) => <strong className="font-bold text-amber-100" {...props} />,
                      em: ({ ...props }) => <em className="italic text-stone-200" {...props} />,
                      ul: ({ ...props }) => <ul className="list-disc ml-6 mb-4 space-y-2" {...props} />,
                      ol: ({ ...props }) => <ol className="list-decimal ml-6 mb-4 space-y-2" {...props} />,
                      li: ({ ...props }) => <li className="pl-2" {...props} />,
                      h1: ({ ...props }) => <h1 className="text-2xl font-serif italic text-amber-100 mb-4" {...props} />,
                      h2: ({ ...props }) => <h2 className="text-xl font-serif italic text-amber-100 mb-3" {...props} />,
                      h3: ({ ...props }) => <h3 className="text-lg font-serif italic text-amber-100 mb-2" {...props} />,
                    }}
                  >
                    {aiAnalysis}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className="text-center py-12 text-stone-500 italic">
                  {t.aiPlaceholder}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </main>

      {/* Floating Debug Button - Visible only with ?debug=true */}
      {window.location.search.includes('debug=true') && (
        <button 
          onClick={() => setShowGallery(true)}
          className="fixed bottom-6 right-6 z-40 p-4 bg-amber-900/20 hover:bg-amber-900/40 border border-amber-500/30 text-amber-200 rounded-full transition-all shadow-lg backdrop-blur-md flex items-center gap-2 group"
          title={t.gallery}
        >
          <LayoutGrid className="w-6 h-6" />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 whitespace-nowrap text-xs uppercase tracking-widest">
            {t.gallery}
          </span>
        </button>
      )}

      <footer className="mt-20 py-8 text-stone-600 text-[10px] uppercase tracking-[0.4em] text-center">
        <p>{t.footer}</p>
      </footer>

      {/* Gallery Modal */}
      <AnimatePresence>
        {showGallery && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#0a0502] overflow-y-auto p-8"
          >
            <div className="max-w-7xl mx-auto">
              <div className="flex justify-between items-center mb-8 sticky top-0 bg-[#0a0502] py-4 z-20">
                <h2 className="text-3xl font-serif italic text-amber-100">{t.galleryTitle}</h2>
                <button 
                  onClick={() => setShowGallery(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors text-amber-100"
                >
                  <X className="w-8 h-8" />
                </button>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {TAROT_CARDS.map((card, index) => (
                  <div key={index} className="flex flex-col items-center bg-white/5 p-2 rounded-lg border border-white/5">
                    <div className="aspect-[2/3.5] w-full relative mb-2">
                      <img 
                        src={card.image} 
                        alt={`Index ${index}`} 
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <span className="text-amber-500 font-bold text-lg">Index: {index}</span>
                    <span className="text-amber-100 text-xs font-medium mt-1">{lang === 'ru' ? card.nameRu : card.name}</span>
                    <span className="text-[10px] text-stone-500 break-all text-center mt-1">
                      {card.image.split('/d/')[1]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
