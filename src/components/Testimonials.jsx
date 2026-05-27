{
  /* Descending connected lines under the statement */
}
<div className="relative mt-7 pl-10 sm:pl-12">
  {/* Vertical connector line */}
  <span className="absolute left-5 top-0 h-full w-[3px] rounded-full bg-[#06243f] dark:bg-[#8B5E3C]" />

  <div className="space-y-3">
    {descendingLines.map((widthClass, index) => (
      <motion.div
        key={widthClass}
        initial={{ scaleX: 0, opacity: 0 }}
        whileInView={{ scaleX: 1, opacity: 1 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{
          duration: 0.55,
          delay: index * 0.08,
          ease: "easeOut",
        }}
        className={`relative flex origin-left items-center ${widthClass}`}
      >
        {/* Small connector from vertical line to horizontal line */}
        <span className="absolute -left-5 h-[3px] w-5 rounded-full bg-[#06243f] dark:bg-[#8B5E3C]" />

        {/* Brown descending horizontal line */}
        <span className="block h-[3px] flex-1 rounded-full bg-[#8B5E3C]" />
      </motion.div>
    ))}
  </div>
</div>;
