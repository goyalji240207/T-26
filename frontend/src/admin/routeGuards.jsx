import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { auth } from '../firebase';

const ADMIN_EMAIL = 'vibhors@techkriti.org';

function useAuthUser() {
  const [user, setUser] = useState(undefined); // undefined = loading, null = logged out
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => setUser(u));
    return () => unsubscribe();
  }, []);
  return user;
}

export function RequireAdminAuth() {
  const user = useAuthUser();
  if (user === undefined) {
    return <div style={{ padding: 16 }}>Checking admin authentication…</div>;
  }
  if (!user || user.email !== ADMIN_EMAIL) {
    return <Navigate to="/admin/login" replace />;
  }
  return <Outlet />;
}

export function RedirectIfAdminAuth() {
  const user = useAuthUser();
  if (user === undefined) {
    return <div style={{ padding: 16 }}>Checking admin authentication…</div>;
  }
  if (user && user.email === ADMIN_EMAIL) {
    return <Navigate to="/admin" replace />;
  }
  return <Outlet />;
}