'use client';
import { useContext } from 'react';
import { UserDataContext, type UserDataContextType } from './user-provider';
import type { UserProfile } from './user-provider';


export function useUserData(): UserDataContextType {
  return useContext(UserDataContext);
}

export type { UserProfile };
