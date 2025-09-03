import React from 'react';
import { useAuth } from './AuthProvider';

export default function AuthDebug() {
  const { user, rol, loading, error } = useAuth();

  return (
    <div className="fixed top-4 right-4 bg-black text-white p-4 rounded-lg z-50 max-w-md">
      <h3 className="font-bold mb-2">🔍 Debug AuthProvider</h3>
      <div className="text-xs space-y-1">
        <div><strong>User:</strong> {user ? '✅ Sí' : '❌ No'}</div>
        <div><strong>UID:</strong> {user?.uid || 'N/A'}</div>
        <div><strong>Email:</strong> {user?.email || 'N/A'}</div>
        <div><strong>Rol:</strong> {rol || 'N/A'}</div>
        <div><strong>Loading:</strong> {loading ? '⏳ Sí' : '✅ No'}</div>
        <div><strong>Error:</strong> {error || 'N/A'}</div>
      </div>
      <button 
        onClick={() => window.location.reload()} 
        className="mt-2 bg-blue-600 px-2 py-1 rounded text-xs"
      >
        🔄 Recargar
      </button>
    </div>
  );
}

