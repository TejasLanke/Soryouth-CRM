// This file implements a server-side redirect to /proposals.
// The /quotations route functionality has been consolidated under /proposals.

import { redirect } from 'next/navigation';

export default function QuotationsPageRedirect() {
  redirect('/proposals');
  // This component will not render anything as redirect() throws an error and stops execution.
}
