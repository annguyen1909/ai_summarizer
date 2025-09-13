"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";

export function UserSync() {
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (isLoaded && user) {
      // Sync user data to Supabase
      const syncUser = async () => {
        try {
          const userData = {
            email: user.primaryEmailAddress?.emailAddress,
            firstName: user.firstName,
            lastName: user.lastName,
            imageUrl: user.imageUrl,
          };

          console.log('Syncing user data:', userData);

          const response = await fetch('/api/user/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('Failed to sync user data:', errorText);
          } else {
            const result = await response.json();
            console.log('User sync successful:', result);
          }
        } catch (error) {
          console.error('Error syncing user:', error);
        }
      };

      syncUser();
    }
  }, [user, isLoaded]);

  return null; // This component doesn't render anything
}
