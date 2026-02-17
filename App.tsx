import React, { useState, useEffect } from 'react';
import {
  ViewState,
  UserPreferences,
  Summary,
  Note,
  RoutineTask,
  UserStats,
  Flashcard,
  Folder,
  UserRole
} from './types';
import { StorageService } from './services/storageService';
import { auth, isFirebaseConfigured } from './firebaseConfig';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { initializeSecureKeys } from './services/secureKeyManager';
import { ThemeProvider } from './contexts/ThemeContext';
import Sidebar from './components/Sidebar';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Summarizer from './pages/Summarizer';
import Notes from './pages/Notes';
import Routine from './pages/Routine';
import Focus from './pages/Focus';
import QuizPage from './pages/Quiz';
import NoteFeed from './pages/NoteFeed';
import NotesStore from './pages/NotesStore';
import Classrooms from './pages/Classrooms';
import ClassroomDetail from './pages/ClassroomDetail';
import StudentClassrooms from './pages/StudentClassrooms';
import StudentClassroomView from './pages/StudentClassroomView';
import Auth from './pages/Auth';
import RoleSelection from './pages/RoleSelection';
import TeacherDashboard from './pages/TeacherDashboard';
import Folders from './pages/Folders';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>("landing");
  const [user, setUser] = useState<UserPreferences | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [focusTask, setFocusTask] = useState<RoutineTask | undefined>(undefined);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedClassroomId, setSelectedClassroomId] = useState<string | undefined>(undefined);
  const [activeFolderId, setActiveFolderId] = useState<string | null | undefined>(undefined);

  const deriveName = (email?: string | null) => {
    if (!email) return "User";
    return email.split("@")[0];
  };

  useEffect(() => {
    initializeSecureKeys();

    if (!auth || !isFirebaseConfigured()) {
      const guestUser = StorageService.getGuestSession();
      if (guestUser) {
        setUser(guestUser);
        loadUserData();
        setView("dashboard");
      }
      setLoadingAuth(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        let profile = await StorageService.getUserProfile(firebaseUser.uid);
        if (!profile) {
          const avatarUrl = firebaseUser.photoURL ||
            `https://api.dicebear.com/7.x/notionists/svg?seed=${firebaseUser.displayName || firebaseUser.email}`;

          profile = {
            id: firebaseUser.uid,
            isGuest: false,
            name: firebaseUser.displayName || deriveName(firebaseUser.email),
            email: firebaseUser.email || undefined,
            avatarUrl: avatarUrl,
            freeTimeHours: 2,
            energyPeak: "morning",
            goal: "Productivity",
            distractionLevel: "medium",
          };
          await StorageService.saveUserProfile(profile);
        }

        if (!profile.role) {
          setUser(profile);
          setView("roleSelection");
        } else {
          StorageService.setSession(profile);
          setUser(profile);
          loadUserData();
          setView("dashboard");
        }
      } else {
        const guestUser = StorageService.getGuestSession();
        if (guestUser) {
          setUser(guestUser);
          loadUserData();
          setView("dashboard");
        } else {
          setUser(null);
          setView("landing");
        }
      }
      setLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  const loadUserData = async () => {
    try {
      await StorageService.checkLoginStreak();
      const [n, s, st, f] = await Promise.all([
        StorageService.getNotes(),
        StorageService.getSummaries(),
        StorageService.getStats(),
        StorageService.getFolders()
      ]);
      setNotes(n);
      setSummaries(s);
      setStats(st);
      setFolders(f);
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const handleGuestAccess = () => {
    const guestUser = StorageService.createGuestUser();
    guestUser.role = 'student'; // Default role for guests
    StorageService.saveUserProfile(guestUser);
    StorageService.setSession(guestUser);
    setUser(guestUser);
    loadUserData();
    setView("dashboard");
  };

  const handleRoleSelected = async (role: "student" | "teacher") => {
    if (!user) return;
    const updatedUser = { ...user, role };
    await StorageService.saveUserProfile(updatedUser);
    StorageService.setSession(updatedUser);
    setUser(updatedUser);
    setView("dashboard");
  };

  const handleLogout = async () => {
    if (user?.isGuest) {
      localStorage.removeItem("procastify_session");
      setUser(null);
      setView("landing");
    } else {
      await signOut(auth);
    }
  };

  const handleStartFocus = (task?: RoutineTask) => {
    setFocusTask(task);
    setView("focus");
  };

  const handleFocusExit = (minutesSpent: number) => {
    if (minutesSpent > 0) {
      StorageService.logStudyTime(minutesSpent);
      StorageService.getStats().then(setStats);
    }
    setView("routine");
  };

  const handleNavigate = (newView: ViewState, id?: string | null) => {
    if (newView === "notes") {
      setActiveFolderId(id);
    } else if (newView === "classroomDetail" || newView === "studentClassroomView") {
      setSelectedClassroomId(id || undefined);
    } else {
      setActiveFolderId(undefined);
    }
    setView(newView);
  };

  const handleAddToNote = async (noteId: string | null, summary: Summary, flashcards: Flashcard[]) => {
    if (!user) return;
    const timestamp = Date.now();
    const newBlocks: any[] = [
      { id: `${timestamp}-h1`, type: "h1", content: `Summary: ${new Date().toLocaleDateString()}` },
      { id: `${timestamp}-text`, type: "text", content: summary.summaryText.replace(/\n/g, "<br />") }
    ];

    if (flashcards.length > 0) {
      newBlocks.push({ id: `${timestamp}-fc-h2`, type: "h2", content: "Key Concepts" });
      flashcards.forEach((fc, i) => {
        newBlocks.push({ id: `${timestamp}-fc-${i}-q`, type: "h3", content: fc.front });
        newBlocks.push({ id: `${timestamp}-fc-${i}-a`, type: "text", content: fc.back });
      });
    }

    let noteToSave: Note;
    if (noteId === null) {
      noteToSave = {
        id: timestamp.toString(),
        userId: user.id,
        title: `Summary: ${new Date().toLocaleDateString()}`,
        document: { blocks: newBlocks },
        tags: [],
        folder: "Summaries",
        folderId: null,
        lastModified: timestamp,
        createdAt: timestamp,
      };
      setNotes(prev => [noteToSave, ...prev]);
      await StorageService.updateStats(s => ({ ...s, notesCreated: (s.notesCreated || 0) + 1 }));
      StorageService.getStats().then(setStats);
    } else {
      const existing = notes.find(n => n.id === noteId);
      if (!existing) return;
      noteToSave = {
        ...existing,
        document: { blocks: [...(existing.document?.blocks || []), { id: `${timestamp}-sep`, type: "text", content: "<br/>---<br/>" }, ...newBlocks] },
        lastModified: timestamp,
      };
      setNotes(prev => prev.map(n => n.id === noteId ? noteToSave : n));
    }
    await StorageService.saveNote(noteToSave);
  };

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-[#1e1f22] flex items-center justify-center text-white">
        <Loader2 className="animate-spin mr-3 text-[#5865F2]" size={32} />
        <span className="text-xl font-medium">Procastify AI is warming up...</span>
      </div>
    );
  }

  if (view === "auth") {
    return <Auth onLoginSuccess={() => setView("dashboard")} onGuestAccess={handleGuestAccess} onBack={() => setView("landing")} />;
  }

  if (view === "roleSelection") {
    return <RoleSelection onRoleSelected={handleRoleSelected} />;
  }

  if (!user || view === "landing") {
    return <Landing onLogin={() => setView("auth")} onGuestAccess={handleGuestAccess} />;
  }

  if (view === "focus") return <Focus initialTask={focusTask} onExit={handleFocusExit} />;

  return (
    <ThemeProvider>
      <div className="flex min-h-screen bg-[#1e1f22]">
        <Sidebar
          currentView={view === "folders" ? "notes" : view}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          userRole={user.role}
          user={user}
        />
        <main className={`flex-1 ${sidebarCollapsed ? "ml-20" : "ml-64"} overflow-y-auto max-h-screen relative transition-all duration-300 ease-in-out`}>
          {user.isGuest && (
            <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-1.5 text-xs text-amber-200 flex justify-between items-center sticky top-0 z-50 backdrop-blur-md">
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                Guest Mode: Data is limited to this browser.
              </span>
              <button onClick={() => setView("auth")} className="hover:text-white underline font-bold">Sign up to sync</button>
            </div>
          )}

          {view === "dashboard" && stats && (
            user.role === "teacher"
              ? <TeacherDashboard user={user} onNavigate={handleNavigate} />
              : <Dashboard user={user} summaries={summaries} notes={notes} stats={stats} onNoteClick={(id) => handleNavigate("notes", id)} onNavigate={handleNavigate} />
          )}

          {view === "summarizer" && <Summarizer onSave={async (s) => {
            const sWithUser = { ...s, userId: user.id };
            setSummaries(prev => [sWithUser, ...prev]);
            await StorageService.saveSummaries([sWithUser, ...summaries]);
          }} notes={notes} onAddToNote={handleAddToNote} />}

          {view === "notes" && (
            <Notes
              notes={notes}
              setNotes={(newNotes) => {
                const n = typeof newNotes === 'function' ? newNotes(notes) : newNotes;
                setNotes(n);
                StorageService.saveNotes(n);
              }}
              onDeleteNote={async (id) => {
                await StorageService.deleteNote(id);
                setNotes(prev => prev.filter(n => n.id !== id));
              }}
              user={user}
              onNavigate={handleNavigate}
              activeFolderId={activeFolderId}
              folders={folders}
            />
          )}

          {view === "folders" && <Folders folders={folders} setFolders={setFolders} notes={notes} user={user} onNavigate={handleNavigate} />}
          {view === "routine" && <Routine user={user} setUser={async (u) => { await StorageService.saveUserProfile(u); setUser(u); }} notes={notes} setNotes={(n) => { setNotes(n); StorageService.saveNotes(n); }} onStartTask={handleStartFocus} />}
          {view === "quiz" && <QuizPage notes={notes} user={user} stats={stats} setStats={setStats} />}
          {view === "feed" && <NoteFeed notes={notes} user={user} onClose={() => setView("dashboard")} />}
          {view === "store" && <NotesStore user={user} onImportNote={(n) => { setNotes(prev => [n, ...prev]); StorageService.saveNote(n); setView("notes"); }} onNavigate={handleNavigate} />}
          {view === "classrooms" && <Classrooms user={user} onNavigate={handleNavigate} />}
          {view === "classroomDetail" && selectedClassroomId && <ClassroomDetail user={user} classroomId={selectedClassroomId} onNavigate={handleNavigate} />}
          {view === "studentClassrooms" && <StudentClassrooms user={user} onNavigate={handleNavigate} />}
          {view === "studentClassroomView" && selectedClassroomId && <StudentClassroomView user={user} classroomId={selectedClassroomId} onNavigate={handleNavigate} />}
        </main>
      </div>
    </ThemeProvider>
  );
};

export default App;
