import React, { useEffect, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import Layout from '../../components/shared/Layout';
import axiosInstance from '../../utils/axiosInstance';
import io from 'socket.io-client';

let socket;

export default function AdminChat() {
  const { user } = useSelector(s => s.auth);
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
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

  const fetchTickets = () => axiosInstance.get('/support/tickets').then(r => setTickets(r.data.tickets || []));
  const fetchMessages = (ticketId) => axiosInstance.get(`/support/tickets/${ticketId}/messages`).then(r => setMessages(r.data.messages || []));

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedTicket) return;
    socket.emit('send_message', { ticketId: selectedTicket.ticketId, senderType: 'ADMIN', senderId: user.id, message: newMessage.trim() });
    setNewMessage('');
  };

  const updateStatus = async (ticketId, status) => {
    await axiosInstance.patch(`/support/tickets/${ticketId}`, { status });
    fetchTickets();
    if (selectedTicket?.ticketId === ticketId) setSelectedTicket(prev => ({ ...prev, status }));
  };

  const selectTicket = (t) => { setSelectedTicket(t); setShowChat(true); };

  const statusColor = { OPEN: '#22c55e', IN_PROGRESS: '#f59e0b', RESOLVED: '#94a3b8' };

  return (
    <Layout>
      <h2 style={{ margin: '0 0 24px', color: '#1e293b', fontSize: 24 }}>Support Tickets</h2>
      <div className="d-flex gap-3" style={{ height: '72vh', minHeight: 400 }}>
        {/* Ticket list — hidden on mobile when chat open */}
        <div className={`flex-column ${showChat ? 'd-none d-md-flex' : 'd-flex'}`}
          style={{ width: 300, background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', flexShrink: 0 }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0', fontWeight: 700, fontSize: 14 }}>All Tickets ({tickets.length})</div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {tickets.map(t => (
              <div key={t.ticketId} onClick={() => selectTicket(t)}
                style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', background: selectedTicket?.ticketId === t.ticketId ? '#eff6ff' : 'transparent' }}>
                <div className="d-flex justify-content-between mb-1">
                  <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#94a3b8' }}>{t.ticketId}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: statusColor[t.status] }}>{t.status}</span>
                </div>
                <p style={{ margin: '0 0 2px', fontSize: 13, color: '#1e293b', fontWeight: 500 }}>{t.subject}</p>
                <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>{t.customerId}</p>
              </div>
            ))}
            {tickets.length === 0 && <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, padding: 20 }}>No tickets</p>}
          </div>
        </div>

        {/* Chat area — full width on mobile when open */}
        <div className={`flex-column flex-fill ${showChat ? 'd-flex' : 'd-none d-md-flex'}`}
          style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          {!selectedTicket ? (
            <div className="flex-fill d-flex align-items-center justify-content-center" style={{ color: '#94a3b8' }}>
              <p>Select a ticket to respond</p>
            </div>
          ) : (
            <>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
                <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
                  <div className="d-flex align-items-center gap-2">
                    {/* Back button — mobile only */}
                    <button className="d-md-none btn btn-sm" onClick={() => setShowChat(false)}
                      style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '4px 10px', color: '#64748b', fontWeight: 700, cursor: 'pointer' }}>
                      &#8592; Back
                    </button>
                    <div>
                      <h4 style={{ margin: 0, color: '#1e293b' }}>{selectedTicket.subject}</h4>
                      <span style={{ fontSize: 12, color: '#64748b' }}>Customer: {selectedTicket.customerId}</span>
                    </div>
                  </div>
                  <div className="d-flex flex-wrap gap-2">
                    {['OPEN', 'IN_PROGRESS', 'RESOLVED'].map(s => (
                      <button key={s} onClick={() => updateStatus(selectedTicket.ticketId, s)}
                        style={{ padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, background: selectedTicket.status === s ? statusColor[s] : '#f1f5f9', color: selectedTicket.status === s ? '#fff' : '#64748b' }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {messages.map(msg => (
                  <div key={msg.messageId} style={{ display: 'flex', justifyContent: msg.senderType === 'ADMIN' ? 'flex-end' : 'flex-start' }}>
                    <div>
                      <p style={{ margin: '0 0 4px', fontSize: 11, color: '#94a3b8', textAlign: msg.senderType === 'ADMIN' ? 'right' : 'left' }}>{msg.senderType === 'ADMIN' ? 'Admin' : 'Customer'}</p>
                      <div style={{ maxWidth: 400, padding: '10px 14px', borderRadius: 12, background: msg.senderType === 'ADMIN' ? '#1e293b' : '#f1f5f9', color: msg.senderType === 'ADMIN' ? '#fff' : '#1e293b', fontSize: 14 }}>
                        {msg.message}
                        <p style={{ margin: '4px 0 0', fontSize: 11, opacity: 0.6 }}>{new Date(msg.timestamp).toLocaleTimeString('en-IN')}</p>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <div style={{ padding: '16px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: 10 }}>
                <input value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  placeholder="Type reply..." style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, fontFamily: 'inherit', outline: 'none', minWidth: 0 }} />
                <button onClick={sendMessage} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#1e293b', color: '#fff', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>Reply</button>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
