import React, { useState, useEffect } from 'react';
import { User } from '../../types/index.js';
import { Card } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Input } from '../../components/ui/Input.js';
import { Modal } from '../../components/ui/Modal.js';
import { Badge } from '../../components/ui/Badge.js';
import { formatDateTime } from '../../utils/formatters.js';
import { Users, UserPlus, Edit2, Trash2, ShieldCheck, UserCheck, Key } from 'lucide-react';

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Form modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'kasir'>('kasir');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (data.success) {
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenCreateModal = () => {
    setIsEditMode(false);
    setEditingUserId(null);
    setName('');
    setUsername('');
    setPassword('');
    setRole('kasir');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: User) => {
    setIsEditMode(true);
    setEditingUserId(user.user_id);
    setName(user.name);
    setUsername(user.username);
    setPassword(''); // leave blank to keep unchanged
    setRole(user.role);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim() || !username.trim()) {
      setFormError('Nama dan username wajib diisi');
      return;
    }

    if (!isEditMode && !password.trim()) {
      setFormError('Password wajib diisi untuk pengguna baru');
      return;
    }

    try {
      setSubmitting(true);
      const url = isEditMode ? `/api/admin/users/${editingUserId}` : '/api/admin/users';
      const method = isEditMode ? 'PUT' : 'POST';

      const payload: any = {
        name: name.trim(),
        username: username.trim(),
        role
      };
      if (password.trim()) {
        payload.password = password;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        setIsModalOpen(false);
        await fetchUsers();
      } else {
        setFormError(data.error || 'Gagal menyimpan pengguna');
      }
    } catch (err: any) {
      setFormError(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!userToDelete) return;
    try {
      setSubmitting(true);
      const res = await fetch(`/api/admin/users/${userToDelete.user_id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setIsDeleteModalOpen(false);
        setUserToDelete(null);
        await fetchUsers();
      } else {
        alert(data.error || 'Gagal menghapus pengguna');
      }
    } catch (err) {
      alert('Gagal menghapus pengguna');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-5xl">
      {/* Top action header */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-2xs">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Kelola Akun Kasir & Administrator</h3>
          <p className="text-[11px] text-slate-500">Atur hak akses login untuk staf kasir dan pemilik cafe</p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={handleOpenCreateModal}
          className="flex items-center justify-center gap-1.5 text-xs w-full sm:w-auto"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Tambah Pengguna Baru</span>
        </Button>
      </div>

      {/* Users Table */}
      <Card className="p-0 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[540px]">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Nama Lengkap</th>
                <th className="py-3 px-4">Username</th>
                <th className="py-3 px-4">Peran (Role)</th>
                <th className="py-3 px-4">Tanggal Dibuat</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(user => (
                <tr key={user.user_id} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                    {user.role === 'admin' ? (
                      <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                    ) : (
                      <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    )}
                    <span className="truncate">{user.name}</span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600">{user.username}</td>
                  <td className="py-3 px-4">
                    <Badge variant={user.role === 'admin' ? 'navy' : 'success'} size="sm">
                      {user.role === 'admin' ? 'Administrator' : 'Kasir Staf'}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    {user.created_at ? formatDateTime(user.created_at) : '-'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <button
                        onClick={() => handleOpenEditModal(user)}
                        className="p-1.5 text-slate-500 hover:text-[#1A3A5C] hover:bg-slate-100 rounded-md transition-colors"
                        title="Ubah Pengguna"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {/* Do not allow deleting current user or user_id 1 easily */}
                      {user.user_id !== 1 && (
                        <button
                          onClick={() => {
                            setUserToDelete(user);
                            setIsDeleteModalOpen(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Hapus Pengguna"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* User Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditMode ? 'Ubah Informasi Pengguna' : 'Tambah Akun Pengguna Baru'}
        subtitle="Kelola username, password, dan otorisasi peran pengguna"
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg">
              {formError}
            </div>
          )}

          <Input
            label="Nama Lengkap"
            placeholder="misal: Budi Santoso"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />

          <Input
            label="Username Login"
            placeholder="misal: kasir2"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Peran Akun
            </label>
            <select
              value={role}
              onChange={e => setRole(e.target.value as 'admin' | 'kasir')}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A3A5C]"
            >
              <option value="kasir">Kasir (Akses POS Tablet)</option>
              <option value="admin">Administrator (Akses Penuh Portal Admin & POS)</option>
            </select>
          </div>

          <Input
            label={isEditMode ? 'Password Baru (Kosongkan jika tidak diubah)' : 'Password'}
            type="password"
            placeholder="Minimal 4 karakter"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required={!isEditMode}
          />

          <div className="flex space-x-3 pt-3">
            <Button
              type="button"
              variant="outline"
              size="md"
              fullWidth
              onClick={() => setIsModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              fullWidth
              disabled={submitting}
            >
              {submitting ? 'Menyimpan...' : isEditMode ? 'Perbarui Akun' : 'Buat Akun'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title="Konfirmasi Hapus Pengguna"
          subtitle={`Apakah Anda yakin ingin menghapus akun "${userToDelete.name}"?`}
          maxWidth="sm"
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-600">
              Pengguna ini tidak akan dapat login lagi ke sistem kasir atau admin.
            </p>
            <div className="flex space-x-3 pt-2">
              <Button
                variant="outline"
                size="md"
                fullWidth
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Batal
              </Button>
              <Button
                variant="danger"
                size="md"
                fullWidth
                disabled={submitting}
                onClick={handleDelete}
              >
                {submitting ? 'Menghapus...' : 'Ya, Hapus Akun'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
