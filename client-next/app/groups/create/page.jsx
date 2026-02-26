'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Plus, Users, FileText, ArrowLeft, Coins, UserPlus, X,
  CheckCircle2, TrendingUp, Shield, Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { api } from '@/api/apiClient';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { SpaceSky } from '@/components/SpaceSky';
import { CURRENCY_OPTIONS } from '@/utils/helpers';

const FEATURES = [
  { icon: TrendingUp, title: 'Smart Expense Tracking', desc: 'Track every trip and who owes what in real time.' },
  { icon: Users,      title: 'Group Collaboration',   desc: 'Add members and manage payments together.' },
  { icon: Shield,     title: 'Secure & Private',      desc: 'Your data is safe with optional visibility settings.' },
  { icon: Sparkles,   title: 'AI-Powered Insights',   desc: 'Ask your group data questions in plain language.' },
];

export default function CreateGroupPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const memberInputRef = useRef(null);

  const [formData, setFormData] = useState({ grp_name: '', description: '', currency: '$' });
  const [members, setMembers] = useState([]);
  const [memberInput, setMemberInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const { data: allMembersData } = useQuery({
    queryKey: ['allMembers'],
    queryFn: async () => {
      const res = await api.getAllMembers();
      return res.data.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const suggestions = [...new Set((allMembersData || []).map((m) => m.mem_name))]
    .filter((name) =>
      memberInput.trim().length > 0 &&
      name.toLowerCase().includes(memberInput.toLowerCase()) &&
      !members.includes(name)
    )
    .slice(0, 6);

  const createGroupMutation = useMutation({
    mutationFn: (data) =>
      api.addGroup({
        user_id: user._id,
        ...data,
        status: 1,
        create_date: new Date().toISOString(),
        member: JSON.stringify(members),
      }),
    onSuccess: (response) => {
      toast.success('Group created!');
      const id = response.data.data?.id;
      router.push(id ? `/groups/${id}` : '/home');
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to create group'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.grp_name.trim()) { toast.error('Group name is required'); return; }
    createGroupMutation.mutate(formData);
  };

  const handleChange = (e) => setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));

  const addMember = useCallback((name = memberInput) => {
    const n = (name || memberInput).trim();
    if (!n) return;
    if (members.includes(n)) { toast.error(`${n} already added`); return; }
    setMembers((p) => [...p, n]);
    setMemberInput('');
    setShowSuggestions(false);
    memberInputRef.current?.focus();
  }, [memberInput, members]);

  const removeMember = (name) => setMembers((p) => p.filter((m) => m !== name));

  const handleMemberKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); addMember(); }
    if (e.key === 'Escape') setShowSuggestions(false);
  };

  useEffect(() => {
    const close = (e) => { if (!e.target.closest('[data-suggestion-container]')) setShowSuggestions(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const isSaving = createGroupMutation.isPending;

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <SpaceSky />

      <div className="relative z-10 flex flex-1 flex-col md:flex-row min-h-screen">

        {/* ════ LEFT HERO PANEL (desktop only) ════════════════════════════ */}
        <aside className="hidden md:flex flex-col justify-between w-[42%] lg:w-[38%] px-10 lg:px-16 py-14 border-r border-border/30 bg-gradient-to-b from-primary/8 via-purple-500/4 to-blue-500/4 dark:from-primary/15 dark:via-purple-900/15 dark:to-background/50 backdrop-blur-sm shrink-0">
          <div>
            <button
              onClick={() => router.push('/home')}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-12 group"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
              Back to Home
            </button>

            <div className="mb-12">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20 mb-5">
                <Sparkles className="h-3.5 w-3.5" /> New Group
              </span>
              <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.1] mb-4">
                Split expenses,<br />
                <span className="bg-gradient-to-r from-primary via-purple-400 to-blue-400 bg-clip-text text-transparent">
                  zero stress.
                </span>
              </h2>
              <p className="text-muted-foreground text-base leading-relaxed max-w-[280px]">
                Create a group, invite your people, and let TinyNotie do the math.
              </p>
            </div>

            <div className="space-y-6">
              {FEATURES.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex gap-3.5 items-start">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Members preview */}
          <div className="mt-10 p-4 rounded-2xl bg-background/30 dark:bg-white/5 backdrop-blur border border-border/30">
            <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-widest">Members to add</p>
            {members.length === 0 ? (
              <p className="text-xs text-muted-foreground/50 italic">None yet</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {members.map((m) => (
                  <span key={m} className="flex items-center gap-1 pl-1.5 pr-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" />{m}
                  </span>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* ════ RIGHT FORM PANEL ══════════════════════════════════════════ */}
        <main className="flex-1 flex flex-col px-4 sm:px-8 md:px-12 lg:px-16 py-8 md:py-14 overflow-y-auto">

          {/* Mobile header */}
          <div className="flex items-center gap-3 mb-8 md:hidden">
            <Button variant="ghost" size="icon" onClick={() => router.push('/home')} className="bg-background/30 backdrop-blur">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold leading-none">Create New Group</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Set up your expense group</p>
            </div>
          </div>

          {/* Desktop heading */}
          <div className="hidden md:block mb-10">
            <h1 className="text-3xl font-extrabold tracking-tight mb-1">Create your group</h1>
            <p className="text-muted-foreground text-sm">Fill in the details — you can always edit later.</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col flex-1 gap-8">

            {/* ── Section 1: Group details ─────────────────────────────── */}
            <section>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-5">Group Details</h2>
              <div className="space-y-5 max-w-xl">
                <div>
                  <Label htmlFor="grp_name" className="text-sm font-semibold flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-primary" /> Group Name <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="grp_name" name="grp_name"
                    placeholder="e.g. Japan Trip 2026"
                    value={formData.grp_name} onChange={handleChange}
                    required autoFocus
                    className="h-11 text-sm bg-background/50 backdrop-blur border-border/60"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-semibold flex items-center gap-2 mb-2">
                      <Coins className="h-4 w-4 text-primary" /> Currency <span className="text-red-400">*</span>
                    </Label>
                    <Select value={formData.currency} onValueChange={(v) => setFormData((p) => ({ ...p, currency: v }))}>
                      <SelectTrigger className="h-11 bg-background/50 backdrop-blur border-border/60">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {CURRENCY_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description" className="text-sm font-semibold flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-primary" /> Description
                    <span className="text-muted-foreground font-normal text-xs">(optional)</span>
                  </Label>
                  <textarea
                    id="description" name="description"
                    placeholder="What's this group about?"
                    value={formData.description} onChange={handleChange}
                    rows={3}
                    className="w-full rounded-md border border-border/60 bg-background/50 backdrop-blur px-3 py-2.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary resize-none transition-colors"
                  />
                </div>
              </div>
            </section>

            {/* Divider */}
            <div className="border-t border-border/30 -mx-4 sm:-mx-8 md:-mx-12 lg:-mx-16" />

            {/* ── Section 2: Members ───────────────────────────────────── */}
            <section>
              <div className="flex items-center justify-between mb-5 max-w-xl">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Members</h2>
                {members.length > 0 && (
                  <span className="text-xs text-primary font-medium">{members.length} added</span>
                )}
              </div>

              <div className="max-w-xl space-y-4">
                {/* Input + autocomplete */}
                <div>
                  <Label className="text-sm font-semibold flex items-center gap-2 mb-2">
                    <UserPlus className="h-4 w-4 text-primary" /> Add Member
                    <span className="text-muted-foreground font-normal text-xs">(reuse from past groups)</span>
                  </Label>

                  <div data-suggestion-container className="relative">
                    <div className="flex gap-2">
                      <Input
                        ref={memberInputRef}
                        placeholder="Type a name then press Enter or +"
                        value={memberInput}
                        onChange={(e) => { setMemberInput(e.target.value); setShowSuggestions(true); }}
                        onKeyDown={handleMemberKeyDown}
                        onFocus={() => setShowSuggestions(true)}
                        className="h-11 text-sm bg-background/50 backdrop-blur border-border/60"
                      />
                      <Button
                        type="button" variant="outline" size="icon"
                        className="h-11 w-11 shrink-0 border-border/60"
                        onClick={() => addMember()}
                        disabled={!memberInput.trim()}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Autocomplete dropdown */}
                    <AnimatePresence>
                      {showSuggestions && suggestions.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.12 }}
                          className="absolute top-[calc(100%+4px)] left-0 right-0 z-50 rounded-xl border border-border bg-popover shadow-xl overflow-hidden"
                        >
                          <p className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest border-b border-border/50">
                            Previous members
                          </p>
                          {suggestions.map((name) => (
                            <button
                              key={name} type="button"
                              onMouseDown={(e) => { e.preventDefault(); addMember(name); }}
                              className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-accent transition-colors text-sm"
                            >
                              <div className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                                {name[0].toUpperCase()}
                              </div>
                              <span>{name}</span>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Member chips */}
                <div className="min-h-[3rem]">
                  {members.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-5 border border-dashed border-border/40 rounded-xl">
                      No members added — you can also add them after creation
                    </p>
                  ) : (
                    <AnimatePresence>
                      <motion.div className="flex flex-wrap gap-2">
                        {members.map((name, i) => (
                          <motion.div
                            key={name}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.7 }}
                            transition={{ duration: 0.15 }}
                          >
                            <span className="flex items-center gap-1.5 pl-2 pr-1.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-sm">
                              <div className="w-5 h-5 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">
                                {name[0].toUpperCase()}
                              </div>
                              <span className="font-medium">{name}</span>
                              <button
                                type="button"
                                onClick={() => removeMember(name)}
                                className="rounded-full p-0.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          </motion.div>
                        ))}
                      </motion.div>
                    </AnimatePresence>
                  )}
                </div>
              </div>
            </section>

            {/* ── Submit row ───────────────────────────────────────────── */}
            <div className="flex items-center justify-between pt-6 mt-auto border-t border-border/30 -mx-4 sm:-mx-8 md:-mx-12 lg:-mx-16 px-4 sm:px-8 md:px-12 lg:px-16">
              <Button type="button" variant="ghost" onClick={() => router.push('/home')} disabled={isSaving} className="text-muted-foreground gap-2">
                <ArrowLeft className="h-4 w-4" /> Cancel
              </Button>
              <Button type="submit" size="lg" className="min-w-[160px] gap-2" disabled={isSaving}>
                <Plus className="h-4 w-4" />
                {isSaving ? 'Creating…' : 'Create Group'}
              </Button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
