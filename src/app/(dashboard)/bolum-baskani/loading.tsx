export default function DepartmentHeadLoading() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2 animate-pulse">
      {/* Title Placeholder */}
      <div className="space-y-2">
        <div className="h-7 w-40 bg-slate-200 rounded-lg"></div>
        <div className="h-4 w-80 bg-slate-200/70 rounded-md"></div>
      </div>

      {/* 4 Summary Stat Boxes Placeholder */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
            <div className="h-3.5 w-24 bg-slate-200 rounded"></div>
            <div className="h-7 w-12 bg-slate-200 rounded"></div>
          </div>
        ))}
      </div>

      {/* Section 1 Placeholder */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-sm">
        <div className="h-4 w-36 bg-slate-200 rounded"></div>
        <div className="space-y-3 pt-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between py-2.5 border-b border-slate-100">
              <div className="h-4 w-32 bg-slate-200 rounded"></div>
              <div className="h-4 w-24 bg-slate-200/80 rounded"></div>
              <div className="h-5 w-20 bg-slate-200 rounded"></div>
              <div className="h-5 w-16 bg-slate-200 rounded"></div>
              <div className="h-4 w-40 bg-slate-200/60 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
