import { db } from '../firebaseConfig';
import {
  doc,
  deleteDoc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  writeBatch,
  serverTimestamp,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import {
  Note,
  Folder,
  Classroom,
  Invitation,
  Announcement,
  ClassroomResource,
  Activity
} from '../types';
import { apiRateLimiter } from './rateLimiter';
import { sanitizeContent } from './validation';
import logger from './securityLogger';

// Helper to handle Firestore timestamps vs Date/Numbers
const createTimestampFromDate = (dateVal: any) => {
  if (typeof dateVal === "number") return new Date(dateVal);
  if (dateVal instanceof Date) return dateVal;
  return serverTimestamp();
};

const mapFirestoreDataToNote = (data: any): Note => {
  return {
    ...data,
    createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : data.createdAt,
    updatedAt: data.updatedAt?.toMillis ? data.updatedAt.toMillis() : data.updatedAt,
    publishedAt: data.publishedAt?.toMillis ? data.publishedAt.toMillis() : data.publishedAt,
  } as Note;
};

// Recursively remove undefined values from an object/array
const sanitizePayload = (obj: any): any => {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) {
    return obj.map((v) => sanitizePayload(v)).filter((v) => v !== undefined);
  }
  if (typeof obj === "object") {
    const newObj: any = {};
    Object.keys(obj).forEach((key) => {
      const val = sanitizePayload(obj[key]);
      if (val !== undefined) {
        newObj[key] = val;
      }
    });
    return newObj;
  }
  return obj;
};

