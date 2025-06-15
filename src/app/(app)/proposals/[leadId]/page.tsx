'use client';

export default function OldLeadProposalsRedirectPage() {
  if (typeof window !== 'undefined') {
    window.location.replace('/proposals');
  }
  return null;
}
