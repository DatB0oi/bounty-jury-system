"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Submission = {
  id: string;
  url: string;
  creator_handle: string;
  format: string;
  created_at: string;
  avg_score: number | null;
  score_count: number;
  scores: any[]; // added for transparency
};

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [progressData, setProgressData] = useState<{ totalSubmissions: number, judges: any[] } | null>(null);
  
  // Submission Add
  const [newUrl, setNewUrl] = useState('');
  const [newHandle, setNewHandle] = useState('');
  const [newFormat, setNewFormat] = useState('Thread');
  const [addError, setAddError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Grading Config
  const [deadline, setDeadline] = useState<string>('');
  const [isDeadlinePassed, setIsDeadlinePassed] = useState(false);
  const [deadlineError, setDeadlineError] = useState('');
  const [deadlineSuccess, setDeadlineSuccess] = useState('');

  // Modals
  const [activeSubId, setActiveSubId] = useState<string | null>(null);
  const [scores, setScores] = useState({ accuracy: 5, originality: 5, culture: 5, visuals: 5, impact: 5, comment: '' });

  const fetchContext = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
      }
    } catch {}

    try {
      const res = await fetch('/api/config');
      const data = await res.json();
      if (data.deadline) {
        setDeadline(new Date(data.deadline).toISOString().slice(0,16)); // format for datetime-local
        if (new Date() > new Date(data.deadline)) {
          setIsDeadlinePassed(true);
        }
      }
    } catch {}
    
    fetchSubmissions();
    fetchProgress();
  };

  const fetchProgress = async () => {
    try {
      const res = await fetch('/api/judges/progress');
      const data = await res.json();
      setProgressData(data);
    } catch {}
  };

  const fetchSubmissions = async () => {
    const res = await fetch('/api/submissions');
    const data = await res.json();
    setSubmissions(data || []);
  };

  useEffect(() => {
    fetchContext();
  }, []);

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/login');
  };

  const handleUpdateDeadline = async () => {
    setDeadlineError(''); setDeadlineSuccess('');
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deadline })
      });
      const data = await res.json();
      if(data.success) {
         setDeadlineSuccess('Deadline updated');
         setIsDeadlinePassed(new Date() > new Date(deadline));
      } else {
         setDeadlineError('Failed to update');
      }
    } catch(err) {
      setDeadlineError('Server Error');
    }
  };

  const handleAddSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');
    if (!newUrl) return;
    
    const url = '/api/submissions';
    const method = editingId ? 'PUT' : 'POST';
    const bodyPayload = editingId 
      ? { id: editingId, url: newUrl, creator_handle: newHandle, format: newFormat }
      : { url: newUrl, creator_handle: newHandle, format: newFormat };

    const res = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyPayload)
    });
    const data = await res.json();
    if(res.ok && data.success) {
      setNewUrl('');
      setNewHandle('');
      setNewFormat('Thread');
      setEditingId(null);
      fetchSubmissions();
    } else {
      setAddError(data.error || 'Failed to save submission');
    }
  };

  const openGradingModal = async (subId: string) => {
    if (isDeadlinePassed) return;
    setActiveSubId(subId);
    // Fetch existing
    const res = await fetch(`/api/scores?submissionId=${subId}&judgeId=${user.id}`);
    const data = await res.json();
    if (data && data.length > 0) {
      const s = data[0];
      setScores({
        accuracy: s.accuracy,
        originality: s.originality,
        culture: s.culture,
        visuals: s.visuals,
        impact: s.impact,
        comment: s.comment || ''
      });
    } else {
      setScores({ accuracy: 5, originality: 5, culture: 5, visuals: 5, impact: 5, comment: '' });
    }
  };

  const submitScore = async () => {
    if (!user || !activeSubId || isDeadlinePassed) return;
    await fetch('/api/scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        submission_id: activeSubId,
        judge_id: user.id,
        ...scores
      })
    });
    setActiveSubId(null);
    fetchSubmissions();
    fetchProgress();
  };

  const getPfpUrl = (name: string) => {
    if (name.toLowerCase() === 'lavender') return '/pfp/Khay.jpg';
    const knownPfps = ['Feezy', 'GRiim', 'Khay', 'Luke152', 'Promise_wils', 'datboi'];
    const match = knownPfps.find(p => p.toLowerCase() === name.toLowerCase());
    if (match) return `/pfp/${match}.jpg`;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff`;
  };

  const [expandedSubId, setExpandedSubId] = useState<string | null>(null);

  if(!user) return null; // loading state essentially

  const sortedSubmissions = [...submissions].filter(s => s.avg_score !== null).sort((a, b) => {
    if (b.avg_score !== a.avg_score) return (b.avg_score || 0) - (a.avg_score || 0);
    if (b.score_count !== a.score_count) return b.score_count - a.score_count;
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

  const top3 = sortedSubmissions.slice(0, 3);
  const raffleCandidates = sortedSubmissions.slice(3).filter(s => (s.avg_score || 0) >= 30);

  return (
    <div>
      <div className="card mb-8" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="text-xl fw-bold">Active Judge: <span style={{color: 'var(--ava-red)'}}>{user.name}</span></h2>
          <p className="text-sm" style={{color: '#aaa'}}>Role: {user.role.toUpperCase()}</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {isDeadlinePassed ? (
            <span style={{ color: 'var(--ava-red)', fontWeight: 'bold', padding: '0.5rem 1rem', background: 'rgba(255,57,74,0.1)', borderRadius: '8px' }}>
              ⚠️ Grading is Closed
            </span>
          ) : (
            <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>Active Grading Period</span>
          )}
          <button className="btn-secondary" onClick={handleLogout}>Log Out</button>
        </div>
      </div>

      {/* JUDGES PROGRESS */}
      <div className="card mb-8" style={{ padding: '1rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 className="text-sm fw-bold" style={{ color: '#aaa', margin: 0, marginRight: '1rem' }}>JURY PROGRESS</h2>
          {progressData?.judges.map(j => (
            <div key={j.id} style={{ 
              display: 'flex', alignItems: 'center', gap: '0.75rem', 
              background: 'rgba(0,0,0,0.3)', padding: '0.4rem 1rem 0.4rem 0.4rem', borderRadius: '50px',
              border: j.missing === 0 ? '1px solid #4CAF50' : '1px solid var(--glass-border)'
            }}>
              <img src={getPfpUrl(j.name)} alt={j.name} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <span className="fw-bold text-xs" style={{ lineHeight: 1, marginBottom: '2px' }}>{j.name}</span>
                <span style={{ fontSize: '0.65rem', color: j.missing === 0 ? '#4CAF50' : '#888', fontWeight: 'bold' }}>
                  {j.rated} / {progressData.totalSubmissions}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: user.role === 'admin' ? '1fr 2fr' : '1fr', gap: '2rem' }}>
        
        {/* ADMIN SECTION */}
        {user.role === 'admin' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Adds */}
            <div className="card" style={{ height: 'fit-content' }}>
              <h2 className="text-xl fw-bold mb-4">{editingId ? 'Edit Submission' : 'Add Submission'}</h2>
              {addError && <p style={{ color: 'var(--ava-red)', marginBottom: '1rem' }}>{addError}</p>}
              <form onSubmit={handleAddSubmission} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <input 
                  type="url" placeholder="https://..." 
                  value={newUrl} onChange={e => setNewUrl(e.target.value)} required
                />
                <input 
                  type="text" placeholder="@creator_handle" 
                  value={newHandle} onChange={e => setNewHandle(e.target.value)} 
                />
                <select value={newFormat} onChange={e => setNewFormat(e.target.value)}>
                  <option>Thread</option>
                  <option>Post</option>
                  <option>Video</option>
                  <option>Article</option>
                  <option>Art / Graphic</option>
                </select>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button type="submit" className="btn-primary" style={{flex: 1}}>{editingId ? 'Update Link' : 'Save Link'}</button>
                  {editingId && (
                    <button type="button" className="btn-secondary" onClick={() => {
                        setEditingId(null); setNewUrl(''); setNewHandle(''); setNewFormat('Thread'); setAddError('');
                    }}>Cancel</button>
                  )}
                </div>
              </form>
            </div>

            {/* Deadline */}
            <div className="card" style={{ height: 'fit-content' }}>
              <h2 className="text-xl fw-bold mb-4">Set Final Deadline</h2>
              <p className="text-sm mb-4" style={{color: '#aaa'}}>Block judges from voting after this date.</p>
              
              {deadlineError && <p style={{ color: 'var(--ava-red)' }}>{deadlineError}</p>}
              {deadlineSuccess && <p style={{ color: '#4CAF50' }}>{deadlineSuccess}</p>}
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <input 
                  type="datetime-local" 
                  value={deadline}
                  onChange={e => setDeadline(e.target.value)}
                />
                <button onClick={handleUpdateDeadline} className="btn-primary">Update Deadline</button>
              </div>
            </div>

          </div>
        )}

        {/* RIGHT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* PODIUM */}
          {top3.length > 0 && (
            <div className="card" style={{ background: 'linear-gradient(145deg, rgba(30,30,35,0.9), rgba(15,15,20,0.9))', border: '1px solid rgba(255,255,255,0.1)' }}>
              <h2 className="text-xl fw-bold mb-6" style={{ textAlign: 'center', color: '#fff' }}>🏆 Current Podium</h2>
              
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                
                {/* 2nd Place */}
                {top3[1] && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '30%', minWidth: '120px' }}>
                    <div style={{ background: 'rgba(192, 192, 192, 0.1)', border: '2px solid silver', padding: '1rem', borderRadius: '12px 12px 0 0', width: '100%', textAlign: 'center', height: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <span style={{ fontSize: '2rem' }}>🥈</span>
                      <h3 className="fw-bold text-sm mt-2" style={{ wordBreak: 'break-all' }}><a href={top3[1].url} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>{top3[1].creator_handle || 'Unknown'}</a></h3>
                      <span className="text-xs fw-bold" style={{ color: '#4CAF50' }}>{parseFloat(top3[1].avg_score!.toString()).toFixed(1)}/50</span>
                    </div>
                  </div>
                )}

                {/* 1st Place */}
                {top3[0] && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '35%', minWidth: '140px' }}>
                    <div style={{ background: 'rgba(255, 215, 0, 0.15)', border: '2px solid gold', padding: '1rem', borderRadius: '12px 12px 0 0', width: '100%', textAlign: 'center', height: '150px', display: 'flex', flexDirection: 'column', justifyContent: 'center', boxShadow: '0 0 20px rgba(255, 215, 0, 0.2)' }}>
                      <span style={{ fontSize: '3rem' }}>🥇</span>
                      <h3 className="fw-bold mt-2" style={{ wordBreak: 'break-all' }}><a href={top3[0].url} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>{top3[0].creator_handle || 'Unknown'}</a></h3>
                      <span className="text-sm fw-bold" style={{ color: '#4CAF50' }}>{parseFloat(top3[0].avg_score!.toString()).toFixed(1)}/50</span>
                    </div>
                  </div>
                )}

                {/* 3rd Place */}
                {top3[2] && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '30%', minWidth: '120px' }}>
                    <div style={{ background: 'rgba(205, 127, 50, 0.1)', border: '2px solid #cd7f32', padding: '1rem', borderRadius: '12px 12px 0 0', width: '100%', textAlign: 'center', height: '100px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <span style={{ fontSize: '1.5rem' }}>🥉</span>
                      <h3 className="fw-bold text-sm mt-2" style={{ wordBreak: 'break-all' }}><a href={top3[2].url} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>{top3[2].creator_handle || 'Unknown'}</a></h3>
                      <span className="text-xs fw-bold" style={{ color: '#4CAF50' }}>{parseFloat(top3[2].avg_score!.toString()).toFixed(1)}/50</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Raffle Candidates */}
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                <h3 className="text-sm fw-bold mb-3" style={{ color: '#aaa', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  🎟️ Eligible for Raffle (Score &ge; 30)
                </h3>
                {raffleCandidates.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {raffleCandidates.map((c, i) => (
                      <div key={c.id} style={{ background: 'rgba(255,255,255,0.05)', padding: '0.3rem 0.6rem', borderRadius: '20px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <span style={{ color: '#aaa' }}>#{i + 4}</span>
                        <span className="fw-bold"><a href={c.url} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>{c.creator_handle || 'Unknown'}</a></span>
                        <span style={{ color: '#4CAF50' }}>({parseFloat(c.avg_score!.toString()).toFixed(1)})</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm" style={{ color: '#888', fontStyle: 'italic', margin: 0 }}>No other submissions meet the 30/50 threshold yet.</p>
                )}
              </div>
            </div>
          )}

        {/* LEADERBOARD/LIST */}
        <div className="card">
          <h2 className="text-xl fw-bold mb-4">Bounty Leaderboard</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {submissions.map(sub => (
              <div key={sub.id} style={{ 
                background: 'rgba(0,0,0,0.3)', borderRadius: '8px',
                borderLeft: sub.avg_score && sub.avg_score >= 30 ? '4px solid #4CAF50' : '4px solid var(--glass-border)',
                display: 'flex', flexDirection: 'column'
              }}>
                <div style={{ 
                  padding: '1rem',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                <div style={{ overflow: 'hidden' }}>
                  <h3 className="fw-bold" style={{ fontSize: '1.1rem' }}>{sub.creator_handle || 'Unknown'} <span className="text-xs" style={{ color: '#aaa', marginLeft: '8px' }}>{sub.format}</span></h3>
                  <a href={sub.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--ava-blue)', textDecoration: 'underline', fontSize: '0.9rem', wordBreak: 'break-all' }}>{sub.url}</a>
                  <p className="text-sm mt-1">Status: {sub.score_count} judge(s) voted</p>
                </div>
                <div style={{ textAlign: 'right', minWidth: '100px' }}>
                  <div className="text-xl fw-bold" style={{ color: sub.avg_score && sub.avg_score >= 30 ? '#4CAF50' : 'var(--white)' }}>
                    {sub.avg_score ? parseFloat(sub.avg_score.toString()).toFixed(1) : '--'}/50
                  </div>
                  {!isDeadlinePassed && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end', marginTop: '0.5rem' }}>
                      <button className="btn-secondary text-sm" onClick={() => openGradingModal(sub.id)}>Grade This</button>
                      <button className="text-sm" style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setExpandedSubId(expandedSubId === sub.id ? null : sub.id)}>
                        {expandedSubId === sub.id ? 'Hide Scores' : 'Show Scores'}
                      </button>
                      {user.role === 'admin' && (
                        <button className="text-sm" style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => {
                          setEditingId(sub.id);
                          setNewUrl(sub.url);
                          setNewHandle(sub.creator_handle);
                          setNewFormat(sub.format || 'Thread');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}>Edit</button>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {/* EXPANDED SCORES */}
              {expandedSubId === sub.id && sub.scores && sub.scores.length > 0 && (
                <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.15)', borderRadius: '0 0 8px 8px', borderTop: '1px solid var(--glass-border)' }}>
                  <h4 className="text-sm fw-bold mb-3" style={{ color: '#aaa' }}>Score Breakdown</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {sub.scores.map((score: any) => {
                      // Find judge name from progressData
                      const judge = progressData?.judges.find(j => j.id === score.judge_id);
                      const judgeName = judge ? judge.name : 'Unknown Judge';
                      
                      return (
                        <div key={score._id} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                          <img src={getPfpUrl(judgeName)} alt={judgeName} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span className="fw-bold">{judgeName}</span>
                              <span className="fw-bold" style={{ color: 'var(--ava-red)' }}>{score.total_score}/50</span>
                            </div>
                            <div className="text-xs mt-1" style={{ display: 'flex', gap: '0.5rem', color: '#aaa' }}>
                              <span>Acc: {score.accuracy}</span>
                              <span>Org: {score.originality}</span>
                              <span>Cul: {score.culture}</span>
                              <span>Vis: {score.visuals}</span>
                              <span>Imp: {score.impact}</span>
                            </div>
                            {score.comment && (
                              <div className="text-sm mt-2" style={{ fontStyle: 'italic', background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '4px', borderLeft: '2px solid var(--glass-border)' }}>
                                "{score.comment}"
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              </div>
            ))}
            {submissions.length === 0 && <p style={{ color: '#aaa' }}>No submissions yet.</p>}
          </div>
        </div>

        </div>
      </div>

      {/* SCORING MODAL */}
      {activeSubId && !isDeadlinePassed && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100
        }}>
          <div className="card" style={{ width: '600px', maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto', overflowX: 'hidden' }}>
            <h2 className="text-xl fw-bold mb-2">Evaluate Submission</h2>
            <p className="text-sm mb-4" style={{ color: '#aaa' }}>Score 1-10 on each criteria (Max 50). Threshold for raffle: 30+.</p>

            {[
              { 
                key: 'accuracy', 
                title: 'Technical Accuracy', 
                desc: 'Is the information about Club HashCash, the Hashathon, and Avalanche correct and well-researched?',
                tooltip: '1-3: Multiple factual errors or vague, unresearched content\n4-6: Mostly accurate but missing key details or context\n7-9: Accurate and well-researched with clear understanding of the topic\n10: Flawless accuracy, demonstrates deep knowledge of HashCash and Avalanche'
              },
              { 
                key: 'originality', 
                title: 'Originality & Authenticity', 
                desc: 'Does the content feel genuinely human? Does it show a real perspective rather than generic AI output?',
                tooltip: '1-3: Feels AI-generated, generic, or copy-pasted, could apply to any project\n4-6: Some original voice but still relies heavily on generic phrasing\n7-9: Clearly human, with a personal angle or original framing\n10: Distinct voice, creative take, stands out from any other submission'
              },
              { 
                key: 'culture', 
                title: 'Community & Culture Fit', 
                desc: 'Does the content capture the spirit, identity, or vibe of Club HashCash authentically?',
                tooltip: '1-3: No connection to HashCash culture or community, feels generic\n4-6: Mentions HashCash but doesn\'t really capture what makes it unique\n7-9: Shows understanding of the community and represents it well\n10: Deeply embedded in HashCash culture, feels like it came from within the community'
              },
              { 
                key: 'visuals', 
                title: 'Visual & Presentation Quality', 
                desc: 'Is the content well-structured and visually polished? (applies to all formats, thread, article, video)',
                tooltip: '1-3: Poor structure, hard to follow, no visuals or very low quality\n4-6: Functional but minimal effort on presentation or visuals\n7-9: Well-structured with at least 2 quality visuals or good editing\n10: Highly polished, visually compelling, strong formatting throughout'
              },
              { 
                key: 'impact', 
                title: 'Educational & Engagement Value', 
                desc: 'Does the content teach the audience something useful and make them want to learn more about HashCash or the Hashathon?',
                tooltip: '1-3: Doesn\'t inform or engage, surface level at best\n4-6: Somewhat informative but doesn\'t motivate further action\n7-9: Clearly educates and sparks interest in HashCash or the Hashathon\n10: Exceptionally informative and compelling, would make someone new want to participate immediately'
              },
            ].map(c => (
              <div key={c.key} className="mb-4">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span className="fw-medium" style={{ display: 'flex', alignItems: 'center' }}>
                    {c.title}
                    <div className="tooltip">ⓘ
                      <div className="tooltiptext">{c.tooltip}</div>
                    </div>
                  </span>
                  <span style={{ color: 'var(--white)' }} className="fw-bold">{scores[c.key as keyof typeof scores]}</span>
                </div>
                <p className="text-xs mb-2" style={{ color: '#888' }}>{c.desc}</p>
                <input 
                  type="range" min="1" max="10" 
                  value={scores[c.key as keyof typeof scores]} 
                  onChange={(e) => setScores({...scores, [c.key]: parseInt(e.target.value)})}
                  style={{ cursor: 'pointer', accentColor: '#ffffff' }}
                />
              </div>
            ))}

            <div className="mb-4 mt-2">
              <span className="fw-medium mb-2" style={{ display: 'block' }}>Feedback / Comments (Optional)</span>
              <textarea 
                rows={3} 
                placeholder="Leave a comment for the creator or a note for other judges..."
                value={scores.comment} 
                onChange={(e) => setScores({...scores, comment: e.target.value})}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid var(--glass-border)', outline: 'none', resize: 'vertical' }}
              />
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setActiveSubId(null)}>Cancel</button>
              <button className="btn-primary" onClick={submitScore}>
                Submit Score (Tot: {scores.accuracy + scores.originality + scores.culture + scores.visuals + scores.impact})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
