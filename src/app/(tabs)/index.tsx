import React from 'react';
import { useStore } from '../../lib/store';
import StudentHome from '../../lib/screens/StudentHome';
import OfficerHome from '../../lib/screens/OfficerHome';
import AdminHome from '../../lib/screens/AdminHome';

export default function HomeTab() {
  const { officer, admin } = useStore();
  if (admin) return <AdminHome />;
  return officer ? <OfficerHome /> : <StudentHome />;
}
