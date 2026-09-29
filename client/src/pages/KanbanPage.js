// pages/KanbanPage.js — Drag-and-Drop Pipeline Board

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import api from '../utils/api';
import ApplicationModal from '../components/ApplicationModal';

const COLUMNS = [
  { key: 'Saved',        color: '#64748b', emoji: '🗂️' },
  { key: 'Applied',      color: '#3b82f6', emoji: '📤' },
  { key: 'OA',           color: '#8b5cf6', emoji: '📝' },
  { key: 'Phone Screen', color: '#06b6d4', emoji: '📞' },
  { key: 'Interview',    color: '#f59e0b', emoji: '🎤' },
  { key: 'Offer',        color: '#10b981', emoji: '🏆' },
  { key: 'Rejected',     color: '#ef4444', emoji: '❌' },
];

function formatDate(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

export default function KanbanPage() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  const fetchApps = async () => {
    try {
      const { data } = await api.get('/applications?limit=all');
      setApps(data.data);
    } catch {
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newStage = destination.droppableId;
    const oldApps = [...apps];

    // Optimistic UI update
    setApps((prev) =>
      prev.map((app) => (app._id === draggableId ? { ...app, stage: newStage } : app))
    );

    try {
      await api.patch(`/applications/${draggableId}/stage`, { stage: newStage });
      toast.success(`Moved to ${newStage}`);
    } catch (err) {
      // Revert if error
      setApps(oldApps);
      toast.error('Failed to update stage');
    }
  };

  const handleStageChange = async (appId, newStage) => {
    const oldApps = [...apps];
    setApps((prev) =>
      prev.map((app) => (app._id === appId ? { ...app, stage: newStage } : app))
    );
    try {
      await api.patch(`/applications/${appId}/stage`, { stage: newStage });
      toast.success(`Moved to ${newStage}`);
    } catch {
      setApps(oldApps);
      toast.error('Update failed');
    }
  };

  const handleSave = async (formData) => {
    try {
      if (editTarget) {
        await api.put(`/applications/${editTarget._id}`, formData);
        toast.success('Application updated!');
      } else {
        await api.post('/applications', formData);
        toast.success('Application added!');
      }
      fetchApps();
      setModalOpen(false);
      setEditTarget(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
      throw err;
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this application?')) return;
    try {
      await api.delete(`/applications/${id}`);
      toast.success('Application deleted');
      fetchApps();
    } catch {
      toast.error('Delete failed');
    }
  };

  const grouped = COLUMNS.reduce((acc, col) => {
    acc[col.key] = apps.filter((a) => a.stage === col.key);
    return acc;
  }, {});

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="page-title">Pipeline Board</h1>
          <p className="page-subtitle">
            Drag & drop cards across stages · {apps.length} total applications
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditTarget(null);
            setModalOpen(true);
          }}
        >
          ➕ Add Application
        </button>
      </div>

      {loading ? (
        <div className="loading-wrap">
          <div className="spinner" />
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="kanban-wrap">
            <div className="kanban-board">
              {COLUMNS.map((col) => (
                <Droppable key={col.key} droppableId={col.key}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`kanban-col ${
                        snapshot.isDraggingOver ? 'droppable-active' : ''
                      }`}
                      style={{
                        background: snapshot.isDraggingOver
                          ? 'var(--bg-hover)'
                          : undefined,
                        transition: 'background 0.2s ease',
                      }}
                    >
                      {/* Column header */}
                      <div className="kanban-col-header">
                        <div className="kanban-col-title" style={{ color: col.color }}>
                          {col.emoji} {col.key}
                        </div>
                        <div className="kanban-col-count">{grouped[col.key].length}</div>
                      </div>

                      {/* Cards list */}
                      <div className="kanban-cards" style={{ minHeight: 120 }}>
                        {grouped[col.key].length === 0 && !snapshot.isDraggingOver && (
                          <div
                            style={{
                              textAlign: 'center',
                              padding: '24px 0',
                              color: 'var(--text-muted)',
                              fontSize: 12,
                            }}
                          >
                            Drop applications here
                          </div>
                        )}

                        {grouped[col.key].map((app, index) => (
                          <Draggable
                            key={app._id}
                            draggableId={app._id}
                            index={index}
                          >
                            {(dragProvided, dragSnapshot) => (
                              <div
                                ref={dragProvided.innerRef}
                                {...dragProvided.draggableProps}
                                {...dragProvided.dragHandleProps}
                                className={`kanban-card ${
                                  dragSnapshot.isDragging ? 'is-dragging' : ''
                                }`}
                                style={{
                                  ...dragProvided.draggableProps.style,
                                  cursor: 'grab',
                                  boxShadow: dragSnapshot.isDragging
                                    ? '0 12px 24px rgba(0,0,0,0.5), 0 0 12px var(--accent)'
                                    : undefined,
                                }}
                              >
                                <div
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'flex-start',
                                  }}
                                >
                                  <div className="kc-company">
                                    {app.priority && (
                                      <span
                                        title="Priority"
                                        style={{ color: 'var(--accent)', marginRight: 4 }}
                                      >
                                        ⭐
                                      </span>
                                    )}
                                    {app.company}
                                  </div>
                                  <div style={{ display: 'flex', gap: 4 }}>
                                    <button
                                      className="icon-btn"
                                      style={{ padding: '2px 4px', fontSize: 12 }}
                                      onClick={() => {
                                        setEditTarget(app);
                                        setModalOpen(true);
                                      }}
                                      title="Edit"
                                    >
                                      ✏️
                                    </button>
                                    <button
                                      className="icon-btn"
                                      style={{ padding: '2px 4px', fontSize: 12 }}
                                      onClick={(e) => handleDelete(app._id, e)}
                                      title="Delete"
                                    >
                                      🗑️
                                    </button>
                                  </div>
                                </div>

                                <div className="kc-role">{app.role}</div>

                                {app.location && (
                                  <div
                                    style={{
                                      fontSize: 11,
                                      color: 'var(--text-muted)',
                                      marginTop: 4,
                                    }}
                                  >
                                    📍 {app.location}
                                  </div>
                                )}

                                <div className="kc-meta">
                                  <span className="kc-date">
                                    {formatDate(app.appliedDate) ||
                                      formatDate(app.createdAt)}
                                  </span>
                                  {app.source && (
                                    <span className="source-tag">{app.source}</span>
                                  )}
                                </div>

                                {/* Resume Attachment Tag */}
                                {app.resume?.fileName && (
                                  <div style={{ marginTop: 8 }}>
                                    <a
                                      href={app.resume.fileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 4,
                                        fontSize: 11,
                                        padding: '2px 8px',
                                        background: 'rgba(59, 130, 246, 0.15)',
                                        color: '#60a5fa',
                                        borderRadius: 6,
                                        textDecoration: 'none',
                                      }}
                                      title={`Download ${app.resume.fileName}`}
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      📄 {app.resume.fileName.length > 20 ? app.resume.fileName.slice(0, 18) + '…' : app.resume.fileName}
                                    </a>
                                  </div>
                                )}

                                {/* Quick stage buttons */}
                                <div
                                  style={{
                                    marginTop: 8,
                                    display: 'flex',
                                    gap: 4,
                                    flexWrap: 'wrap',
                                  }}
                                >
                                  {COLUMNS.filter((c) => c.key !== col.key)
                                    .slice(0, 2)
                                    .map((c) => (
                                      <button
                                        key={c.key}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleStageChange(app._id, c.key);
                                        }}
                                        style={{
                                          fontSize: 10,
                                          padding: '2px 6px',
                                          border: `1px solid ${c.color}33`,
                                          borderRadius: 99,
                                          background: `${c.color}11`,
                                          color: c.color,
                                          cursor: 'pointer',
                                          fontFamily: 'var(--font-sans)',
                                          fontWeight: 600,
                                        }}
                                      >
                                        → {c.key}
                                      </button>
                                    ))}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    </div>
                  )}
                </Droppable>
              ))}
            </div>
          </div>
        </DragDropContext>
      )}

      <ApplicationModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditTarget(null);
        }}
        onSave={handleSave}
        initial={editTarget}
      />
    </div>
  );
}