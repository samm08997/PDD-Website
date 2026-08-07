import { useState } from 'react';
import { ArrowLeft, Plus, Calendar as CalendarIcon, CheckCircle2, Circle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PlannerScreen() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Completed' | 'Overdue'>('All');
  const [modalVisible, setModalVisible] = useState(false);
  
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskSubject, setNewTaskSubject] = useState('');
  const [newTaskMinutes, setNewTaskMinutes] = useState('30');

  const tabs = ['All', 'Pending', 'Overdue', 'Completed'] as const;

  const [tasks, setTasks] = useState([
    { id: 1, title: 'Review Biology Chapter 3', subject: 'Biology', status: 'Pending', time: '30m' },
    { id: 2, title: 'Math Problem Set', subject: 'Math', status: 'Completed', time: '45m' },
    { id: 3, title: 'History Essay Outline', subject: 'History', status: 'Overdue', time: '60m' },
  ]);

  const filteredTasks = tasks.filter(t => {
    if (filter === 'All') return true;
    return t.status === filter;
  });

  const toggleTask = (id: number) => {
    setTasks(tasks.map(t => {
      if (t.id === id) {
        return { ...t, status: t.status === 'Completed' ? 'Pending' : 'Completed' };
      }
      return t;
    }));
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle) return;
    setTasks([{
      id: Date.now(),
      title: newTaskTitle,
      subject: newTaskSubject || 'General',
      status: 'Pending',
      time: newTaskMinutes + 'm'
    }, ...tasks]);
    setModalVisible(false);
    setNewTaskTitle('');
    setNewTaskSubject('');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      {/* Header */}
      <header className="flex items-center justify-between px-6 pt-12 pb-4 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl hover:bg-secondary transition-colors">
            <ArrowLeft className="w-6 h-6 text-foreground" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">Study Planner</h1>
        </div>
        <button onClick={() => setModalVisible(true)} className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center hover:bg-primary/30 transition-colors">
          <Plus className="w-5 h-5 text-primary" />
        </button>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 px-6 py-4 overflow-x-auto no-scrollbar">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors border whitespace-nowrap ${
              filter === tab 
                ? 'bg-primary border-primary text-white' 
                : 'bg-card border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* List */}
      <main className="flex-1 px-6 pb-20 max-w-2xl mx-auto w-full">
        {filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-20 text-center">
            <CalendarIcon className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
            <h2 className="text-base font-semibold text-foreground mb-1">No tasks found</h2>
            <p className="text-[14px] text-muted-foreground">Tap the + button to create a study plan.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map(task => (
              <div key={task.id} className="bg-card border border-border rounded-xl p-4 flex items-start gap-3">
                <button onClick={() => toggleTask(task.id)} className="mt-0.5 shrink-0">
                  {task.status === 'Completed' ? (
                    <CheckCircle2 className="w-[22px] h-[22px] text-primary" />
                  ) : (
                    <Circle className="w-[22px] h-[22px] text-muted-foreground" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <h3 className={`text-[15px] font-medium ${task.status === 'Completed' ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                    {task.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[12px] font-medium text-primary px-2 py-0.5 bg-primary/10 rounded-full">
                      {task.subject}
                    </span>
                    <span className="text-[12px] text-muted-foreground">{task.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal Overlay */}
      {modalVisible && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-2xl p-6 border border-border animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95">
            <h2 className="text-[18px] font-semibold text-foreground mb-5">New Study Task</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-foreground mb-1.5 ml-1">Task Name</label>
                <input
                  type="text"
                  autoFocus
                  required
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  placeholder="e.g., Read Chapter 4"
                  className="w-full border border-border rounded-xl px-4 py-3 bg-secondary text-[15px] text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-foreground mb-1.5 ml-1">Subject</label>
                <input
                  type="text"
                  value={newTaskSubject}
                  onChange={e => setNewTaskSubject(e.target.value)}
                  placeholder="e.g., History"
                  className="w-full border border-border rounded-xl px-4 py-3 bg-secondary text-[15px] text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-foreground mb-1.5 ml-1">Estimated Time (minutes)</label>
                <input
                  type="number"
                  value={newTaskMinutes}
                  onChange={e => setNewTaskMinutes(e.target.value)}
                  placeholder="30"
                  className="w-full border border-border rounded-xl px-4 py-3 bg-secondary text-[15px] text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setModalVisible(false)}
                  className="flex-1 py-3 rounded-xl bg-secondary text-foreground font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-primary text-white font-semibold"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
