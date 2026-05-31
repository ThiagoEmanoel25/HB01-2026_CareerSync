import { type ReactNode } from "react";

export default function FeatureCard({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="h-full bg-[#202020] border border-neutral-700 rounded-lg p-6 hover:shadow-md hover:-translate-y-1 transition flex flex-col">
      <div className="flex items-start gap-4">
        <div className="p-2 rounded-md flex items-center justify-center bg-primary-500/10 text-primary-600">
          {icon}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <p className="text-neutral-300 text-sm mt-1">{children}</p>
        </div>
      </div>
    </div>
  );
}
