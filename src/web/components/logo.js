import Link from "next/link";

export function Logo({ inverse = false }) {
  return <Link className={`logo${inverse ? " logo-inverse" : ""}`} href="/" aria-label="Simple YTH Startseite">
    <span className="logo-tile">Simple</span><span className="logo-name">YTH</span>
  </Link>;
}
