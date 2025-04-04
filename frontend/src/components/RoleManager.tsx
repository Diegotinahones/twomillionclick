import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './RoleManager.css';
import { useTranslation } from 'react-i18next';

interface UserData {
  email: string;
  username: string;
  role: string;
}

const RoleManager: React.FC = () => {
  const { token, role } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [users, setUsers] = useState<UserData[]>([]);
  const [selectedUserEmail, setSelectedUserEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (role !== 'admin') {
      navigate('/');
    }
  }, [role, navigate]);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!token) return;
      try {
        const res = await fetch('/api/admin/users', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (!res.ok) {
          console.error('Error al obtener la lista de usuarios');
          return;
        }
        const data = await res.json();
        setUsers(data.users);
      } catch (error) {
        console.error('Error al cargar usuarios:', error);
      }
    };
    fetchUsers();
  }, [token]);

  useEffect(() => {
    const user = users.find((u) => u.email === selectedUserEmail);
    if (user) {
      setSelectedRole(user.role);
    } else {
      setSelectedRole('');
    }
  }, [selectedUserEmail, users]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserEmail || !selectedRole) return;

    try {
      const res = await fetch('/api/admin/updateRole', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ email: selectedUserEmail, role: selectedRole })
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(t('roleManager.messageSuccess'));
        setTimeout(() => {
          navigate('/profile');
        }, 1000);
      } else {
        setMessage(data.message || t('roleManager.errorGeneric'));
      }
    } catch (error) {
      console.error('Error al actualizar rol:', error);
      setMessage(t('roleManager.errorGeneric'));
    }
  };

  return (
    <div className="role-manager-container">
      <h1 tabIndex={-1}>{t('roleManager.title')}</h1>
      {message && (
        <div className="role-message" role="alert" aria-live="assertive">
          {message}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <label htmlFor="userSelect">{t('roleManager.userSelectLabel')}</label>
        <select
          id="userSelect"
          value={selectedUserEmail}
          onChange={(e) => setSelectedUserEmail(e.target.value)}
          required
        >
          <option value="">{t('roleManager.placeholderSelect')}</option>
          {users.map((user) => (
            <option key={user.email} value={user.email}>
              {user.username} - {user.email} ({user.role})
            </option>
          ))}
        </select>

        {selectedUserEmail && (
          <div className="roles-options">
            <label>
              <input
                type="radio"
                name="role"
                value="admin"
                checked={selectedRole === 'admin'}
                onChange={() => setSelectedRole('admin')}
              />
              {t('roleManager.admin')}
            </label>
            <label>
              <input
                type="radio"
                name="role"
                value="superuser"
                checked={selectedRole === 'superuser'}
                onChange={() => setSelectedRole('superuser')}
              />
              {t('roleManager.superuser')}
            </label>
            <label>
              <input
                type="radio"
                name="role"
                value="standard"
                checked={selectedRole === 'standard'}
                onChange={() => setSelectedRole('standard')}
              />
              {t('roleManager.standard')}
            </label>
          </div>
        )}

        <div className="actions">
          <button type="submit">{t('roleManager.save')}</button>
          <button type="button" onClick={() => navigate('/profile')}>
            {t('roleManager.cancel')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RoleManager;
