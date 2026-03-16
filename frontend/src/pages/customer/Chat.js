import React, { useEffect, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import io from 'socket.io-client';
import Layout from '../../components/shared/Layout';
import axiosInstance from '../../utils/axiosInstance';

let socket;

export default function CustomerChat() {
  const { user } = useSelector(s => s.auth);
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchTickets();
    socket = io('http://localhost:5000');
    return () => { if (socket) socket.disconnect(); };
  }, []);

  useEffect(() => {
    if (selectedTicket) {
      socket.emit('join_ticket', selectedTicket.ticketId);
      socket.on('receive_message', (msg) => setMessages(prev => [...prev, msg]));
      fetchMessages(selectedTicket.ticketId);
    }
    return () => { if (socket) socket.off('receive_message'); };
  }, [selectedTicket]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const fetchTickets = async () => {
    try { const { data } = await axiosInstance.get('/support/tickets/my'); setTickets(data.tickets || []); } catch (_) {}
  };
  const fetchMessages = async (ticketId) => {
    try { const { data } = await axiosInstance.get(`/support/tickets/${ticketId}/messages`); setMessages(data.messages || []); } catch (_) {}
  };
  const createTicket = async () => {
    if (!subject.trim()) return toast.error('Subject required');
    try { await axiosInstance.post('/support/tickets', { subject }); toast.success('Ticket created'); setSubject(''); setShowNewTicket(false); fetchTickets(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };
  const sendMessage = () => {
    if (!newMessage.trim() || !selectedTicket) return;
    socket.emit('send_message', { ticketId: selectedTicket.ticketId, senderType: 'CUSTOMER', senderId: user.id, message: newMessage.trim() });
    setNewMessage('');
  };

  const selectTicket = (t) => { setSelectedTicket(t); setShowChat(true); };
  const statusColor = { OPEN: '#22c55e', IN_PROGRESS: '#f59e0b', RESOLVED: '#94a3b8' };

  return (
    <Layout>
      <h2 style={{ margin: '0 0 24px', color: '#1e293b', fontSize: 24 }}>Support</h2>
      <div className="d-flex gap-3" style={{ height: '70vh', minHeight: 400 }}>
        {/* Ticket list — hidden on mobile when chat open */}
        <div className={`flex-column ${showChat ? 'd-none d-md-flex' : 'd-flex'}`}
          style={{ width: 280, background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', flexShrink: 0 }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>My Tickets</span>
            <button onClick={() => setShowNewTicket(true)} style={{ padding: '4px 12px', borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>+ New</button>
          </div>
          {showNewTicket && (
            <div style={{ padding: 12, borderBottom: '1px solid #e2e8f0' }}>
              <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Describe your issue..."
                style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, boxSizing: 'border-box', marginBottom: 8, fontFamily: 'inherit' }} />
              <div className="d-flex gap-2">
                <button onClick={createTicket} className="btn flex-fill btn-sm" style={{ borderRadius: 8, border: 'none', background: '#22c55e', color: '#fff', fontWeight: 700, fontSize: 12 }}>Create</button>
                <button onClick={() => setShowNewTicket(false)} className="btn flex-fill btn-sm" style={{ borderRadius: 8, border: 'none', background: '#f1f5f9', color: '#64748b', fontWeight: 700, fontSize: 12 }}>Cancel</button>
              </div>
            </div>
          )}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {tickets.map(t => (
              <div key={t.ticketId} onClick={() => selectTicket(t)}
                style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', background: selectedTicket?.ticketId === t.ticketId ? '#eff6ff' : 'transparent' }}>
                <div className="d-flex justify-content-between mb-1">
                  <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#94a3b8' }}>{t.ticketId}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: statusColor[t.status] }}>{t.status}</span>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: '#1e293b' }}>{t.subject}</p>
              </div>
            ))}
            {tickets.length === 0 && <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, padding: 20 }}>No tickets yet</p>}
          </div>
        </div>

        {/* Chat panel — full width on mobile when selected */}
        <div className={`flex-column flex-fill ${showChat ? 'd-flex' : 'd-none d-md-flex'}`}
          style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          {!selectedTicket ? (
            <div className="flex-fill d-flex align-items-center justify-content-center" style={{ color: '#94a3b8' }}>
              <p>Select a ticket to view the conversation</p>
            </div>
          ) : (
            <>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 12 }}>
                <button className="d-md-none btn btn-sm" onClick={() => setShowChat(false)}
                  style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '4px 10px', color: '#64748b', fontWeight: 700, cursor: 'pointer' }}>
                  &#8592; Back
                </button>
                <div>
                  <h4 style={{ margin: 0, color: '#1e293b' }}>{selectedTicket.subject}</h4>
                  <span style={{ fontSize: 12, color: statusColor[selectedTicket.status], fontWeight: 700 }}>{selectedTicket.status}</span>
                </div>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {messages.map(msg => (
                  <div key={msg.messageId} style={{ display: 'flex', justifyContent: msg.senderType === 'CUSTOMER' ? 'flex-end' : 'flex-start' }}>
                    <div style={{ maxWidth: '70%', padding: '10px 14px', borderRadius: 12, background: msg.senderType === 'CUSTOMER' ? '#3b82f6' : '#f1f5f9', color: msg.senderType === 'CUSTOMER' ? '#fff' : '#1e293b', fontSize: 14 }}>
                      {msg.message}
                      <p style={{ margin: '4px 0 0', fontSize: 11, opacity: 0.7 }}>{new Date(msg.timestamp).toLocaleTimeString('en-IN')}</p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              {selectedTicket.status !== 'RESOLVED' && (
                <div style={{ padding: '16px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: 10 }}>
                  <input value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()}
                    placeholder="Type your message..." style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, fontFamily: 'inherit', outline: 'none', minWidth: 0 }} />
                  <button onClick={sendMessage} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>Send</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
