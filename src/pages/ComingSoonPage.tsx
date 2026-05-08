import type { ComponentType, SVGProps } from "react";

interface ComingSoonPageProps {
  title: string;
  description: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

export function ComingSoonPage({
  title,
  description,
  icon: Icon,
}: ComingSoonPageProps) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <section className="w-full max-w-xl text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center">
          <Icon className="h-20 w-20" />
        </div>
        <p className="mt-6 text-sm font-semibold uppercase tracking-widest text-primary">
          Em breve
        </p>
        <h1 className="mt-3 text-3xl font-bold text-foreground">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </section>
    </div>
  );
}
