import { Display } from '../display/Display';

export function Preview() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <h1 className="text-2xl font-semibold text-slate-900">Esikatselu</h1>
        <p className="text-sm text-slate-500">
          Tämä on reaaliaikainen esikatselu siitä, miltä InfoTV näyttää juuri nyt.
        </p>
      </div>
      <div className="flex-1 overflow-hidden bg-slate-100 p-6">
        <div className="mx-auto h-full max-w-6xl overflow-hidden rounded-xl border border-slate-300 shadow-2xl relative">
          {/* We use an iframe to ensure it renders exactly as it would on a separate screen, 
              isolated from the admin CSS and layout constraints if any, though rendering the component 
              directly is also an option. Using iframe is safer for responsive scaling. */}
          <iframe 
            src="/display" 
            className="h-full w-full border-0"
            title="InfoTV Preview"
          />
        </div>
      </div>
    </div>
  );
}
