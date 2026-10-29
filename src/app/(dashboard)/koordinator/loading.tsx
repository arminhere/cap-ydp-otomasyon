export default function CoordinatorLoading() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2 animate-pulse">
      {/* Title Placeholder */}
      <div className="space-y-2">
        <div className="h-7 w-40 bg-slate-200 rounded-lg"></div>
        <div className="h-4 w-64 bg-slate-200/70 rounded-md"></div>
      </div>

      {/* Top 2 Columns Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-sm">
          <div className="h-4 w-32 bg-slate-200 rounded"></div>
          <div className="space-y-3 pt-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100">
                <div className="h-3.5 w-36 bg-slate-200 rounded"></div>
                <div className="h-3.5 w-24 bg-slate-200/80 rounded"></div>
                <div className="h-3.5 w-16 bg-slate-200/60 rounded"></div>
                <div className="h-3.5 w-12 bg-blue-100 rounded"></div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-sm">
          <div className="h-4 w-24 bg-slate-200 rounded"></div>
          <div className="space-y-3 pt-2">
            {[1, 2].map((i) => (
              <div key={i} className="p-3 bg-slate-50 rounded-lg space-y-1.5 border border-slate-100">
                <div className="h-3 w-20 bg-slate-200 rounded"></div>
                <div className="h-3.5 w-44 bg-slate-200/80 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Table Placeholder */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-sm">
        <div className="flex justify-between items-center">
          <div className="h-4 w-40 bg-slate-200 rounded"></div>
          <div className="h-8 w-48 bg-slate-100 rounded-lg"></div>
        </div>
        <div className="space-y-3 pt-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-slate-100">
              <div className="h-4 w-32 bg-slate-200 rounded"></div>
              <div className="h-4 w-28 bg-slate-200/80 rounded"></div>
              <div className="h-4 w-36 bg-slate-200/60 rounded"></div>
              <div className="h-4 w-20 bg-slate-200/60 rounded"></div>
              <div className="h-6 w-16 bg-slate-200 rounded-full"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
