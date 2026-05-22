import React from "react";
import { SignedIn, SignedOut, RedirectToSignIn, UserProfile, useUser } from "@clerk/clerk-react";
import ClerkErrorBoundary from "./components/ClerkErrorBoundary";

export default function ProfilePage() {
  const { isLoaded } = useUser();

  if (!isLoaded) return null;

  return (
    <>
      <SignedIn>
        <ClerkErrorBoundary
          fallback={
            <div style={{ padding: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>Profile unavailable</h2>
              <p style={{ marginTop: 8, color: "#4b5563" }}>
                Something went wrong rendering the Clerk profile UI. Try refreshing, or sign out and sign in again.
              </p>
            </div>
          }
        >
          <div style={{ padding: 16 }}>
            <UserProfile routing="virtual" />
          </div>
        </ClerkErrorBoundary>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}