export const FirebaseService = {
  // --- Generic ---
  deleteDocument: async (docRef: any) => {
    await deleteDoc(docRef);
  },

  // --- Notes ---
  saveNote: async (userId: string, note: Note) => {
    const ref = doc(db, "notes", note.id);
    const payload = {
      ...note,
      ownerId: userId,
      updatedAt: serverTimestamp(),
      isPublic: note.isPublic || false,
      publishedAt: note.isPublic ? (note.publishedAt || serverTimestamp()) : null,
      document: note.document || { blocks: [] },
      canvas: note.canvas || { elements: [], strokes: [] },
    };

    const sanitizedPayload = sanitizePayload(payload);
    if (sanitizedPayload.title) {
      sanitizedPayload.title = sanitizeContent(sanitizedPayload.title, 200);
    }

    await setDoc(ref, sanitizedPayload, { merge: true });
  },

  deleteNote: async (userId: string, noteId: string) => {
    const ref = doc(db, 'notes', noteId);
    await deleteDoc(ref);
  },

  saveNotesBatch: async (userId: string, notes: Note[]) => {
    if (apiRateLimiter.isLimited(userId)) {
      logger.logRateLimitViolation(userId, 'saveNotesBatch');
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    const batch = writeBatch(db);
    notes.forEach((note) => {
      const ref = doc(db, "notes", note.id);
      const payload = {
        ...note,
        ownerId: userId,
        updatedAt: serverTimestamp(),
        isPublic: note.isPublic || false,
      };
      batch.set(ref, sanitizePayload(payload), { merge: true });
    });
    await batch.commit();
  },

  // --- Public Store ---
  publishNote: async (userId: string, note: Note) => {
    const ref = doc(db, "notes", note.id);
    await setDoc(ref, {
      isPublic: true,
      publishedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });
  },

  unpublishNote: async (userId: string, noteId: string) => {
    const ref = doc(db, "notes", noteId);
    await setDoc(ref, {
      isPublic: false,
      publishedAt: null,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  },

  getPublicNotes: async (): Promise<Note[]> => {
    try {
      const q = query(
        collection(db, "notes"),
        where("isPublic", "==", true),
        orderBy("publishedAt", "desc")
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => mapFirestoreDataToNote(d.data()));
    } catch (e) {
      console.error("Error fetching public notes:", e);
      return [];
    }
  },

  // --- Folders ---
  saveFolder: async (userId: string, folder: Folder) => {
    const ref = doc(db, "folders", folder.id);
    await setDoc(ref, sanitizePayload({ ...folder, userId, updatedAt: serverTimestamp() }), { merge: true });
  },

  deleteFolder: async (folderId: string) => {
    const ref = doc(db, "folders", folderId);
    await deleteDoc(ref);
  },

  getFolders: async (userId: string): Promise<Folder[]> => {
    try {
      const q = query(collection(db, "folders"), where("userId", "==", userId));
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data() as Folder);
    } catch (e) {
      console.error("Error fetching folders:", e);
      return [];
    }
  },

  saveFoldersBatch: async (userId: string, folders: Folder[]) => {
    const batch = writeBatch(db);
    folders.forEach((folder) => {
      const ref = doc(db, "folders", folder.id);
      batch.set(ref, sanitizePayload({ ...folder, userId, updatedAt: serverTimestamp() }), { merge: true });
    });
    await batch.commit();
  },

  // --- Classrooms ---
  saveClassroom: async (classroom: Classroom) => {
    const ref = doc(db, "classrooms", classroom.id);
    await setDoc(ref, sanitizePayload({ ...classroom, updatedAt: serverTimestamp() }), { merge: true });
  },

  getClassroom: async (classroomId: string): Promise<Classroom | null> => {
    const ref = doc(db, "classrooms", classroomId);
    const snap = await getDoc(ref);
    return snap.exists() ? (snap.data() as Classroom) : null;
  },

  deleteClassroom: async (classroomId: string) => {
    const ref = doc(db, "classrooms", classroomId);
    await deleteDoc(ref);
  },

  getClassroomsByTeacher: async (teacherId: string): Promise<Classroom[]> => {
    const q = query(collection(db, "classrooms"), where("teacherId", "==", teacherId));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as Classroom);
  },

  getClassroomsByStudent: async (studentId: string): Promise<Classroom[]> => {
    const q = query(collection(db, "classrooms"), where("studentIds", "array-contains", studentId));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as Classroom);
  },

  // --- Invitations ---
  saveInvitation: async (invitation: Invitation) => {
    await setDoc(doc(db, "invitations", invitation.id), invitation);
  },

  updateInvitationStatus: async (invitationId: string, status: "accepted" | "declined", studentId?: string) => {
    const ref = doc(db, "invitations", invitationId);
    if (studentId) {
      await setDoc(ref, { status, studentId, respondedAt: Date.now() }, { merge: true });
    } else {
      await setDoc(ref, { status, respondedAt: Date.now() }, { merge: true });
    }
  },

  updateInvitation: async (invitationId: string, updates: Partial<Invitation>) => {
    const ref = doc(db, "invitations", invitationId);
    await setDoc(ref, sanitizePayload({ ...updates, respondedAt: Date.now() }), { merge: true });
  },

  getInvitationsByEmail: async (email: string): Promise<Invitation[]> => {
    const q = query(collection(db, "invitations"), where("email", "==", email));
    const snap = await getDocs(q);
    return snap.docs.map(doc => doc.data() as Invitation);
  },

  getInvitationsByClassroom: async (classroomId: string): Promise<Invitation[]> => {
    const q = query(collection(db, "invitations"), where("classroomId", "==", classroomId));
    const snap = await getDocs(q);
    return snap.docs.map(doc => doc.data() as Invitation);
  },

  // --- Announcements ---
  saveAnnouncement: async (announcement: Announcement) => {
    const ref = doc(db, "announcements", announcement.id);
    await setDoc(ref, sanitizePayload({ ...announcement, createdAt: serverTimestamp() }), { merge: true });
  },

  getAnnouncements: async (classroomId: string): Promise<Announcement[]> => {
    const q = query(collection(db, "announcements"), where("classroomId", "==", classroomId), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as Announcement);
  },

  deleteAnnouncement: async (classroomId: string, announcementId: string) => {
    const ref = doc(db, "announcements", announcementId);
    await deleteDoc(ref);
  },

  // --- Quiz Sessions ---
  saveQuizSession: async (session: any) => {
    const ref = doc(db, "quizSessions", session.id);
    await setDoc(ref, sanitizePayload({ ...session, updatedAt: serverTimestamp() }), { merge: true });
  },

  getQuizSession: async (sessionId: string): Promise<any | null> => {
    const ref = doc(db, "quizSessions", sessionId);
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data() : null;
  },

  updateQuizSession: async (sessionId: string, updates: any) => {
    const ref = doc(db, "quizSessions", sessionId);
    await setDoc(ref, sanitizePayload({ ...updates, updatedAt: serverTimestamp() }), { merge: true });
  },

  // --- Activity Logging ---
  logActivity: async (activity: Activity) => {
    const ref = doc(db, "activities", `${activity.classroomId}_${Date.now()}`);
    await setDoc(ref, sanitizePayload({ ...activity, timestamp: serverTimestamp() }));
  },

  getActivities: async (classroomId: string): Promise<Activity[]> => {
    const q = query(collection(db, "activities"), where("classroomId", "==", classroomId), orderBy("timestamp", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as Activity);
  },

  // --- Quiz Methods ---
  generateQuizCode: (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  },

  createQuizSession: async (session: any) => {
    const ref = doc(db, "quizSessions", session.id);
    await setDoc(ref, sanitizePayload({ ...session, createdAt: serverTimestamp() }));
  },

  getQuizSessionByCode: async (code: string): Promise<any | null> => {
    const q = query(collection(db, "quizSessions"), where("code", "==", code));
    const snap = await getDocs(q);
    return snap.empty ? null : snap.docs[0].data();
  },

  joinQuizSession: async (sessionId: string, participant: any) => {
    const session = await FirebaseService.getQuizSession(sessionId);
    if (!session) throw new Error("Session not found");

    const updatedParticipants = [...(session.participants || []), participant];
    await FirebaseService.updateQuizSession(sessionId, { participants: updatedParticipants });
  },

  submitQuizAnswer: async (sessionId: string, userId: string, answer: any) => {
    const session = await FirebaseService.getQuizSession(sessionId);
    if (!session) throw new Error("Session not found");

    const updatedParticipants = session.participants.map((p: any) => {
      if (p.userId === userId) {
        return { ...p, answers: [...(p.answers || []), answer] };
      }
      return p;
    });

    await FirebaseService.updateQuizSession(sessionId, { participants: updatedParticipants });
  },

  generateLeaderboard: async (sessionId: string): Promise<any> => {
    const session = await FirebaseService.getQuizSession(sessionId);
    if (!session) throw new Error("Session not found");

    const rankings = session.participants
      .map((p: any) => {
        const correctAnswers = p.answers.filter((a: any) => a.isCorrect).length;
        const totalTime = p.answers.reduce((sum: number, a: any) => sum + a.timeSpent, 0);
        const averageTime = p.answers.length > 0 ? totalTime / p.answers.length : 0;

        return {
          userId: p.userId,
          userName: p.userName,
          score: p.score,
          correctAnswers,
          totalQuestions: p.answers.length,
          averageTime,
          rank: 0,
        };
      })
      .sort((a: any, b: any) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.averageTime - b.averageTime;
      })
      .map((r: any, index: number) => ({ ...r, rank: index + 1 }));

    return {
      sessionId,
      rankings,
      generatedAt: Date.now(),
    };
  },

  // --- Resources ---
  getResources: async (classroomId: string): Promise<ClassroomResource[]> => {
    const q = query(collection(db, "resources"), where("classroomId", "==", classroomId));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as ClassroomResource);
  },

  saveResource: async (resource: ClassroomResource) => {
    const ref = doc(db, "resources", resource.id);
    await setDoc(ref, sanitizePayload({ ...resource, createdAt: serverTimestamp() }), { merge: true });
  },

  shareResource: async (classroomId: string, resource: ClassroomResource) => {
    // Sharing is essentially saving it to the classroom resources
    const ref = doc(db, "resources", resource.id);
    await setDoc(ref, sanitizePayload({ ...resource, classroomId, createdAt: serverTimestamp() }), { merge: true });
  },

  unshareResource: async (classroomId: string, resourceId: string) => {
    const ref = doc(db, "resources", resourceId);
    await deleteDoc(ref);
  }
};
