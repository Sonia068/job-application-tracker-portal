// pages/ApplicationsPage.js — Full CRUD table with Server-side Pagination, Filters & File Attachments

import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import ApplicationModal from '../components/ApplicationModal';

const STAGES = ['All', 'Saved', 'Applied', 'OA', 'Phone Screen', 'Interview', 'Offer', 'Rejected', 'Withdrawn', 'Accepted'];
const SOURCES = ['All', 'LinkedIn', 'Indeed', 'Company Site', 'Referral', 'Naukri', 'Internshala', 'Other'];

function StageBadge({ stage }) {
  return <span className={`stage-badge stage-${stage.replace(' ', '')}`}>{stage}</span>;
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
}

export default function ApplicationsPage() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('All');
  const [sourceFilter, setSourceFilter] = useState('All');

  // Pagination states
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  const fetchApps = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
      };
      if (stageFilter !== 'All') params.stage = stageFilter;
      if (sourceFilter !== 'All') params.source = sourceFilter;
      if (search.trim()) params.search = search.trim();

      const { data } = await api.get('/applications', { params });
      setApps(data.data);
      setTotalCount(data.total || data.count || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  }, [page, limit, stageFilter, sourceFilter, search]);

  useEffect(() => {
    const timer = setTimeout(fetchApps, 300); // debounce search
    return () => clearTimeout(timer);
  }, [fetchApps]);

  // Reset to page 1 on filter or search change
  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value);
    setPage(1);
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleSave = async (formData, fileToUpload, shouldRemoveResume) => {
    try {
      let savedApp;
      if (editTarget) {
        const { data } = await api.put(`/applications/${editTarget._id}`, formData);
        savedApp = data.data;

        if (shouldRemoveResume) {
          await api.delete(`/applications/${editTarget._id}/resume`);
        }
        toast.success('Application updated!');
      } else {
        const { data } = await api.post('/applications', formData);
        savedApp = data.data;
        toast.success('Application added! 🎯');
      }

      // Handle resume file upload if provided
      if (fileToUpload && savedApp?._id) {
        const fileData = new FormData();
        fileData.append('resume', fileToUpload);
        await api.post(`/applications/${savedApp._id}/resume`, fileData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Resume uploaded!');
      }

      fetchApps();
      setEditTarget(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
      throw err;
    }
  };

  const handleEdit = (app) => {
    setEditTarget(app);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this application?')) return;
    try {
      await api.delete(`/applications/${id}`);
      toast.success('Application deleted');
      // If we just deleted the last item on the page, go to prev page
      if (apps.length === 1 && page > 1) {
        setPage((p) => p - 1);
      } else {
        fetchApps();
      }
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleStageChange = async (app, newStage) => {
    try {
      await api.patch(`/applications/${app._id}/stage`, { stage: newStage });
      toast.success(`Moved to ${newStage}`);
      fetchApps();
    } catch {
      toast.error('Update failed');
    }
  };

  const openAdd = () => {
    setEditTarget(null);
    setModalOpen(true);
  };

  const startRecord = totalCount === 0 ? 0 : (page - 1) * limit + 1;
  const endRecord = Math.min(page * limit, totalCount);

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="page-title">Applications</h1>
          <p className="page-subtitle">
            {totalCount} total application{totalCount !== 1 ? 's' : ''} found
          </p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          ➕ Add Application
        </button>
      </div>

      {/* Table */}
      <div className="table-container">
        <div className="table-wrap">
          {/* Toolbar */}
          <div className="table-toolbar">
            <div className="search-input-wrap">
              <span className="search-icon">🔍</span>
              <input
                className="search-input"
                placeholder="Search company, role, location…"
                value={search}
                onChange={handleSearchChange}
              />
            </div>
            <select
              className="filter-select"
              value={stageFilter}
              onChange={handleFilterChange(setStageFilter)}
            >
              {STAGES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <select
              className="filter-select"
              value={sourceFilter}
              onChange={handleFilterChange(setSourceFilter)}
            >
              {SOURCES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            {(stageFilter !== 'All' || sourceFilter !== 'All' || search) && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setStageFilter('All');
                  setSourceFilter('All');
                  setSearch('');
                  setPage(1);
                }}
              >
                ✕ Clear
              </button>
            )}
          </div>

          {/* Table body */}
          {loading ? (
            <div className="loading-wrap">
              <div className="spinner" />
            </div>
          ) : apps.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <div className="empty-text">No applications found</div>
              <div className="empty-subtext">
                Try adjusting filters or add your first application.
              </div>
              <button
                className="btn btn-primary"
                style={{ marginTop: 16 }}
                onClick={openAdd}
              >
                Add Application
              </button>
            </div>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Company / Role</th>
                      <th>Stage</th>
                      <th>Source</th>
                      <th>Resume</th>
                      <th>Applied</th>
                      <th>Interview</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apps.map((app) => (
                      <tr key={app._id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {app.priority && (
                              <span
                                title="Priority"
                                style={{ color: 'var(--accent)', fontSize: 14 }}
                              >
                                ⭐
                              </span>
                            )}
                            <div>
                              <div className="company-cell">{app.company}</div>
                              <div className="role-cell">
                                {app.role}
                                {app.location ? ` · ${app.location}` : ''}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <select
                              value={app.stage}
                              onChange={(e) => handleStageChange(app, e.target.value)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'inherit',
                                cursor: 'pointer',
                                fontFamily: 'var(--font-sans)',
                                fontSize: 14,
                              }}
                            >
                              {STAGES.slice(1).map((s) => (
                                <option
                                  key={s}
                                  style={{ background: 'var(--bg-card)' }}
                                >
                                  {s}
                                </option>
                              ))}
                            </select>
                            <StageBadge stage={app.stage} />
                          </div>
                        </td>
                        <td>
                          <span className="source-tag">{app.source || '—'}</span>
                        </td>
                        <td>
                          {app.resume?.fileName ? (
                            <a
                              href={app.resume.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-ghost btn-sm"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                textDecoration: 'none',
                                color: '#60a5fa',
                                fontSize: 12,
                              }}
                              title={app.resume.fileName}
                            >
                              📄 Doc
                            </a>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>
                          )}
                        </td>
                        <td>
                          <span className="date-cell">
                            {formatDate(app.appliedDate)}
                          </span>
                        </td>
                        <td>
                          <span className="date-cell">
                            {formatDate(app.interviewDate)}
                          </span>
                        </td>
                        <td>
                          <div className="action-btns">
                            <button
                              className="icon-btn icon-btn-edit"
                              onClick={() => handleEdit(app)}
                              title="Edit"
                            >
                              ✏️
                            </button>
                            <button
                              className="icon-btn icon-btn-delete"
                              onClick={() => handleDelete(app._id)}
                              title="Delete"
                            >
                              🗑️
                            </button>
                            {app.jobUrl && (
                              <a
                                href={app.jobUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <button
                                  className="icon-btn"
                                  style={{
                                    background: 'var(--bg-elevated)',
                                    color: 'var(--text-secondary)',
                                  }}
                                  title="Open JD"
                                >
                                  🔗
                                </button>
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 20px',
                  borderTop: '1px solid var(--border)',
                  flexWrap: 'wrap',
                  gap: 12,
                }}
              >
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  Showing <strong style={{ color: 'var(--text-primary)' }}>{startRecord}</strong> to{' '}
                  <strong style={{ color: 'var(--text-primary)' }}>{endRecord}</strong> of{' '}
                  <strong style={{ color: 'var(--text-primary)' }}>{totalCount}</strong> applications
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
                    <span>Per page:</span>
                    <select
                      value={limit}
                      onChange={(e) => {
                        setLimit(Number(e.target.value));
                        setPage(1);
                      }}
                      className="filter-select"
                      style={{ padding: '4px 8px', fontSize: 13 }}
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: 4 }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      ◀ Prev
                    </button>
                    <span
                      style={{
                        padding: '4px 10px',
                        fontSize: 13,
                        display: 'flex',
                        alignItems: 'center',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      Page {page} of {totalPages}
                    </span>
                    <button
                      className="btn btn-secondary btn-sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    >
                      Next ▶
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

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