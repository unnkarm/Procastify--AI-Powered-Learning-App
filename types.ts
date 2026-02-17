export type ViewState =
  | "landing"
  | "onboarding"
  | "roleSelection"
  | "dashboard"
  | "summarizer"
  | "notes"
  | "routine"
  | "focus"
  | "quiz"
  | "feed"
  | "store"
  | "auth"
  | "classrooms"
  | "classroomDetail"
  | "studentClassrooms"
  | "studentClassroomView"
  | "folders";

export type UserRole = 'student' | 'teacher';

export interface UserPreferences {
  id: string;
  isGuest: boolean;
  name: string;
  role?: UserRole;
  freeTimeHours: number;
  energyPeak: 'morning' | 'afternoon' | 'night';
  goal: string;
  distractionLevel: 'low' | 'medium' | 'high';
  email?: string;
  avatarUrl?: string;
  classroomIds?: string[];
  teacherPreferences?: {
    notificationsEnabled: boolean;
    autoApproveInvitations: boolean;
  };
}

export interface UserStats {
  id: string;
  userId: string;
  totalTimeStudiedMinutes: number;
  notesCreated: number;
  quizzesTaken: number;
  loginStreak: number;
  lastLoginDate: string;
  dailyActivity: Record<string, number>;
  highScore: number;
}

export type NoteElementType =
  | "text"
  | "sticky"
  | "arrow"
  | "image"
  | "flashcard_deck"
  | "summary_card";

export interface NoteElement {
  id: string;
  type: NoteElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
  src?: string;
  color?: string;
  fontSize?: "small" | "medium" | "large";
  startId?: string;
  endId?: string;
  zIndex: number;
}

export type BlockType =
  | "text"
  | "h1"
  | "h2"
  | "h3"
  | "bullet"
  | "todo"
  | "quote"
  | "code"
  | "image"
  | "link";

export interface Block {
  id: string;
  type: BlockType;
  content: string;
  isChecked?: boolean;
  imageUrl?: string;
  linkUrl?: string;
  language?: string;
}

export interface NoteDocument {
  blocks: Block[];
}

export interface NoteCanvas {
  elements: NoteElement[];
  strokes?: any[];
}

export interface Folder {
  id: string;
  userId: string;
  name: string;
  color?: string;
  createdAt: number;
  updatedAt: number;
  noteCount?: number;
}

export interface Note {
  id: string;
  userId: string;
  ownerId?: string;
  title: string;
  document?: NoteDocument;
  canvas?: NoteCanvas;
  elements?: NoteElement[];
  tags: string[];
  folder: string;
  folderId?: string | null;
  lastModified: number;
  createdAt?: number | any;
  updatedAt?: number | any;
  isPublic?: boolean;
  publishedAt?: number | any;
  likes?: number;
  aiAnalysis?: {
    difficulty: "easy" | "medium" | "hard";
    estimatedMinutes: number;
    cognitiveLoad: "light" | "medium" | "heavy";
    summary: string;
  };
}

export interface QueueItem {
  id: string;
  userId: string;
  noteId: string;
  priority: "high" | "medium" | "low";
  deadline?: number;
  status: "pending" | "in_progress" | "completed";
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  status: "new" | "learning" | "mastered";
}

export interface Attachment {
  id: string;
  type: "image" | "audio" | "pdf" | "url";
  content: string;
  mimeType?: string;
  name?: string;
}

export interface CustomMode {
  id: string;
  userId: string;
  name: string;
  systemPrompt: string;
  createdAt: number;
}

export interface Summary {
  id: string;
  userId: string;
  originalSource: string;
  summaryText: string;
  type: "text" | "video" | "article" | "pdf" | "audio" | "mixed";
  mode: string;
  createdAt: number;
  flashcards?: Flashcard[];
  originalText?: string;
  attachments?: Attachment[];
}

export const isSummarySession = (summary: Summary) => summary.type === "text" || summary.type === "mixed";

export interface RoutineTask {
  id: string;
  userId: string;
  title: string;
  durationMinutes: number;
  type: "focus" | "break" | "buffer" | "procastify";
  completed: boolean;
  timeSlot?: string;
  noteId?: string;
  confidence?: "high" | "medium" | "low";
}

export type QuizModeType = "standard" | "swipe" | "fillBlanks" | "explain";

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty?: "easy" | "medium" | "hard";
  mode?: QuizModeType;
}

export interface Classroom {
  id: string;
  name: string;
  description?: string;
  teacherId: string;
  teacherName: string;
  studentIds: string[];
  virtualLinks: VirtualClassLink[];
  announcements: Announcement[];
  resources: ClassroomResource[];
  inviteCode: string;
  code?: string; // Alias for inviteCode for backward compatibility
  createdAt: number;
  updatedAt: number;
}

