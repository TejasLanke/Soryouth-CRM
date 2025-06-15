
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AppLogoIcon } from '@/components/app-logo-icon'; // Changed from SunMedium
import { Zap, FileText, Users } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-16 flex items-center border-b">
        <Link href="/" className="flex items-center justify-center" prefetch={false}>
          <AppLogoIcon className="h-6 w-6" /> {/* Changed from SunMedium */}
          <span className="ml-2 text-xl font-semibold font-headline">Soryouth</span> {/* Changed from Solaris CRM */}
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link
            href="/dashboard"
            className="text-sm font-medium hover:underline underline-offset-4"
            prefetch={false}
          >Login
          </Link>
          <Button asChild>
            <Link href="/dashboard">Get Started</Link>
          </Button>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none font-headline">
                    Power Up Your Renewable Energy Business with Soryouth {/* Changed from Solaris CRM */}
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    Streamline your operations, manage leads effectively, and generate documents with ease. Soryouth is designed for renewable energy companies like yours. {/* Changed from Solaris CRM */}
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button size="lg" asChild>
                    <Link href="/dashboard">
                      Explore Dashboard
                    </Link>
                  </Button>
                </div>
              </div>
              <img
                src="https://placehold.co/600x400.png?text=Renewable+Energy"
                alt="Renewable Energy Installation"
                data-ai-hint="renewable energy" // Updated hint
                width="600"
                height="400"
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last"
              />
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm">
                  Key Features
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">
                  Everything Your Renewable Energy Business Needs {/* Changed "Solar" to "Renewable Energy" */}
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  From lead management to AI-powered document customization, Soryouth provides the tools to help you succeed. {/* Changed from Solaris CRM */}
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3 lg:gap-16 mt-12">
              <div className="grid gap-1 p-4 rounded-lg border bg-card shadow-sm">
                <Users className="h-8 w-8 text-primary" />
                <h3 className="text-lg font-bold font-headline">Lead Management</h3>
                <p className="text-sm text-muted-foreground">
                  Track and manage customer leads through your sales pipeline efficiently.
                </p>
              </div>
              <div className="grid gap-1 p-4 rounded-lg border bg-card shadow-sm">
                <FileText className="h-8 w-8 text-primary" />
                <h3 className="text-lg font-bold font-headline">Quotation & Document Generation</h3>
                <p className="text-sm text-muted-foreground">
                  Create professional quotations and documents from customizable templates.
                </p>
              </div>
              <div className="grid gap-1 p-4 rounded-lg border bg-card shadow-sm">
                <Zap className="h-8 w-8 text-primary" />
                <h3 className="text-lg font-bold font-headline">AI-Powered Customization</h3>
                <p className="text-sm text-muted-foreground">
                  Modify document templates dynamically using our intelligent AI tool.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Soryouth. All rights reserved. {/* Changed from Solaris CRM */}
        </p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Terms of Service
          </Link>
          <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
