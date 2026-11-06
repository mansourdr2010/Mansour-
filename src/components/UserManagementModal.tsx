import React, { useState } from 'react';
import { X, CheckCircle, XCircle, Shield, Trash2, UserPlus, Users, Clock, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AppUser } from '../types/oncology';

export const UserManagementModal: React.FC = () => {
  const {
    isUserManagementOpen,
    setIsUserManagementOpen,
    users,
    approveUser,
    rejectUser,
    deleteUser,
    toggleUserRole,
    currentUser,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'pending' | 'active'>('pending');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (!isUserManagementOpen) return null;

  const pendingUsers = users.filter((u) => u.status === 'pending');
  const activeUsers = users.filter((u) => u.status === 'approved');
  const rejectedUsers = users.filter((u) => u.status === 'rejected');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-teal-800 to-teal-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Shield className="w-5 h-5 text-teal-300" />
            </div>
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">
                <span>User Access & Role Approvals</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-teal-600 text-teal-100 font-medium">
                  Admin: {currentUser?.firstName} ({currentUser?.employeeNumber})
                </span>
              </h3>
              <p className="text-xs text-teal-200">
                Manage clinical colleagues, pending registrations, and role permissions
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsUserManagementOpen(false)}
            className="p-1 rounded-lg text-teal-300 hover:text-white hover:bg-teal-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 text-xs font-bold gap-4">
          <button
            onClick={() => setActiveTab('pending')}
            className={`pb-3 border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'pending'
                ? 'border-teal-700 text-teal-900 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Pending Approvals</span>
            {pendingUsers.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500 text-white font-extrabold">
                {pendingUsers.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('active')}
            className={`pb-3 border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'active'
                ? 'border-teal-700 text-teal-900 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Active Personnel ({activeUsers.length})</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
          {activeTab === 'pending' && (
            <div>
              {pendingUsers.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <UserPlus className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-1" />
                  <p className="font-semibold text-slate-600 text-sm">No Pending Access Requests</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                    When new physicians or nurses register with their Employee Number and Email, their requests will appear here for your review and approval.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-slate-600 font-medium">
                    The following colleagues have registered and are awaiting your admin approval:
                  </p>
                  {pendingUsers.map((user) => (
                    <div
                      key={user.id}
                      className="p-3.5 bg-amber-50/70 border border-amber-300 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <strong className="text-sm text-slate-900 font-bold">
                            {user.firstName} {user.lastName}
                          </strong>
                          <span className="font-mono text-xs bg-white text-slate-800 px-2 py-0.5 rounded border border-slate-300 font-bold">
                            Emp #{user.employeeNumber}
                          </span>
                          <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded font-bold uppercase">
                            Pending Review
                          </span>
                        </div>
                        <div className="text-slate-600 text-xs flex flex-wrap items-center gap-2">
                          <span>Email: <strong>{user.email}</strong></span>
                          <span>·</span>
                          <span className="text-slate-500 font-mono">Registered: {user.createdAt}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => approveUser(user.id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Approve Access</span>
                        </button>
                        <button
                          onClick={() => rejectUser(user.id)}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Rejected Requests Section */}
              {rejectedUsers.length > 0 && (
                <div className="pt-6 border-t border-slate-200 mt-6 space-y-2">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Rejected Requests ({rejectedUsers.length})
                  </h4>
                  <div className="space-y-2">
                    {rejectedUsers.map((u) => (
                      <div
                        key={u.id}
                        className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs text-slate-600"
                      >
                        <div>
                          <span className="font-semibold text-slate-800">{u.firstName} {u.lastName}</span>
                          <span className="font-mono text-slate-500 ml-2">#{u.employeeNumber}</span>
                          <span className="text-slate-400 ml-2">({u.email})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => approveUser(u.id)}
                            className="text-xs text-teal-700 hover:text-teal-900 font-bold"
                          >
                            Re-approve
                          </button>
                          <button
                            onClick={() => deleteUser(u.id)}
                            className="text-xs text-rose-600 hover:text-rose-800 font-bold"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'active' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-600 font-medium">
                Approved clinical users currently authorized to access the Tracker:
              </p>

              {activeUsers.map((user) => {
                const isSelf = user.id === currentUser?.id;
                return (
                  <div
                    key={user.id}
                    className="p-3 bg-white border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <strong className="text-sm text-slate-900 font-bold">
                          {user.firstName} {user.lastName}
                        </strong>
                        <span className="font-mono text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-300 font-semibold">
                          Emp #{user.employeeNumber}
                        </span>
                        <span
                          className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded ${
                            user.role === 'admin'
                              ? 'bg-purple-100 text-purple-900 border border-purple-300'
                              : 'bg-teal-100 text-teal-900 border border-teal-300'
                          }`}
                        >
                          {user.role === 'admin' ? 'Admin' : 'Physician'}
                        </span>
                        {isSelf && (
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">
                            You
                          </span>
                        )}
                      </div>
                      <div className="text-slate-500 text-xs flex items-center gap-2">
                        <span>{user.email}</span>
                        <span>·</span>
                        <span>Approved by: {user.approvedBy || 'Admin'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {!isSelf && (
                        <>
                          <button
                            onClick={() => toggleUserRole(user.id)}
                            className="px-2.5 py-1 text-xs border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg font-semibold transition-colors cursor-pointer"
                            title="Toggle between Admin and Physician role"
                          >
                            Make {user.role === 'admin' ? 'Physician' : 'Admin'}
                          </button>

                          {confirmDeleteId === user.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  deleteUser(user.id);
                                  setConfirmDeleteId(null);
                                }}
                                className="px-2.5 py-1 bg-rose-600 text-white rounded text-xs font-bold hover:bg-rose-700"
                              >
                                Confirm Delete
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-2 py-1 text-slate-600 text-xs hover:bg-slate-100 rounded"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteId(user.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete user"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Admin verification protocol active</span>
          <button
            onClick={() => setIsUserManagementOpen(false)}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
