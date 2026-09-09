import Link from "next/link";

import { Button } from "@/components/ui/button";
import { GithubIcon } from "@/components/site/github-icon";

const NAV_LINKS = [
  { href: "/explorer", label: "Explorer" },
  { href: "/about", label: "About" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-primary/10 bg-primary text-primary-foreground">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex size-6 items-center justify-center rounded-full bg-accent text-[13px] text-accent-foreground">
            ⚾
          </span>
          <span>
            FinchField<span className="text-accent"> Pitch Lab</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 sm:flex">
          {NAV_LINKS.map((link) => (
            <Button
              key={link.href}
              asChild
              variant="ghost"
              size="sm"
              className="text-primary-foreground/80 hover:bg-white/10 hover:text-primary-foreground"
            >
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="text-primary-foreground/80 hover:bg-white/10 hover:text-primary-foreground"
          >
            <a
              href="https://github.com/brysonpoe25/pitch-release-point-vs-result"
              target="_blank"
              rel="noreferrer"
              aria-label="View source on GitHub"
            >
              <GithubIcon className="size-4" />
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
}
