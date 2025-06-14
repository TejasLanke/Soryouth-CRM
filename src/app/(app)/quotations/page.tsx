// This file is intentionally left empty to effectively remove the /quotations route.
// The functionality has been consolidated under /proposals.
// You can manually delete the src/app/(app)/quotations directory.
export default function QuotationsPageRedirect() {
  if (typeof window !== 'undefined') {
    window.location.href = '/proposals';
  }
  return null;
}
