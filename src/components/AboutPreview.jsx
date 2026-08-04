export default function AboutPreview() {
  return (
    <section
      id="about"
      className="mx-auto grid min-w-0 max-w-7xl items-center gap-8 px-3 py-12 text-[#0F172A] sm:gap-10 sm:px-5 sm:py-16 lg:grid-cols-2 lg:gap-12 lg:py-20 dark:text-[#FAFAFA]"
    >
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-widest text-[#103759] dark:text-[#93c5fd] sm:text-sm">
          Who We Are
        </p>

        <h2 className="mt-3 text-2xl font-black leading-tight text-balance sm:mt-4 sm:text-3xl md:text-4xl lg:text-5xl">
          Building the Future with{" "}
          <span className="text-[#103759] dark:text-[#06243f]">Intelligence</span> and{" "}
          <span className="text-[#8B5E3C]">Integrity.</span>
        </h2>

        <p className="mt-4 text-sm leading-7 text-[#475569] text-pretty dark:text-[#FAFAFA]/80 sm:mt-6 sm:text-base sm:leading-8">
          Bluecore Software PLC is a technology company focused on designing,
          developing, and supporting practical digital solutions for businesses,
          organizations, and institutions.
        </p>

        <a
          href="#portfolio"
          className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[#103759] px-6 py-3 text-center text-sm font-semibold text-white hover:bg-[#0A3A84] active:bg-[#082F6B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1976D2] focus-visible:ring-offset-2 sm:mt-8 sm:w-auto sm:min-h-0 sm:text-base dark:bg-[#8B5E3C] dark:hover:bg-[#A0694A]"
        >
          Learn More About Us
        </a>
      </div>

      <div className="min-w-0 rounded-2xl border border-[#DCE5EF] bg-white p-4 shadow-[0_18px_45px_rgba(15,23,42,0.08)] sm:rounded-3xl sm:p-6 dark:border-transparent dark:bg-[#8B5E3C] dark:shadow-xl">
        <div className="rounded-xl border-l-4 border-[#103759] bg-[#EEF4FB] p-5 text-[#06243F] sm:rounded-2xl sm:p-8 dark:border-l-0 dark:bg-[#161110] dark:text-white">
          <h3 className="text-xl font-bold text-[#06243F] sm:text-2xl dark:text-white">
            Our Core Promise
          </h3>
          <p className="mt-3 text-sm leading-7 text-[#475569] sm:mt-4 sm:text-base sm:leading-7 dark:text-white/80">
            We do not only write code. We design systems that are secure,
            scalable, maintainable, and useful in real business operations.
          </p>
        </div>
      </div>
    </section>
  );
}
