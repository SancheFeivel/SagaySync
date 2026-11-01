import React from 'react';
import { useStore } from '../../lib/store';
import StudentHome from '../../lib/screens/StudentHome';
import OfficerHome from '../../lib/screens/OfficerHome';

export default function HomeTab() {
  const { officer } = useStore();
  return officer ? <OfficerHome /> : <StudentHome />;
}