export interface VirtualClassLink {
  id: string;
  title: string;
  url: string;
  description?: string;
  scheduledDate?: number;
  createdAt: number;
  createdBy: string;
}

export interface Announcement {
  id: string;
  classroomId: string;
  teacherId: string;
  teacherName: string;
  title?: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export interface ClassroomResource {
  id: string;
  classroomId: string;
  resourceType: "note" | "quiz" | "file" | "link";
  resourceId: string;
  resourceTitle: string;
  resourceDescription?: string;
  url?: string;
  fileUrl?: string;
  sharedBy: string;
  sharedByName: string;
  sharedAt: number;
}

export interface Invitation {
  id: string;
  classroomId: string;
  classroomName: string;
  teacherId: string;
  teacherName: string;
  studentEmail: string;
  studentId?: string;
  status: "pending" | "accepted" | "declined";
  createdAt: number;
  respondedAt?: number;
}

export interface TeacherStats {
  id: string;
  userId: string;
  totalClassrooms: number;
  totalStudents: number;
  totalAnnouncements: number;
  totalResourcesShared: number;
  pendingInvitations?: number;
  lastActivityDate: string;
}

export type ActivityType =
  | "student_joined"
  | "student_accepted_invitation"
  | "announcement_posted"
  | "resource_shared"
  | "resource_copied";

export interface Activity {
  id: string;
  classroomId: string;
  classroomName: string;
  type: ActivityType;
  actorId: string;
  actorName: string;
  targetId?: string;
  targetName?: string;
  timestamp: number;
  metadata?: any;
}

// Multiplayer Quiz Types
export type QuizMode = "singleplayer" | "multiplayer";

export interface MultiplayerQuizSession {
  id: string;
  hostId: string;
  hostName: string;
  inviteCode: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  mode: QuizModeType;
  questions: Question[];
  participants: QuizParticipant[];
  status: "waiting" | "in_progress" | "completed";
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  currentQuestionIndex?: number;
}

export interface QuizParticipant {
  id: string;
  userId: string;
  userName: string;
  score: number;
  answers: QuizAnswer[];
  joinedAt: number;
  isReady: boolean;
}

export interface QuizAnswer {
  questionIndex: number;
  selectedOption: number;
  isCorrect: boolean;
  timeSpent: number;
  timestamp: number;
}

export interface QuizLeaderboard {
  sessionId: string;
  rankings: QuizRanking[];
  generatedAt: number;
}

export interface QuizRanking {
  userId: string;
  userName: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  averageTime: number;
  rank: number;
}

// Study Resources Community Types
export type ExamType = "JEE" | "NEET" | "GATE" | "ICSE" | "CBSE" | "University" | "Other";
export type Level = "10" | "12" | "UG" | "PG" | "Other";
export type PaperType = "PYQ" | "Mock" | "Sample" | "Practice";
export type FileType = "pdf" | "image";

export interface StudyResource {
  id: string;
  userId: string;
  ownerId: string;
  title: string;
  examType: ExamType;
  level: Level;
  subject: string;
  year: number;
  board: string;
  paperType: PaperType;
  description?: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  fileType: FileType;
  createdAt: number | any;
  updatedAt: number | any;
  viewCount?: number;
  downloadCount?: number;
}

export interface ResourceMetadata {
  title: string;
  examType: ExamType;
  level: Level;
  subject: string;
  year: number;
  board: string;
  paperType: PaperType;
  description?: string;
}

export interface ResourceFilters {
  examType?: ExamType[];
  level?: Level[];
  subject?: string[];
  year?: number[];
  board?: string[];
  paperType?: PaperType[];
}

export interface PaginatedResources {
  resources: StudyResource[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// Quiz Types
export interface Quiz {
  id: string;
  userId: string;
  noteId?: string;
  title: string;
  questions: Question[];
  difficulty: "easy" | "medium" | "hard";
  createdAt: number;
  completedAt?: number;
  score?: number;
  highScore?: number;
}

export interface QuizReport {
  quizId: string;
  userId: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeSpent: number;
  difficulty: "easy" | "medium" | "hard";
  completedAt: number;
  answers: any[];
  overallAccuracy?: number;
  difficultyProgression?: ("easy" | "medium" | "hard")[];
  strengths?: string[];
  weaknesses?: string[];
  suggestions?: string[];
}

export interface QuizAIAnalysis {
  overallAccuracy: number;
  difficultyProgression: ("easy" | "medium" | "hard")[];
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}

export interface AttemptedFillQuestion {
  id: string;
  question: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  overallCorrect?: boolean;
  blanks?: any[];
  explanation?: string;
}

export interface ExplainQuestion {
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface AttemptedExplainQuestion {
  question: string;
  options: string[];
  userAnswer: number;
  correctAnswer: number;
  answerCorrect: boolean;
  userExplanation: string;
  reasoningScore: number;
  reasoningFeedback: string;
  explanation: string;
  totalScore: number;
}
