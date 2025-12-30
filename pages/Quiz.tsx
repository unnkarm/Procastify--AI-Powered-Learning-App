import React, { useState } from 'react';
import { Note, Quiz, UserPreferences, UserStats } from '../types';
import { generateQuizFromNotes } from '../services/geminiService';
import { StorageService } from '../services/storageService';
import { Play, Trophy, CheckCircle, XCircle, Zap, Target, BookOpen, AlertCircle, RefreshCw } from 'lucide-react';

interface QuizProps {
  notes: Note[];
  user: UserPreferences;
  stats: UserStats;
  setStats: (stats: UserStats) => void;
}

const QuizPage: React.FC<QuizProps> = ({ notes, user, stats, setStats }) => {
  const [view, setView] = useState<'setup' | 'playing' | 'results'>('setup');
  const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [loading, setLoading] = useState(false);
  
  
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [attemptedQuestions, setAttemptedQuestions] = useState<Array<{
    question: string;
    options: string[];
    userAnswer: number;
    correctAnswer: number;
    explanation: string;
    isCorrect: boolean;
  }>>([]);

  const handleGenerate = async () => {
    if (selectedNoteIds.length === 0) return;
    setLoading(true);
    
    
    let aggregatedText = "";
    selectedNoteIds.forEach(id => {
        const note = notes.find(n => n.id === id);
        if (note) {
            
            aggregatedText += `Source: ${note.title}\n`;
            note.elements.forEach(el => {
                if (el.content) aggregatedText += el.content + "\n";
            });
        }
    });

    if (aggregatedText.length < 50) {
        alert("The selected notes don't contain enough text content to generate a quiz.");
        setLoading(false);
        return;
    }

    const questions = await generateQuizFromNotes(aggregatedText, difficulty);
    
    if (questions.length === 0) {
        alert("Failed to generate questions. Please try a different note or try again.");
        setLoading(false);
        return;
    }

    setQuiz({
        id: Date.now().toString(),
        userId: user.id,
        title: 'Generated Quiz',
        questions,
        highScore: 0
    });
    
    
    setCurrentQIndex(0);
    setScore(0);
    setStreak(0);
    setAttemptedQuestions([]);
    setSelectedOption(null);
    setShowAnalysis(false);
    
    setLoading(false);
    setView('playing');
  };

  const handleOptionSelect = (idx: number) => {
    if (selectedOption !== null || !quiz) return; 
    
    setSelectedOption(idx);
    setShowAnalysis(true);
    
    const currentQuestion = quiz.questions[currentQIndex];
    const isCorrect = idx === currentQuestion.correctIndex;
    
    
    const attemptedQuestion = {
      question: currentQuestion.text,
      options: currentQuestion.options,
      userAnswer: idx,
      correctAnswer: currentQuestion.correctIndex,
      explanation: currentQuestion.explanation,
      isCorrect
    };
    
    setAttemptedQuestions(prev => [...prev, attemptedQuestion]);

    if (isCorrect) {
        
        const bonus = Math.min(streak * 10, 50);
        setScore(s => s + 100 + bonus);
        setStreak(s => s + 1);
    } else {
        setStreak(0);
    }
  };

  const nextQuestion = () => {
    if (!quiz) return;
    setCurrentQIndex(c => c + 1);
    setSelectedOption(null);
    setShowAnalysis(false);
  };
  
  const finishQuiz = async () => {
      
      const currentHighScore = stats?.highScore || 0;
      const newHighScore = score > currentHighScore ? score : currentHighScore;
      
      const updatedStats = await StorageService.updateStats(prev => ({
          ...prev,
          quizzesTaken: prev.quizzesTaken + 1,
          highScore: newHighScore
      }));
      setStats(updatedStats);
      setView('results');
  };

  const resetToSetup = () => {
      setView('setup');
      setSelectedNoteIds([]);
      setDifficulty('medium');
  };


  if (view === 'setup') {
      return (
          <div className="p-8 max-w-4xl mx-auto h-full flex flex-col animate-in fade-in zoom-in-95 duration-500">
              <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-discord-accent rounded-xl flex items-center justify-center shadow-lg shadow-discord-accent/20">
                           <Target className="text-white" size={24} />
                      </div>
                      <div>
                          <h2 className="text-3xl font-bold text-white">Quiz Arena</h2>
                          <p className="text-discord-textMuted text-sm">Challenge yourself and beat your high score.</p>
                      </div>
                  </div>
                  <div className="flex items-center gap-3 bg-discord-panel px-4 py-2 rounded-xl border border-white/5">
                      <Trophy className="text-yellow-400" size={20} />
                      <div>
                          <p className="text-xs text-discord-textMuted font-bold uppercase">High Score</p>
                          <p className="text-xl font-bold text-white leading-none">{stats?.highScore || 0}</p>
                      </div>
                  </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 min-h-0">
                  
                  <div className="lg:col-span-2 flex flex-col min-h-0">
                      <h3 className="text-sm font-bold text-discord-textMuted uppercase mb-4 flex items-center gap-2">
                          <BookOpen size={16} /> Select Sources ({selectedNoteIds.length})
                      </h3>
                      <div className="flex-1 overflow-y-auto pr-2 space-y-3 pb-4">
                          {notes.map(note => (
                              <div 
                                key={note.id}
                                onClick={() => setSelectedNoteIds(prev => prev.includes(note.id) ? prev.filter(id => id !== note.id) : [...prev, note.id])}
                                className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between group
                                    ${selectedNoteIds.includes(note.id) 
                                        ? 'bg-discord-accent/10 border-discord-accent text-white shadow-md' 
                                        : 'bg-discord-panel border-white/5 text-discord-textMuted hover:bg-discord-hover hover:text-white'}`}
                              >
                                  <div className="flex items-center gap-4">
                                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors
                                          ${selectedNoteIds.includes(note.id) ? 'bg-discord-accent border-discord-accent' : 'border-white/20 group-hover:border-white/40'}`}>
                                          {selectedNoteIds.includes(note.id) && <CheckCircle size={14} className="text-white" />}
                                      </div>
                                      <div>
                                          <span className="font-bold block">{note.title}</span>
                                          <span className="text-xs text-discord-textMuted opacity-70">{new Date(note.lastModified).toLocaleDateString()} • {note.folder}</span>
                                      </div>
                                  </div>
                              </div>
                          ))}
                          {notes.length === 0 && (
                              <div className="text-center py-10 border-2 border-dashed border-white/5 rounded-xl">
                                  <p className="text-discord-textMuted">No notes found. Create some notes first!</p>
                              </div>
                          )}
                      </div>
                  </div>

               
                  <div className="flex flex-col gap-6">
                      <div>
                          <h3 className="text-sm font-bold text-discord-textMuted uppercase mb-4 flex items-center gap-2">
                              <Target size={16} /> Difficulty
                          </h3>
                          <div className="flex flex-col gap-2">
                              {(['easy', 'medium', 'hard'] as const).map(d => (
                                  <button
                                    key={d}
                                    onClick={() => setDifficulty(d)}
                                    className={`p-3 rounded-xl border text-left capitalize transition-all font-medium
                                        ${difficulty === d 
                                            ? 'bg-discord-accent text-white border-discord-accent shadow-md' 
                                            : 'bg-discord-panel border-white/5 text-discord-textMuted hover:bg-discord-hover'}`}
                                  >
                                      {d}
                                  </button>
                              ))}
                          </div>
                      </div>

                      <div className="mt-auto">
                          <button 
                            onClick={handleGenerate}
                            disabled={loading || selectedNoteIds.length === 0}
                            className="w-full bg-discord-green hover:bg-green-600 text-white py-4 rounded-xl font-bold text-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg hover:shadow-green-500/20"
                          >
                              {loading ? (
                                  <><RefreshCw className="animate-spin" /> Generating...</>
                              ) : (
                                  <>Start Quiz <Play size={20} fill="currentColor" /></>
                              )}
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      );
  }

 
  if (view === 'playing' && quiz) {
      const question = quiz.questions[currentQIndex];
      const isCorrect = selectedOption === question.correctIndex;
      const isAnswered = selectedOption !== null;

      return (
          <div className="h-full flex flex-col max-w-4xl mx-auto p-8">
           
              <div className="flex justify-between items-center mb-10">
                  <div className="flex items-center gap-4">
                      <div className="flex flex-col">
                          <span className="text-xs font-bold text-discord-textMuted uppercase tracking-wider">Question</span>
                          <span className="text-2xl font-bold text-white font-mono">{currentQIndex + 1}<span className="text-discord-textMuted text-lg">/{quiz.questions.length}</span></span>
                      </div>
                  </div>

                  
                  <div className="flex items-center gap-6">
                      <div className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-300 ${streak > 1 ? 'bg-orange-500/10 border-orange-500 text-orange-400' : 'bg-transparent border-transparent text-discord-textMuted'}`}>
                          <Zap size={18} className={streak > 1 ? 'fill-current' : ''} />
                          <span className="font-bold">{streak} Streak</span>
                      </div>
                      <div className="px-5 py-2 bg-discord-panel rounded-xl border border-white/10 text-white font-mono font-bold text-xl min-w-[100px] text-center">
                          {score}
                      </div>
                  </div>
              </div>

             
              <div className="flex-1 flex flex-col justify-center animate-in fade-in slide-in-from-bottom-4 duration-500 key={currentQIndex}">
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-10 leading-snug">{question.text}</h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                      {question.options.map((opt, idx) => {
                          
                          let styleClass = "bg-discord-panel border-white/10 text-discord-text hover:bg-discord-hover hover:border-white/20";
                          if (isAnswered) {
                              if (idx === question.correctIndex) styleClass = "bg-green-500/20 border-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.3)]";
                              else if (selectedOption === idx) styleClass = "bg-red-500/20 border-red-500 text-white opacity-80";
                              else styleClass = "bg-discord-panel border-white/5 text-discord-textMuted opacity-50";
                          }

                          return (
                            <button
                                key={idx}
                                onClick={() => handleOptionSelect(idx)}
                                disabled={isAnswered}
                                className={`p-6 rounded-2xl text-left font-medium text-lg border-2 transition-all relative ${styleClass} min-h-[100px] flex items-center`}
                            >
                                <span className="mr-4 w-8 h-8 rounded-full border border-current flex items-center justify-center text-sm font-bold opacity-50 shrink-0">
                                    {String.fromCharCode(65 + idx)}
                                </span>
                                {opt}
                                {isAnswered && idx === question.correctIndex && <CheckCircle className="absolute right-4 top-4 text-green-500" />}
                                {isAnswered && selectedOption === idx && idx !== question.correctIndex && <XCircle className="absolute right-4 top-4 text-red-500" />}
                            </button>
                          )
                      })}
                  </div>

                  
                  <div className={`transition-all duration-300 overflow-hidden ${showAnalysis ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0'}`}>
                      <div className={`p-6 rounded-xl border mb-6 flex items-start gap-4 ${isCorrect ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                           <div className={`p-2 rounded-full shrink-0 ${isCorrect ? 'bg-green-500 text-black' : 'bg-red-500 text-white'}`}>
                               {isCorrect ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                           </div>
                           <div>
                               <h4 className={`font-bold mb-1 ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                                   {isCorrect ? 'Correct!' : 'Incorrect'}
                               </h4>
                               <p className="text-discord-textMuted text-sm leading-relaxed">{question.explanation}</p>
                           </div>
                      </div>

                      
                      <div className="flex gap-4">
                          {currentQIndex < quiz.questions.length - 1 ? (
                              <button 
                                onClick={nextQuestion}
                                className="flex-1 bg-discord-accent hover:bg-discord-accentHover text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg flex items-center justify-center gap-2"
                              >
                                  Next Question <Play size={20} fill="currentColor" />
                              </button>
                          ) : null}
                          <button 
                            onClick={finishQuiz}
                            className="flex-1 bg-discord-panel hover:bg-discord-hover text-white py-4 rounded-xl font-bold text-lg transition-all border border-white/10 flex items-center justify-center gap-2"
                          >
                              Finish Quiz <Trophy size={20} />
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  
  if (view === 'results' && quiz) {
      const totalQs = attemptedQuestions.length;
      const correctCount = attemptedQuestions.filter(q => q.isCorrect).length;
      const percentage = totalQs > 0 ? Math.round((correctCount / totalQs) * 100) : 0;

      return (
          <div className="h-full flex flex-col items-center p-8 max-w-4xl mx-auto overflow-y-auto">
              <div className="text-center mb-12 animate-in slide-in-from-top-4 duration-700">
                  <div className="relative inline-block">
                       <Trophy size={100} className="text-yellow-400 mb-6 drop-shadow-[0_0_30px_rgba(250,204,21,0.4)]" />
                       <div className="absolute -top-2 -right-2 bg-discord-accent text-white font-bold px-3 py-1 rounded-full text-sm border border-white/20">
                           {percentage}%
                       </div>
                  </div>
                  <h1 className="text-4xl font-bold text-white mb-2">Quiz Completed!</h1>
                  <p className="text-xl text-discord-textMuted">You scored <span className="text-discord-accent font-bold">{score}</span> points</p>
                  {score > (stats?.highScore || 0) && score > 0 && (
                      <p className="text-green-400 font-bold mt-2 animate-bounce">New High Score!</p>
                  )}
              </div>
              
              <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                  <div className="bg-discord-panel p-6 rounded-2xl border border-white/5 text-center">
                      <p className="text-discord-textMuted text-xs font-bold uppercase mb-2">Correct Answers</p>
                      <p className="text-4xl font-bold text-green-400">{correctCount}<span className="text-lg text-discord-textMuted">/{totalQs}</span></p>
                  </div>
                  <div className="bg-discord-panel p-6 rounded-2xl border border-white/5 text-center">
                      <p className="text-discord-textMuted text-xs font-bold uppercase mb-2">Difficulty</p>
                      <p className="text-4xl font-bold text-white capitalize">{difficulty}</p>
                  </div>
                  <div className="bg-discord-panel p-6 rounded-2xl border border-white/5 text-center">
                      <p className="text-discord-textMuted text-xs font-bold uppercase mb-2">Sources</p>
                      <p className="text-4xl font-bold text-blue-400">{selectedNoteIds.length}</p>
                  </div>
              </div>

              
              <div className="w-full max-w-2xl space-y-4 mb-12">
                  <h3 className="text-white font-bold text-lg mb-4">Review</h3>
                  {attemptedQuestions.map((q, i) => (
                      <div key={i} className={`p-4 rounded-xl border flex gap-4 ${q.isCorrect ? 'bg-green-500/5 border-green-500/10' : 'bg-red-500/5 border-red-500/10'}`}>
                          <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center font-bold text-sm ${q.isCorrect ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                              {i+1}
                          </div>
                          <div className="flex-1">
                              <p className="text-white font-medium mb-2">{q.question}</p>
                              <div className="text-sm space-y-1">
                                  <div className={`${q.isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                                      <span className="font-medium">Your Answer:</span> {q.options[q.userAnswer]}
                                  </div>
                                  <div className="text-green-400">
                                      <span className="font-medium">Correct Answer:</span> {q.options[q.correctAnswer]}
                                  </div>
                                  <div className="text-discord-textMuted mt-2">
                                      <span className="font-medium">Explanation:</span> {q.explanation}
                                  </div>
                              </div>
                          </div>
                      </div>
                  ))}
              </div>

              <div className="flex gap-4 mb-8">
                  <button onClick={resetToSetup} className="px-8 py-3 bg-discord-panel hover:bg-discord-hover text-white rounded-xl font-bold transition-colors border border-white/10">
                      Back to Setup
                  </button>
                  <button onClick={() => setView('setup')} className="px-8 py-3 bg-discord-accent hover:bg-discord-accentHover text-white rounded-xl font-bold transition-colors shadow-lg">
                      Play Again
                  </button>
              </div>
          </div>
      );
  }

  return null;
};

export default QuizPage;