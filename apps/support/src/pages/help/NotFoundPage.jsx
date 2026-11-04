import { Link } from "react-router";
import { usePageTitle } from "../../lib/usePageTitle.js";
import { HelpPage, SearchBox, StillNeedHelp } from "./HelpLayout.jsx";

export default function NotFoundPage() {
  usePageTitle("Page not found");
  return (
    <HelpPage title="Page not found" intro="It may have moved. Try searching for what you need.">
      <SearchBox />
      <p className="mt-4">
        <Link to="/" className="text-[var(--bluecore-primary)] hover:underline">← Help center home</Link>
      </p>
      <StillNeedHelp />
    </HelpPage>
  );
}
