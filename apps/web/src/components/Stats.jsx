import { Briefcase, Users, ShieldCheck, Clock } from "lucide-react";

const stats = [
  { icon: Briefcase, value: "Custom", label: "Software Solutions" },
  { icon: Users, value: "Practical", label: "Team Collaboration" },
  { icon: ShieldCheck, value: "Secure", label: "Delivery Focus" },
  { icon: Clock, value: "Ongoing", label: "Technical Support" },
];

const splitValue = (value) => {
  const match = value.match(/^(\d+)([+%])?$/);
  if (!match) return [value, ""];
  return [match[1], match[2] ?? ""];
};

export default function Stats() {
  return (
    <section className="text-white">
      <div className="mx-auto grid min-w-0 max-w-7xl grid-cols-2 gap-3 px-3 py-8 sm:gap-4 sm:px-5 sm:py-10 md:grid-cols-4 md:gap-6 md:py-12">
        {stats.map(({ icon: Icon, value, label }) => (
          <div
            key={label}
            className="group flex min-w-0 flex-col items-center gap-2 rounded-2xl border border-white/10 bg-[#06243f] p-3 text-center transition-all duration-300 ease-out sm:flex-row sm:items-center sm:gap-4 sm:rounded-4xl sm:p-5 sm:text-left md:p-6 md:hover:-translate-y-1 md:hover:shadow-2xl"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F4D7B2]/20 text-[#F4D7B2] sm:h-14 sm:w-14 sm:rounded-3xl">
              <Icon className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>
            <div className="min-w-0">
              {(() => {
                const [main, suffix] = splitValue(value);
                return (
                  <h3 className="text-xl font-black tracking-tight transition-transform duration-300 sm:text-2xl group-hover:scale-105">
                    {main}
                    {suffix && (
                      <span className="stat-suffix ml-1 inline-block text-[#F4D7B2]">
                        {suffix}
                      </span>
                    )}
                  </h3>
                );
              })()}
              <p className="mt-0.5 text-xs leading-snug text-slate-200 transition-colors duration-300 sm:mt-1 sm:text-sm group-hover:text-white">
                {label}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
