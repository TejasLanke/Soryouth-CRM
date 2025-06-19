
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { AppLogoIcon } from '@/components/app-logo-icon';
import { APP_NAME } from '@/lib/constants';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-[hsl(var(--background))] to-[hsl(var(--primary)/0.1)] dark:from-[hsl(var(--background))] dark:to-[hsl(var(--primary)/0.2)]">
      <header className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-primary">
            <AppLogoIcon className="h-8 w-8" />
            <span>{APP_NAME}</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Get Started <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-grow">
        <section className="container mx-auto flex flex-col items-center justify-center px-4 py-16 text-center sm:px-6 lg:px-8 lg:py-24">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
            <span className="block font-headline">Power Up Your Solar Business with</span>
            <span className="block text-primary font-headline">{APP_NAME}</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl md:text-2xl">
            The all-in-one CRM and proposal generation tool designed for renewable energy professionals in India. Streamline your workflow, from lead to installation.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Button size="lg" asChild className="shadow-lg hover:shadow-xl transition-shadow">
              <Link href="/signup">
                Explore Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>

        <section className="bg-card py-16 lg:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="mb-12 text-center text-3xl font-bold tracking-tight text-card-foreground sm:text-4xl font-headline">Key Features</h2>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {[
                { title: 'Lead Management', description: 'Track leads effectively, from initial contact to conversion.', icon: 'UsersRound' },
                { title: 'Proposal Generation', description: 'Create detailed, accurate proposals tailored to client needs.', icon: 'FileText' },
                { title: 'Document Organization', description: 'Keep all project-related documents in one accessible place.', icon: 'Files' },
                { title: 'AI Customization', description: 'Leverage AI to quickly customize document templates.', icon: 'WandSparkles' },
                { title: 'Communication Hub', description: 'Log all client interactions for a complete history.', icon: 'MessageSquareText' },
                { title: 'Batch Operations', description: 'Generate multiple proposals or documents simultaneously.', icon: 'Rows' },
              ].map((feature) => (
                <div key={feature.title} className="rounded-lg border bg-background p-6 shadow-sm">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    {feature.icon === 'UsersRound' && <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 21a8 8 0 0 0-16 0"/><circle cx="10" cy="8" r="4"/><path d="M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-7 0"/></svg>}
                    {feature.icon === 'FileText' && <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>}
                    {feature.icon === 'Files' && <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15.5 2H8.6c-.4 0-.8.2-1.1.5-.3.3-.5.7-.5 1.1V14c0 .8.7 1.5 1.5 1.5H20V7l-5.5-5z"/><path d="M15 2v5h5"/><path d="M4.5 12.5A2.5 2.5 0 0 1 7 10h8a2 2 0 0 1 2 2v7.5a2.5 2.5 0 0 1-2.5 2.5h-7A2.5 2.5 0 0 1 5 21.5v-9Z"/></svg>}
                    {feature.icon === 'WandSparkles' && <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 3 2.06 2.06a1 1 0 0 0 1.42 0L12 2l-1.94 1.94a1 1 0 0 0 0 1.42L12 7.42 13.94 5.5a1 1 0 0 0 0-1.42L12 2l1.94-1.94a1 1 0 0 0-1.42 0L10.42 2l-2.06 2.06a1 1 0 0 0 0 1.42L10.5 7.5 12 9l1.5-1.5.08-.07a1 1 0 0 0 0-1.42L11.5 4.08ZM3 5l2.06 2.06a1 1 0 0 0 1.42 0L10 4l-1.94 1.94a1 1 0 0 0 0 1.42L10 9.42 11.94 7.5a1 1 0 0 0 0-1.42L10 4l1.94-1.94a1 1 0 0 0-1.42 0L8.42 4l-2.06 2.06a1 1 0 0 0 0 1.42L8.5 9.5 10 11l1.5-1.5.08-.07a1 1 0 0 0 0-1.42L9.5 6.08Z"/><path d="M15 5V3"/><path d="M17.8 6.2 19 5"/><path d="M20 9h2"/><path d="M17.8 11.8 19 13"/><path d="M15 13v2"/><path d="M12.2 11.8 11 13"/><path d="M10 9H8"/><path d="M12.2 6.2 11 5"/></svg>}
                    {feature.icon === 'MessageSquareText' && <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M13 8H7"/><path d="M17 12H7"/></svg>}
                    {feature.icon === 'Rows' && <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10H3"/><path d="M21 6H3"/><path d="M21 14H3"/><path d="M21 18H3"/></svg>}
                  </div>
                  <h3 className="mb-2 text-xl font-semibold text-card-foreground font-headline">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

         <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl font-headline">
                Ready to Elevate Your Renewable Energy Business?
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Join {APP_NAME} today and experience a smarter way to manage your operations.
              </p>
              <div className="mt-8">
                <Button size="lg" asChild className="shadow-md">
                  <Link href="/signup">
                    Get Started for Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t bg-card">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
             <AppLogoIcon className="h-6 w-6" />
            <span className="font-semibold text-card-foreground">{APP_NAME}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link href="#" className="text-sm text-muted-foreground hover:text-primary">Privacy Policy</Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-primary">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
