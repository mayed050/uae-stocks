import { Inbox } from "lucide-react";

export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="grid place-items-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center">
      <Inbox className="mb-3 text-slate-400" size={30} aria-hidden />
      <h3 className="font-bold text-slate-800">{title}</h3>
      <p className="mt-1 max-w-xl text-sm leading-6 text-slate-500">{message}</p>
    </div>
  );
}
