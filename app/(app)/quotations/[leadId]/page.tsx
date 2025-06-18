// This file implements a server-side redirect from /quotations/[leadId] to /proposals/[leadId].
// The /quotations route functionality has been consolidated under /proposals.

import { redirect } from 'next/navigation';

interface QuotationClientPageProps {
  params: {
    leadId: string;
  };
}

export default function QuotationClientPageRedirect({ params }: QuotationClientPageProps) {
  const { leadId } = params;

  if (leadId) {
    redirect(`/proposals/${leadId}`);
  } else {
    // Fallback redirect if leadId is somehow not present, though unlikely for this route structure
    redirect('/proposals');
  }
  // This component will not render anything as redirect() throws an error and stops execution.
}
