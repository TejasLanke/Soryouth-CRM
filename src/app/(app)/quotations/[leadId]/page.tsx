// This file is intentionally left empty to effectively remove the /quotations/[leadId] route.
// The functionality has been consolidated under /proposals/[clientId].
// You can manually delete the src/app/(app)/quotations directory.
export default function QuotationClientPageRedirect() {
  if (typeof window !== 'undefined') {
    // Attempt to redirect to the proposals equivalent if a leadId (now clientId) was passed.
    // This is a simple redirect and might need more robust handling in a real app.
    const pathSegments = window.location.pathname.split('/');
    const leadId = pathSegments[pathSegments.length -1];
    if (leadId && pathSegments.includes('quotations')) {
         window.location.href = `/proposals/${leadId}`;
    } else {
        window.location.href = '/proposals';
    }
  }
  return null;
}
