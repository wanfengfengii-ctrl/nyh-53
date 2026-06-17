import { Component } from 'solid-js';
import type { UserRole } from '@/types/pottery';
import { User, GraduationCap, Users } from 'lucide-solid';

interface RoleSwitcherProps {
  currentRole: UserRole;
  currentName: string;
  onSwitch: (role: UserRole) => void;
}

export const RoleSwitcher: Component<RoleSwitcherProps> = (props) => {
  return (
    <div class="card">
      <div class="flex items-center gap-2 mb-3">
        <Users class="w-4 h-4 text-pottery-500" />
        <h4 class="font-medium text-pottery-800">角色切换</h4>
      </div>
      <div class="flex items-center gap-2 mb-3 p-2 bg-pottery-50 rounded-lg">
        <div class="w-8 h-8 rounded-full bg-pottery-500 text-white flex items-center justify-center">
          <User class="w-4 h-4" />
        </div>
        <div>
          <div class="text-sm font-medium text-pottery-800">{props.currentName}</div>
          <div class="text-xs text-pottery-500">
            {props.currentRole === 'teacher' ? '老师' : '学员'}
          </div>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <button
          onClick={() => props.onSwitch('teacher')}
          class={`flex flex-col items-center gap-1 py-3 px-2 rounded-lg border-2 transition-all duration-200 ${
            props.currentRole === 'teacher'
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-pottery-200 bg-white text-pottery-600 hover:border-pottery-300'
          }`}
        >
          <GraduationCap class="w-6 h-6" />
          <span class="text-sm font-medium">老师</span>
        </button>
        <button
          onClick={() => props.onSwitch('student')}
          class={`flex flex-col items-center gap-1 py-3 px-2 rounded-lg border-2 transition-all duration-200 ${
            props.currentRole === 'student'
              ? 'border-green-500 bg-green-50 text-green-700'
              : 'border-pottery-200 bg-white text-pottery-600 hover:border-pottery-300'
          }`}
        >
          <User class="w-6 h-6" />
          <span class="text-sm font-medium">学员</span>
        </button>
      </div>
    </div>
  );
};
