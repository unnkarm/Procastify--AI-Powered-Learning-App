import React, { useState, useEffect } from 'react';
import { UserPreferences, Classroom, ViewState } from '../types';
import { ClassroomService } from '../services/classroomService';
import { GraduationCap, Plus, Users, Copy, X, Loader2, ArrowRight, Trash2, Video } from 'lucide-react';
import VirtualClassLinks from '../components/VirtualClassLinks';
import { motion, AnimatePresence } from 'framer-motion';

interface ClassroomsProps {
  user: UserPreferences;
  onNavigate: (view: ViewState | "folders", classroomId?: string) => void;
}

const Classrooms: React.FC<ClassroomsProps> = ({ user, onNavigate }) => {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'links' | 'announcements' | 'resources'>('overview');

  // Create classroom form
  const [className, setClassName] = useState('');
  const [classDescription, setClassDescription] = useState('');
  const [creating, setCreating] = useState(false);

  // Join classroom form
  const [inviteCode, setInviteCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [creatingTest, setCreatingTest] = useState(false);

  useEffect(() => {
    loadClassrooms();
  }, [user]);

  const loadClassrooms = async () => {
    setLoading(true);
    try {
      if (!user.role || user.isGuest) {
        setClassrooms([]);
        setLoading(false);
        return;
      }

      let classroomsResult: Classroom[] = [];
      if (user.role === 'teacher') {
        classroomsResult = await ClassroomService.getTeacherClassrooms(user.id);
      } else if (user.role === 'student') {
        classroomsResult = await ClassroomService.getStudentClassrooms(user.id);
      }

      setClassrooms(classroomsResult);
    } catch (error: any) {
      console.error('Error loading classrooms:', error);
      setClassrooms([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClassroom = async () => {
    if (!className.trim()) return;
    if (user.isGuest) {
      alert('Guest users cannot create classrooms.');
      return;
    }

    setCreating(true);
    try {
      const newClassroom = await ClassroomService.createClassroom(
        user.id,
        user.name,
        className.trim(),
        classDescription.trim() || undefined
      );
      setClassrooms([...classrooms, newClassroom]);
      setShowCreateModal(false);
      setClassName('');
      setClassDescription('');
    } catch (error: any) {
      console.error('Error creating classroom:', error);
      alert(`Failed to create classroom: ${error.message || 'Unknown error'}`);
    } finally {
      setCreating(false);
    }
  };

  const handleJoinClassroom = async () => {
    if (!inviteCode.trim()) return;

    setJoining(true);
    setJoinError('');
    try {
      const classroom = await ClassroomService.joinClassroomByCode(inviteCode.trim().toUpperCase(), user.id);
      if (classroom) {
        await loadClassrooms();
        setShowJoinModal(false);
        setInviteCode('');
      } else {
        setJoinError('Invalid invite code. Please check and try again.');
      }
    } catch (error) {
      console.error('Error joining classroom:', error);
      setJoinError('Failed to join classroom. Please try again.');
    } finally {
      setJoining(false);
    }
  };

  const handleDeleteClassroom = async (classroomId: string) => {
    if (!confirm('Are you sure you want to delete this classroom? This action cannot be undone.')) return;

    try {
      await ClassroomService.deleteClassroom(classroomId);
      setClassrooms(classrooms.filter(c => c.id !== classroomId));
      if (selectedClassroom?.id === classroomId) {
        setSelectedClassroom(null);
      }
    } catch (error) {
      console.error('Error deleting classroom:', error);
    }
  };

  const createTestClassroom = async () => {
    if (user.role !== 'teacher' || user.isGuest) return;

    setCreatingTest(true);
    try {
      const testClassroom = await ClassroomService.createClassroom(
        user.id,
        user.name,
        'Math 101 Test',
        'A test classroom for feature verification.'
      );
      await loadClassrooms();
      alert(`Test classroom created! Invite Code: ${testClassroom.inviteCode}`);
    } catch (error) {
      console.error('Error creating test classroom:', error);
    } finally {
      setCreatingTest(false);
    }
  };

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1e1f22] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#5865F2]" size={48} />
      </div>
    );
  }

  if (user.isGuest) {
    return (
      <div className="min-h-screen bg-[#1e1f22] text-white p-6 flex items-center justify-center">
        <div className="text-center max-w-md bg-[#2b2d31] p-8 rounded-2xl border border-white/10 shadow-xl">
          <GraduationCap className="mx-auto text-[#5865F2] mb-6" size={64} />
          <h2 className="text-3xl font-bold mb-4 text-white">Cloud Account Required</h2>
          <p className="text-gray-400 mb-8 leading-relaxed">
            Classrooms is a cloud-powered feature. Please sign up or log in to collaborate with others.
          </p>
          <button
            onClick={() => onNavigate('dashboard')}
            className="w-full px-6 py-4 bg-[#5865F2] hover:bg-[#4752c4] rounded-xl font-bold transition-all transform hover:scale-105"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (selectedClassroom) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-h-screen bg-[#1e1f22] text-white p-6"
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSelectedClassroom(null)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
              <h1 className="text-3xl font-bold tracking-tight">{selectedClassroom.name}</h1>
            </div>
            {user.role === 'teacher' && selectedClassroom.teacherId === user.id && (
              <button
                onClick={() => handleDeleteClassroom(selectedClassroom.id)}
                className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-all border border-red-500/20 flex items-center gap-2"
              >
                <Trash2 size={18} />
                Delete
              </button>
            )}
          </div>

          <div className="flex gap-1 mb-8 bg-[#2b2d31] p-1 rounded-xl w-fit">
            {(['overview', 'links', 'announcements', 'resources'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2.5 rounded-lg font-medium transition-all ${activeTab === tab
                    ? 'bg-[#5865F2] text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                {selectedClassroom.description && (
                  <div className="bg-[#2b2d31] p-8 rounded-2xl border border-white/5 shadow-inner">
                    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">About this class</h2>
                    <p className="text-gray-300 text-lg leading-relaxed">{selectedClassroom.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-[#2b2d31] p-6 rounded-2xl border border-white/5">
                    <div className="flex items-center justify-between mb-4">
                      <Users className="text-[#5865F2]" size={32} />
                      <span className="text-gray-500 text-sm font-medium">Active Students</span>
                    </div>
                    <p className="text-4xl font-bold text-white">{selectedClassroom.studentIds.length}</p>
                  </div>

                  <div className="bg-[#2b2d31] p-6 rounded-2xl border border-white/5">
                    <div className="flex items-center justify-between mb-4">
                      <Video className="text-[#5865F2]" size={32} />
                      <span className="text-gray-500 text-sm font-medium">Virtual Content</span>
                    </div>
                    <p className="text-4xl font-bold text-white">{selectedClassroom.virtualLinks?.length || 0}</p>
                  </div>

                  <div className="bg-[#2b2d31] p-6 rounded-2xl border border-white/5">
                    <div className="flex items-center justify-between mb-4">
                      <GraduationCap className="text-[#5865F2]" size={32} />
                      <span className="text-gray-500 text-sm font-medium">Instructor</span>
                    </div>
                    <p className="text-xl font-bold text-white truncate">{selectedClassroom.teacherName}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'links' && (
              <motion.div
                key="links"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <VirtualClassLinks
                  classroom={selectedClassroom}
                  user={user}
                  onUpdate={async () => {
                    const updated = await ClassroomService.getClassroom(selectedClassroom.id);
                    if (updated) setSelectedClassroom(updated);
                  }}
                />
              </motion.div>
            )}

            {(activeTab === 'announcements' || activeTab === 'resources') && (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-[#2b2d31] p-12 rounded-2xl border border-white/5 text-center"
              >
                <div className="w-16 h-16 bg-[#5865F2]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Loader2 className="text-[#5865F2] opacity-50" size={32} />
                </div>
                <h3 className="text-xl font-bold mb-2">Coming Soon</h3>
                <p className="text-gray-400">We're working hard to bring this feature to your classroom!</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1e1f22] text-white p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-5xl font-extrabold text-white tracking-tight mb-3">Classrooms</h1>
            <p className="text-gray-400 text-lg">
              {user.role === 'teacher'
                ? 'Empower your teaching journey'
                : 'Connect with your learning community'}
            </p>
          </div>
          <div className="flex gap-4">
            {user.role === 'student' && (
              <button
                onClick={() => setShowJoinModal(true)}
                className="group relative px-8 py-4 bg-[#5865F2] hover:bg-[#4752c4] rounded-2xl font-bold transition-all shadow-xl shadow-[#5865F2]/20 overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <Users size={20} />
                  Join Classroom
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              </button>
            )}
            {user.role === 'teacher' && (
              <>
                <button
                  onClick={createTestClassroom}
                  disabled={creatingTest}
                  className="px-6 py-4 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 rounded-2xl font-bold transition-all disabled:opacity-50"
                >
                  {creatingTest ? '...' : '🧪 Test Class'}
                </button>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-8 py-4 bg-[#5865F2] hover:bg-[#4752c4] text-white rounded-2xl font-bold transition-all flex items-center gap-2 shadow-xl shadow-[#5865F2]/20"
                >
                  <Plus size={24} />
                  New Classroom
                </button>
              </>
            )}
          </div>
        </header>

        {classrooms.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-24 bg-[#2b2d31]/50 rounded-[2.5rem] border border-white/5"
          >
            <div className="w-24 h-24 bg-[#5865F2]/10 rounded-full flex items-center justify-center mx-auto mb-8">
              <GraduationCap className="text-[#5865F2]" size={48} />
            </div>
            <h2 className="text-3xl font-bold mb-4">Start Your Community</h2>
            <p className="text-gray-400 text-lg mb-10 max-w-md mx-auto">
              Collaborate and grow. {user.role === 'teacher' ? 'Create a space for your students.' : 'Join a classroom to begin.'}
            </p>
            {user.role === 'teacher' ? (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-10 py-4 bg-[#5865F2] hover:bg-[#4752c4] rounded-2xl font-bold transition-all shadow-lg"
              >
                Launch First Class
              </button>
            ) : (
              <button
                onClick={() => setShowJoinModal(true)}
                className="px-10 py-4 bg-[#5865F2] hover:bg-[#4752c4] rounded-2xl font-bold transition-all shadow-lg"
              >
                Join with Code
              </button>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {classrooms.map((classroom, index) => (
              <motion.div
                key={classroom.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setSelectedClassroom(classroom)}
                className="group bg-[#2b2d31] p-8 rounded-3xl cursor-pointer hover:bg-[#313338] transition-all border border-white/5 hover:border-[#5865F2]/40 shadow-xl"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 bg-white/5 rounded-2xl group-hover:bg-[#5865F2]/10 transition-colors">
                    <GraduationCap size={32} className="text-[#5865F2]" />
                  </div>
                  <ArrowRight size={24} className="text-gray-600 group-hover:text-white transition-all transform group-hover:translate-x-1" />
                </div>
                <h3 className="text-2xl font-bold mb-3">{classroom.name}</h3>
                {classroom.description && (
                  <p className="text-gray-400 text-sm mb-6 line-clamp-2 leading-relaxed">{classroom.description}</p>
                )}
                <div className="flex items-center gap-6 mt-auto">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-400">
                    <Users size={18} className="text-[#5865F2]" />
                    {classroom.studentIds.length}
                  </div>
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-400">
                    <Video size={18} className="text-[#5865F2]" />
                    {classroom.virtualLinks?.length || 0}
                  </div>
                </div>

                {user.role === 'teacher' && classroom.teacherId === user.id && (
                  <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Invite Code</span>
                    <div className="flex items-center gap-3">
                      <code className="text-sm font-bold font-mono bg-[#1e1f22] px-3 py-1.5 rounded-lg border border-white/5 text-[#5865F2]">
                        {classroom.inviteCode}
                      </code>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyInviteCode(classroom.inviteCode);
                        }}
                        className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-500 hover:text-white"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Modals with AnimatePresence */}
        <AnimatePresence>
          {showCreateModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
                onClick={() => setShowCreateModal(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative bg-[#2b2d31] p-10 rounded-[2rem] w-full max-w-lg border border-white/10 shadow-2xl"
              >
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-3xl font-bold">New Classroom</h2>
                  <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-white p-2">
                    <X size={28} />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Class Name</label>
                    <input
                      type="text"
                      autoFocus
                      value={className}
                      onChange={(e) => setClassName(e.target.value)}
                      className="w-full bg-[#1e1f22] border border-white/5 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-[#5865F2] ring-0 transition-all text-lg placeholder:text-gray-600"
                      placeholder="e.g., Computer Science 201"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Description</label>
                    <textarea
                      value={classDescription}
                      onChange={(e) => setClassDescription(e.target.value)}
                      className="w-full bg-[#1e1f22] border border-white/5 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-[#5865F2] resize-none h-32 placeholder:text-gray-600"
                      placeholder="What will students learn here?"
                    />
                  </div>

                  <button
                    onClick={handleCreateClassroom}
                    disabled={!className.trim() || creating}
                    className="w-full h-16 bg-[#5865F2] hover:bg-[#4752c4] text-white font-bold text-lg rounded-2xl transition-all shadow-xl shadow-[#5865F2]/20 disabled:opacity-50 mt-4"
                  >
                    {creating ? <Loader2 className="animate-spin mx-auto" /> : 'Create Classroom'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {showJoinModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
                onClick={() => setShowJoinModal(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative bg-[#2b2d31] p-10 rounded-[2.5rem] w-full max-w-md border border-white/10 shadow-2xl text-center"
              >
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-3xl font-bold">Join Class</h2>
                  <button onClick={() => setShowJoinModal(false)} className="text-gray-400 hover:text-white p-2">
                    <X size={28} />
                  </button>
                </div>

                <p className="text-gray-400 mb-8">Enter the 6-character code provided by your teacher.</p>

                <div className="space-y-6">
                  <input
                    type="text"
                    autoFocus
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    className="w-full bg-[#1e1f22] border border-white/5 rounded-2xl px-6 py-5 text-white focus:outline-none focus:border-[#5865F2] font-mono text-center text-4xl font-bold tracking-[0.5em] placeholder:text-gray-700/50"
                    placeholder="______"
                    maxLength={6}
                  />

                  {joinError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl font-medium"
                    >
                      {joinError}
                    </motion.div>
                  )}

                  <button
                    onClick={handleJoinClassroom}
                    disabled={inviteCode.length < 6 || joining}
                    className="w-full h-16 bg-[#5865F2] hover:bg-[#4752c4] text-white font-bold text-xl rounded-2xl transition-all shadow-xl shadow-[#5865F2]/20 disabled:opacity-50"
                  >
                    {joining ? <Loader2 className="animate-spin mx-auto" /> : 'Join Now'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Classrooms;
